"use server";

import {
  events,
  and,
  campusLocations,
  db,
  desc,
  eq,
  eventReports,
  eventTags,
  friendships,
  gt,
  inArray,
  ne,
  notifications,
  or,
  orgFollowers,
  orgMembers,
  organizations,
  rsvps,
  savedEvents,
  sql,
  userInterests,
  users,
} from "@the-forum/database";
import { revalidatePath } from "next/cache";
import { auth } from "~/auth";
import {
  type ExploreExperience,
  type ExploreShelf,
  type FeedEvent,
  type MyWeekSummary,
  type OrganizerAnalytics,
  type RecommendationInteractionInput,
  type SuggestedOrg,
  type WeeklyBriefing,
  buildExploreExperience,
  dismissEventForUser,
  ensureWeeklyBriefingNotification,
  getOrganizerAnalyticsForEvent,
  getRecentRecommendationDiagnostics,
  recordEventInteractions,
} from "~/lib/server/recommendations";

export type {
  ExploreExperience,
  ExploreShelf,
  FeedEvent,
  MyWeekSummary,
  OrganizerAnalytics,
  RecommendationInteractionInput,
  SuggestedOrg,
  WeeklyBriefing,
} from "~/lib/server/recommendations";

export async function getFeedEvents(params?: {
  search?: string;
  tags?: string[];
  orgCategory?: string;
  locationId?: string;
  dateRange?: "today" | "week" | "month";
  limit?: number;
  offset?: number;
}): Promise<{ events: FeedEvent[]; total: number }> {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  const experience = await getExploreExperience(params);
  const flattenedEvents = experience.sections.flatMap((section) => section.events);

  return {
    events: flattenedEvents.slice(offset, offset + limit),
    total: experience.totalCandidates,
  };
}

export async function getExploreExperience(params?: {
  search?: string;
  tags?: string[];
  orgCategory?: string;
  locationId?: string;
  dateRange?: "today" | "week" | "month";
}): Promise<ExploreExperience> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const experience = await buildExploreExperience(session.user.id, params);
  await ensureWeeklyBriefingNotification(session.user.id, experience.weeklyBriefing);
  return experience;
}

export async function trackEventInteractions(
  inputs: RecommendationInteractionInput[],
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await recordEventInteractions(session.user.id, inputs);
}

export async function dismissEvent(
  eventId: string,
  params?: { reason?: string; shelf?: string | null },
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dismissEventForUser(session.user.id, eventId, "explore", params?.shelf, params?.reason);
  revalidatePath("/explore");
}

export async function getRecommendationDiagnostics(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return getRecentRecommendationDiagnostics(session.user.id, limit);
}

async function getAcceptedFriendIds(userId: string) {
  const [sentRows, receivedRows] = await Promise.all([
    db
      .select({ friendId: friendships.friendId })
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted"))),
    db
      .select({ friendId: friendships.userId })
      .from(friendships)
      .where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted"))),
  ]);

  return [...sentRows.map((row) => row.friendId), ...receivedRows.map((row) => row.friendId)];
}

async function getRelevantFriendRecipients(actorId: string, eventId: string) {
  const friendIds = await getAcceptedFriendIds(actorId);
  if (friendIds.length === 0) return [];

  const [event] = await db
    .select({ orgId: events.orgId, isPublic: events.isPublic })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event?.isPublic) return [];

  const tagRows = await db
    .select({ tag: eventTags.tag })
    .from(eventTags)
    .where(eq(eventTags.eventId, eventId));

  const tagValues = tagRows.map((row) => row.tag);
  const relevanceConditions = [];

  if (event.orgId) {
    relevanceConditions.push(
      inArray(
        users.id,
        db
          .select({ userId: orgFollowers.userId })
          .from(orgFollowers)
          .where(eq(orgFollowers.orgId, event.orgId)),
      ),
    );
  }

  if (tagValues.length > 0) {
    relevanceConditions.push(
      inArray(
        users.id,
        db
          .select({ userId: userInterests.userId })
          .from(userInterests)
          .where(inArray(userInterests.tag, tagValues)),
      ),
    );
  }

  if (relevanceConditions.length === 0) {
    return friendIds;
  }

  const relevanceFilter =
    relevanceConditions.length === 1 ? relevanceConditions[0] : or(...relevanceConditions);

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, friendIds), relevanceFilter));

  return rows.map((row) => row.id);
}

async function createSocialActivityNotifications(
  actorId: string,
  eventId: string,
  interactionType: "save" | "rsvp",
) {
  const [actor, event, recipientIds] = await Promise.all([
    db.select({ displayName: users.displayName }).from(users).where(eq(users.id, actorId)).limit(1),
    db.select({ title: events.title }).from(events).where(eq(events.id, eventId)).limit(1),
    getRelevantFriendRecipients(actorId, eventId),
  ]);

  if (!actor[0] || !event[0] || recipientIds.length === 0) return;

  const existingRows = await db
    .select({ userId: notifications.userId })
    .from(notifications)
    .where(
      and(
        inArray(notifications.userId, recipientIds),
        eq(notifications.type, "social_activity"),
        sql`${notifications.payload}->>'actorId' = ${actorId}`,
        sql`${notifications.payload}->>'eventId' = ${eventId}`,
        sql`${notifications.payload}->>'interactionType' = ${interactionType}`,
      ),
    );

  const existingUserIds = new Set(existingRows.map((row) => row.userId));
  const newRecipientIds = recipientIds.filter((recipientId) => !existingUserIds.has(recipientId));

  if (newRecipientIds.length === 0) return;

  await db.insert(notifications).values(
    newRecipientIds.map((userId) => ({
      userId,
      type: "social_activity" as const,
      payload: {
        actorId,
        actorName: actor[0]?.displayName,
        eventId,
        eventTitle: event[0]?.title,
        interactionType,
      },
    })),
  );
}

export async function toggleRsvp(
  eventId: string,
  context?: Omit<RecommendationInteractionInput, "eventId" | "interactionType">,
): Promise<{ rsvped: boolean; count: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.userId, userId), eq(rsvps.eventId, eventId)))
    .limit(1);

  if (existing) {
    await db.delete(rsvps).where(and(eq(rsvps.userId, userId), eq(rsvps.eventId, eventId)));
  } else {
    await db.insert(rsvps).values({ userId, eventId });
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rsvps)
    .where(eq(rsvps.eventId, eventId));

  revalidatePath("/explore");
  revalidatePath(`/events/${eventId}`);

  if (context) {
    await recordEventInteractions(userId, [
      {
        eventId,
        interactionType: existing ? "unrsvp" : "rsvp",
        surface: context.surface,
        shelf: context.shelf,
        rankingSnapshotId: context.rankingSnapshotId,
        reasonCodes: context.reasonCodes,
        metadata: context.metadata,
      },
    ]);
  }

  if (!existing) {
    await createSocialActivityNotifications(userId, eventId, "rsvp");
  }

  return {
    rsvped: !existing,
    count: countResult?.count ?? 0,
  };
}

export async function toggleSave(
  eventId: string,
  context?: Omit<RecommendationInteractionInput, "eventId" | "interactionType">,
): Promise<{ saved: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);

  if (existing) {
    await db
      .delete(savedEvents)
      .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)));
  } else {
    await db.insert(savedEvents).values({ userId, eventId });
  }

  revalidatePath("/explore");
  revalidatePath(`/events/${eventId}`);

  if (context) {
    await recordEventInteractions(userId, [
      {
        eventId,
        interactionType: existing ? "unsave" : "save",
        surface: context.surface,
        shelf: context.shelf,
        rankingSnapshotId: context.rankingSnapshotId,
        reasonCodes: context.reasonCodes,
        metadata: context.metadata,
      },
    ]);
  }

  if (!existing) {
    await createSocialActivityNotifications(userId, eventId, "save");
  }

  return { saved: !existing };
}

export async function reportEvent(
  eventId: string,
  reason: string,
): Promise<{ reported: true; alreadyReported: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error("Please include a reason for the report");
  }

  const reporterId = session.user.id;

  const [existingEvent] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!existingEvent) {
    throw new Error("Event not found");
  }

  const [existingReport] = await db
    .select({ id: eventReports.id })
    .from(eventReports)
    .where(and(eq(eventReports.eventId, eventId), eq(eventReports.reporterId, reporterId)))
    .limit(1);

  if (existingReport) {
    return { reported: true, alreadyReported: true };
  }

  await db.insert(eventReports).values({
    eventId,
    reporterId,
    reason: trimmedReason,
  });

  return { reported: true, alreadyReported: false };
}

// ── Event CRUD ────────────────────────────────────────────

export interface EventDetail {
  id: string;
  title: string;
  description: string;
  datetime: Date;
  endDatetime: Date | null;
  locationId: string;
  locationName: string;
  orgId: string | null;
  orgName: string | null;
  creatorId: string;
  creatorName: string;
  flyerUrl: string | null;
  externalLink: string | null;
  isPublic: boolean;
  tags: string[];
  rsvpCount: number;
  attendees: { id: string; displayName: string; avatarUrl: string | null }[];
  friendsAttending: { id: string; displayName: string; avatarUrl: string | null }[];
  isRsvped: boolean;
  isSaved: boolean;
  isOwner: boolean;
  organizerInsights: OrganizerAnalytics | null;
}

export async function getEvent(eventId: string): Promise<EventDetail | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      datetime: events.datetime,
      endDatetime: events.endDatetime,
      locationId: events.locationId,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
      creatorId: events.creatorId,
      creatorName: users.displayName,
      flyerUrl: events.flyerUrl,
      externalLink: events.externalLink,
      isPublic: events.isPublic,
    })
    .from(events)
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .innerJoin(users, eq(events.creatorId, users.id))
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return null;

  // Get tags
  const tags = await db
    .select({ tag: eventTags.tag })
    .from(eventTags)
    .where(eq(eventTags.eventId, eventId));

  // Get RSVP count + attendees
  const attendees = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.userId, users.id))
    .where(eq(rsvps.eventId, eventId));

  // Get friend IDs
  const friendRows = await db
    .select({ friendId: friendships.friendId })
    .from(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")));
  const reverseFriendRows = await db
    .select({ friendId: friendships.userId })
    .from(friendships)
    .where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted")));
  const friendIdSet = new Set([
    ...friendRows.map((f) => f.friendId),
    ...reverseFriendRows.map((f) => f.friendId),
  ]);

  const friendsAttending = attendees.filter((a) => friendIdSet.has(a.id));

  // Check user RSVP + save
  const [userRsvp] = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.userId, userId), eq(rsvps.eventId, eventId)))
    .limit(1);

  const [userSave] = await db
    .select()
    .from(savedEvents)
    .where(and(eq(savedEvents.userId, userId), eq(savedEvents.eventId, eventId)))
    .limit(1);

  const tagNames = tags.map((t) => t.tag);
  const organizerInsights =
    event.creatorId === userId
      ? await getOrganizerAnalyticsForEvent(eventId, {
          title: event.title,
          description: event.description,
          tags: tagNames,
          flyerUrl: event.flyerUrl,
          externalLink: event.externalLink,
          endDatetime: event.endDatetime,
          orgId: event.orgId,
          isPublic: event.isPublic,
        })
      : null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    datetime: event.datetime,
    endDatetime: event.endDatetime,
    locationId: event.locationId,
    locationName: event.locationName ?? "TBD",
    orgId: event.orgId,
    orgName: event.orgName,
    creatorId: event.creatorId,
    creatorName: event.creatorName,
    flyerUrl: event.flyerUrl,
    externalLink: event.externalLink,
    isPublic: event.isPublic,
    tags: tagNames,
    rsvpCount: attendees.length,
    attendees,
    friendsAttending,
    isRsvped: !!userRsvp,
    isSaved: !!userSave,
    isOwner: event.creatorId === userId,
    organizerInsights,
  };
}

export async function getSimilarEvents(
  eventId: string,
  tags: string[],
  orgId: string | null,
): Promise<FeedEvent[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conditions = [gt(events.datetime, new Date())];

  // Events with matching tags or same org, excluding current event
  const tagFilter =
    tags.length > 0
      ? inArray(
          events.id,
          db
            .select({ eventId: eventTags.eventId })
            .from(eventTags)
            .where(inArray(eventTags.tag, tags as (typeof eventTags.$inferSelect.tag)[])),
        )
      : undefined;

  const orgFilter = orgId ? eq(events.orgId, orgId) : undefined;

  const matchFilter = tagFilter && orgFilter ? or(tagFilter, orgFilter) : (tagFilter ?? orgFilter);

  if (matchFilter) {
    conditions.push(matchFilter);
  }

  const rawEvents = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      flyerUrl: events.flyerUrl,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
    })
    .from(events)
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(and(...conditions, sql`${events.id} != ${eventId}`))
    .orderBy(events.datetime)
    .limit(4);

  return rawEvents.map((event) => ({
    id: event.id,
    title: event.title,
    orgId: event.orgId,
    orgName: event.orgName,
    datetime: event.datetime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    location: event.locationName ?? "TBD",
    tags: [],
    flyerUrl: event.flyerUrl,
    rsvpCount: 0,
    friendsAttending: [],
    isRsvped: false,
    isSaved: false,
  }));
}

type EventTagValue = typeof eventTags.$inferSelect.tag;

export async function createEvent(data: {
  title: string;
  description: string;
  datetime: string;
  endDatetime?: string;
  locationId: string;
  orgId?: string;
  tags: string[];
  flyerUrl?: string;
  externalLink?: string;
  isPublic?: boolean;
}): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const creatorId = session.user.id;

  if (data.orgId) {
    const [membership] = await db
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, data.orgId),
          eq(orgMembers.userId, creatorId),
          inArray(orgMembers.role, ["owner", "officer"]),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new Error("Not authorized to create events for this organization");
    }
  }

  const [event] = await db
    .insert(events)
    .values({
      title: data.title,
      description: data.description,
      datetime: new Date(data.datetime),
      endDatetime: data.endDatetime ? new Date(data.endDatetime) : null,
      locationId: data.locationId,
      orgId: data.orgId ?? null,
      creatorId,
      flyerUrl: data.flyerUrl ?? null,
      externalLink: data.externalLink ?? null,
      isPublic: data.isPublic ?? true,
    })
    .returning({ id: events.id });

  if (!event) throw new Error("Failed to create event");

  // Insert tags
  if (data.tags.length > 0) {
    await db.insert(eventTags).values(
      data.tags.map((tag) => ({
        eventId: event.id,
        tag: tag as EventTagValue,
      })),
    );
  }

  // Notify org followers about new event (exclude creator)
  if (data.orgId && (data.isPublic ?? true)) {
    const [organization] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, data.orgId))
      .limit(1);

    const followers = await db
      .select({ userId: orgFollowers.userId })
      .from(orgFollowers)
      .where(and(eq(orgFollowers.orgId, data.orgId), ne(orgFollowers.userId, creatorId)));

    if (followers.length > 0) {
      await db.insert(notifications).values(
        followers.map((f) => ({
          userId: f.userId,
          type: "org_new_event" as const,
          payload: {
            eventId: event.id,
            eventTitle: data.title,
            orgId: data.orgId,
            orgName: organization?.name ?? null,
          },
        })),
      );
    }
  }

  revalidatePath("/explore");
  revalidatePath("/events");

  return { id: event.id };
}

export async function updateEvent(
  eventId: string,
  data: {
    title: string;
    description: string;
    datetime: string;
    endDatetime?: string;
    locationId: string;
    tags: string[];
    flyerUrl?: string;
    externalLink?: string;
    isPublic?: boolean;
  },
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership
  const [event] = await db
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.creatorId !== session.user.id) {
    throw new Error("Not authorized to edit this event");
  }

  await db
    .update(events)
    .set({
      title: data.title,
      description: data.description,
      datetime: new Date(data.datetime),
      endDatetime: data.endDatetime ? new Date(data.endDatetime) : null,
      locationId: data.locationId,
      flyerUrl: data.flyerUrl ?? null,
      externalLink: data.externalLink ?? null,
      isPublic: data.isPublic ?? true,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  // Replace tags
  await db.delete(eventTags).where(eq(eventTags.eventId, eventId));
  if (data.tags.length > 0) {
    await db.insert(eventTags).values(
      data.tags.map((tag) => ({
        eventId,
        tag: tag as EventTagValue,
      })),
    );
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/explore");
  revalidatePath("/events");
}

export async function deleteEvent(eventId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [event] = await db
    .select({ creatorId: events.creatorId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.creatorId !== session.user.id) {
    throw new Error("Not authorized to delete this event");
  }

  await db.delete(events).where(eq(events.id, eventId));

  revalidatePath("/explore");
  revalidatePath("/events");
}

export async function getMyEvents(): Promise<{
  created: FeedEvent[];
  rsvped: FeedEvent[];
  saved: FeedEvent[];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Events the user created
  const createdEvents = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      flyerUrl: events.flyerUrl,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
    })
    .from(events)
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(eq(events.creatorId, userId))
    .orderBy(events.datetime);

  // Events the user RSVP'd to
  const rsvpedEvents = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      flyerUrl: events.flyerUrl,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
    })
    .from(rsvps)
    .innerJoin(events, eq(rsvps.eventId, events.id))
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(eq(rsvps.userId, userId))
    .orderBy(events.datetime);

  // Events the user saved
  const savedEventsResult = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      flyerUrl: events.flyerUrl,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
    })
    .from(savedEvents)
    .innerJoin(events, eq(savedEvents.eventId, events.id))
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(eq(savedEvents.userId, userId))
    .orderBy(events.datetime);

  const mapEvent = (e: (typeof createdEvents)[0]): FeedEvent => ({
    id: e.id,
    title: e.title,
    orgId: e.orgId,
    orgName: e.orgName,
    datetime: e.datetime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    location: e.locationName ?? "TBD",
    tags: [],
    flyerUrl: e.flyerUrl,
    rsvpCount: 0,
    friendsAttending: [],
    isRsvped: false,
    isSaved: false,
  });

  return {
    created: createdEvents.map(mapEvent),
    rsvped: rsvpedEvents.map(mapEvent),
    saved: savedEventsResult.map(mapEvent),
  };
}

export async function getCampusLocations(): Promise<
  { id: string; name: string; category: string }[]
> {
  return db
    .select({
      id: campusLocations.id,
      name: campusLocations.name,
      category: campusLocations.category,
    })
    .from(campusLocations)
    .orderBy(campusLocations.name);
}

export async function getSavedEvents(): Promise<FeedEvent[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const saved = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      flyerUrl: events.flyerUrl,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
    })
    .from(savedEvents)
    .innerJoin(events, eq(savedEvents.eventId, events.id))
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(eq(savedEvents.userId, userId))
    .orderBy(events.datetime)
    .limit(5);

  return saved.map((event) => ({
    id: event.id,
    title: event.title,
    orgId: event.orgId,
    orgName: event.orgName,
    datetime: event.datetime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    location: event.locationName ?? "TBD",
    tags: [],
    flyerUrl: event.flyerUrl,
    rsvpCount: 0,
    friendsAttending: [],
    isRsvped: false,
    isSaved: true,
  }));
}

export interface FriendsEvent extends FeedEvent {
  friendCount: number;
}

export async function getFriendsEvents(): Promise<FriendsEvent[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Get friend IDs (bidirectional)
  const friendRows = await db
    .select({ friendId: friendships.friendId })
    .from(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")));
  const reverseFriendRows = await db
    .select({ friendId: friendships.userId })
    .from(friendships)
    .where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted")));
  const friendIds = [
    ...friendRows.map((f) => f.friendId),
    ...reverseFriendRows.map((f) => f.friendId),
  ];

  if (friendIds.length === 0) return [];

  // Find upcoming events where friends have RSVP'd, with friend count
  const friendsEvents = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      flyerUrl: events.flyerUrl,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
      friendCount: sql<number>`count(distinct ${rsvps.userId})::int`.as("friend_count"),
    })
    .from(rsvps)
    .innerJoin(events, eq(rsvps.eventId, events.id))
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(and(inArray(rsvps.userId, friendIds), gt(events.datetime, new Date())))
    .groupBy(
      events.id,
      events.title,
      events.datetime,
      events.flyerUrl,
      events.orgId,
      campusLocations.name,
      organizations.name,
    )
    .orderBy(desc(sql`friend_count`), events.datetime)
    .limit(20);

  return friendsEvents.map((event) => ({
    id: event.id,
    title: event.title,
    orgId: event.orgId,
    orgName: event.orgName,
    datetime: event.datetime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    location: event.locationName ?? "TBD",
    tags: [],
    flyerUrl: event.flyerUrl,
    rsvpCount: 0,
    friendsAttending: [],
    isRsvped: false,
    isSaved: false,
    friendCount: event.friendCount,
  }));
}
