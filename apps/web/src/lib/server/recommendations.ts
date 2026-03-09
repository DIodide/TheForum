import {
  events,
  and,
  campusLocations,
  db,
  desc,
  dismissedEvents,
  eq,
  eventFeedFeatures,
  eventInteractions,
  eventTags,
  gt,
  inArray,
  notifications,
  orgFollowers,
  organizations,
  rankingSnapshots,
  rsvps,
  savedEvents,
  sql,
  userFeedFeatures,
  userInterests,
  users,
} from "@the-forum/database";
import {
  type EventQualityInput,
  type EventQualityReport,
  getEventQualityReport,
  getOrganizerInsightSuggestions,
} from "~/lib/event-quality";

export type RecommendationSurface =
  | "explore"
  | "event_detail"
  | "my_week"
  | "notification"
  | "weekly_briefing"
  | "organizer";

export type InteractionType =
  | "impression"
  | "detail_open"
  | "save"
  | "unsave"
  | "rsvp"
  | "unrsvp"
  | "share"
  | "calendar_export"
  | "dismiss";

export interface RecommendationReason {
  code:
    | "friend_attendance"
    | "interest_match"
    | "followed_org"
    | "campus_popular"
    | "happening_soon"
    | "new_event"
    | "strong_quality"
    | "starter_pick";
  label: string;
}

export interface FeedEvent {
  id: string;
  title: string;
  orgId: string | null;
  orgName: string | null;
  datetime: string;
  location: string;
  tags: string[];
  flyerUrl: string | null;
  rsvpCount: number;
  savedCount?: number;
  detailOpenCount?: number;
  friendsAttending: { id: string; displayName: string; avatarUrl: string | null }[];
  isRsvped: boolean;
  isSaved: boolean;
  score?: number;
  qualityScore?: number;
  rankingSnapshotId?: string | null;
  shelf?: string | null;
  reasons?: RecommendationReason[];
}

export interface ExploreShelf {
  id: string;
  title: string;
  description: string;
  events: FeedEvent[];
}

export interface WeeklyBriefing {
  title: string;
  description: string;
  events: FeedEvent[];
}

export interface SuggestedOrg {
  id: string;
  name: string;
  category: string;
}

export interface MyWeekSummary {
  upcoming: FeedEvent[];
  socialHighlights: FeedEvent[];
  suggestedOrgs: SuggestedOrg[];
  savedCount: number;
  rsvpedCount: number;
  createdCount: number;
  followedOrgCount: number;
}

export interface ExploreExperience {
  sections: ExploreShelf[];
  weeklyBriefing: WeeklyBriefing | null;
  myWeek: MyWeekSummary;
  totalCandidates: number;
  dismissedCount: number;
  coldStart: boolean;
}

export interface RecommendationInteractionInput {
  eventId: string;
  interactionType: InteractionType;
  surface: RecommendationSurface;
  shelf?: string | null;
  rankingSnapshotId?: string | null;
  reasonCodes?: RecommendationReason["code"][];
  metadata?: Record<string, unknown>;
}

export interface OrganizerAnalytics {
  quality: EventQualityReport;
  impressionCount: number;
  detailOpenCount: number;
  saveCount: number;
  rsvpCount: number;
  shareCount: number;
  exportCount: number;
  dismissCount: number;
  clickThroughRate: number;
  saveRate: number;
  rsvpRate: number;
  suggestions: string[];
  lastAggregatedAt: string | null;
}

interface ExploreFilters {
  search?: string;
  tags?: string[];
  orgCategory?: string;
  locationId?: string;
  dateRange?: "today" | "week" | "month";
}

interface UserRecommendationContext {
  userId: string;
  interestTags: string[];
  friendIds: string[];
  followedOrgIds: string[];
  interactionCount: number;
  coldStart: boolean;
}

interface CandidateEventRow {
  id: string;
  title: string;
  description: string;
  datetime: Date;
  endDatetime: Date | null;
  createdAt: Date;
  locationId: string;
  locationName: string | null;
  orgId: string | null;
  orgName: string | null;
  flyerUrl: string | null;
  externalLink: string | null;
  isPublic: boolean;
}

const REASON_LABELS: Record<RecommendationReason["code"], (input?: number) => string> = {
  friend_attendance: (input) => `${input ?? 1} friend${input === 1 ? "" : "s"} going`,
  interest_match: () => "Matches your interests",
  followed_org: () => "From an org you follow",
  campus_popular: () => "Trending on campus",
  happening_soon: () => "Happening soon",
  new_event: () => "New this week",
  strong_quality: () => "Strong event details",
  starter_pick: () => "Good place to start",
};

function ensureDate(value: Date | string | number) {
  const normalized = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error(`Invalid datetime value: ${String(value)}`);
  }

  return normalized;
}

function formatEventDate(datetime: Date | string | number) {
  return ensureDate(datetime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTimeProximityScore(datetime: Date | string | number) {
  const daysUntil = (ensureDate(datetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 1) return 1;
  if (daysUntil <= 3) return 0.85;
  if (daysUntil <= 7) return 0.65;
  if (daysUntil <= 14) return 0.35;
  return 0.12;
}

function getRecencyBoost(createdAt: Date | string | number) {
  const hoursSinceCreated = (Date.now() - ensureDate(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreated <= 24) return 1;
  if (hoursSinceCreated <= 72) return 0.55;
  return 0;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function buildReasonList(input: {
  coldStart: boolean;
  friendCount: number;
  interestOverlap: number;
  isFollowedOrg: boolean;
  rsvpCount: number;
  qualityScore: number;
  datetime: Date;
  createdAt: Date;
}): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];

  if (input.friendCount > 0) {
    reasons.push({
      code: "friend_attendance",
      label: REASON_LABELS.friend_attendance(Math.min(input.friendCount, 3)),
    });
  }

  if (input.interestOverlap >= 0.34) {
    reasons.push({
      code: "interest_match",
      label: REASON_LABELS.interest_match(),
    });
  }

  if (input.isFollowedOrg) {
    reasons.push({
      code: "followed_org",
      label: REASON_LABELS.followed_org(),
    });
  }

  if (input.rsvpCount >= 8) {
    reasons.push({
      code: "campus_popular",
      label: REASON_LABELS.campus_popular(),
    });
  }

  if (getTimeProximityScore(input.datetime) >= 0.85) {
    reasons.push({
      code: "happening_soon",
      label: REASON_LABELS.happening_soon(),
    });
  }

  if (getRecencyBoost(input.createdAt) >= 0.55) {
    reasons.push({
      code: "new_event",
      label: REASON_LABELS.new_event(),
    });
  }

  if (input.qualityScore >= 80) {
    reasons.push({
      code: "strong_quality",
      label: REASON_LABELS.strong_quality(),
    });
  }

  if (input.coldStart && reasons.length < 2) {
    reasons.push({
      code: "starter_pick",
      label: REASON_LABELS.starter_pick(),
    });
  }

  return reasons.slice(0, 3);
}

function computeScore(input: {
  interestOverlap: number;
  friendCount: number;
  isFollowedOrg: boolean;
  qualityScore: number;
  rsvpCount: number;
  savedCount: number;
  detailOpenCount: number;
  datetime: Date;
  createdAt: Date;
}) {
  const friendScore = clamp(input.friendCount / 3);
  const followBoost = input.isFollowedOrg ? 1 : 0;
  const momentum = clamp(
    (input.rsvpCount * 1.8 + input.savedCount * 1.4 + input.detailOpenCount * 0.25) / 18,
  );
  const qualityBoost = clamp(input.qualityScore / 100);

  return (
    3.2 * input.interestOverlap +
    4.2 * friendScore +
    2.4 * followBoost +
    2.1 * getTimeProximityScore(input.datetime) +
    1.6 * momentum +
    0.9 * qualityBoost +
    0.5 * getRecencyBoost(input.createdAt)
  );
}

async function getFriendIds(userId: string) {
  const friendRows = await db.execute(sql`
    select distinct friend_id as "friendId"
    from (
      select ${sql.raw("friend_id")} as friend_id
      from friendships
      where user_id = ${userId} and status = 'accepted'
      union
      select ${sql.raw("user_id")} as friend_id
      from friendships
      where friend_id = ${userId} and status = 'accepted'
    ) as friendships
  `);

  return friendRows.map((row) => String((row as { friendId: string }).friendId));
}

async function getUserContext(userId: string): Promise<UserRecommendationContext> {
  const [interests, followedOrgs, featureRow] = await Promise.all([
    db
      .select({ tag: userInterests.tag })
      .from(userInterests)
      .where(eq(userInterests.userId, userId)),
    db
      .select({ orgId: orgFollowers.orgId })
      .from(orgFollowers)
      .where(eq(orgFollowers.userId, userId)),
    db.select().from(userFeedFeatures).where(eq(userFeedFeatures.userId, userId)).limit(1),
  ]);

  const friendIds = await getFriendIds(userId);
  const followedOrgIds = followedOrgs.map((row) => row.orgId);
  const interactionCount =
    (featureRow[0]?.detailOpenCount ?? 0) +
    (featureRow[0]?.saveCount ?? 0) +
    (featureRow[0]?.rsvpCount ?? 0) +
    (featureRow[0]?.shareCount ?? 0) +
    (featureRow[0]?.exportCount ?? 0);

  return {
    userId,
    interestTags: interests.map((row) => row.tag),
    friendIds,
    followedOrgIds,
    interactionCount,
    coldStart: interactionCount < 5,
  };
}

async function getDismissedEventIds(userId: string) {
  const rows = await db
    .select({ eventId: dismissedEvents.eventId })
    .from(dismissedEvents)
    .where(eq(dismissedEvents.userId, userId));

  return rows.map((row) => row.eventId);
}

async function getSuggestedOrgs(userId: string, interestTags: string[], followedOrgIds: string[]) {
  if (interestTags.length === 0) return [];

  const suggestions = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      category: organizations.category,
      overlapCount: sql<number>`count(distinct ${eventTags.tag})::int`.as("overlap_count"),
    })
    .from(organizations)
    .innerJoin(events, eq(events.orgId, organizations.id))
    .innerJoin(eventTags, eq(eventTags.eventId, events.id))
    .where(
      and(
        inArray(eventTags.tag, interestTags as (typeof eventTags.$inferSelect.tag)[]),
        followedOrgIds.length > 0
          ? sql`${organizations.id} not in (${sql.join(
              followedOrgIds.map((orgId) => sql`${orgId}`),
              sql`, `,
            )})`
          : undefined,
      ),
    )
    .groupBy(organizations.id, organizations.name, organizations.category)
    .orderBy(desc(sql`overlap_count`))
    .limit(3);

  return suggestions.map((org) => ({
    id: org.id,
    name: org.name,
    category: org.category,
  }));
}

async function getCandidateRows(
  userId: string,
  params: ExploreFilters,
): Promise<{ rows: CandidateEventRow[]; dismissedCount: number }> {
  const conditions = [gt(events.datetime, new Date()), eq(events.isPublic, true)];
  const dismissedIds = await getDismissedEventIds(userId);

  if (params.search) {
    conditions.push(
      sql`(${events.title} ilike ${`%${params.search}%`} or ${events.description} ilike ${`%${params.search}%`})`,
    );
  }

  if (params.tags && params.tags.length > 0) {
    const taggedEventIds = db
      .select({ eventId: eventTags.eventId })
      .from(eventTags)
      .where(inArray(eventTags.tag, params.tags as (typeof eventTags.$inferSelect.tag)[]));
    conditions.push(inArray(events.id, taggedEventIds));
  }

  if (params.orgCategory) {
    const orgIds = db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        eq(
          organizations.category,
          params.orgCategory as typeof organizations.$inferSelect.category,
        ),
      );
    conditions.push(inArray(events.orgId, orgIds));
  }

  if (params.locationId) {
    conditions.push(eq(events.locationId, params.locationId));
  }

  if (params.dateRange) {
    const now = new Date();
    const end =
      params.dateRange === "today"
        ? new Date(new Date().setHours(23, 59, 59, 999))
        : params.dateRange === "week"
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    conditions.push(sql`${events.datetime} <= ${end}`);
  }

  if (dismissedIds.length > 0) {
    conditions.push(
      sql`${events.id} not in (${sql.join(
        dismissedIds.map((eventId) => sql`${eventId}`),
        sql`, `,
      )})`,
    );
  }

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      datetime: events.datetime,
      endDatetime: events.endDatetime,
      createdAt: events.createdAt,
      locationId: events.locationId,
      locationName: campusLocations.name,
      orgId: events.orgId,
      orgName: organizations.name,
      flyerUrl: events.flyerUrl,
      externalLink: events.externalLink,
      isPublic: events.isPublic,
    })
    .from(events)
    .leftJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(and(...conditions))
    .orderBy(events.datetime)
    .limit(120);

  return { rows, dismissedCount: dismissedIds.length };
}

function buildQualityInput(candidate: CandidateEventRow, tags: string[]): EventQualityInput {
  return {
    title: candidate.title,
    description: candidate.description,
    tags,
    flyerUrl: candidate.flyerUrl,
    externalLink: candidate.externalLink,
    endDatetime: candidate.endDatetime,
    orgId: candidate.orgId,
    isPublic: candidate.isPublic,
  };
}

async function loadBatchMaps(userId: string, candidates: CandidateEventRow[], friendIds: string[]) {
  const eventIds = candidates.map((candidate) => candidate.id);

  if (eventIds.length === 0) {
    return {
      tagsByEvent: new Map<string, string[]>(),
      rsvpCountByEvent: new Map<string, number>(),
      saveCountByEvent: new Map<string, number>(),
      detailOpenCountByEvent: new Map<string, number>(),
      friendAttendeesByEvent: new Map<
        string,
        { id: string; displayName: string; avatarUrl: string | null }[]
      >(),
      userRsvpIds: new Set<string>(),
      userSaveIds: new Set<string>(),
      featureByEvent: new Map<string, typeof eventFeedFeatures.$inferSelect>(),
    };
  }

  const [
    tags,
    rsvpCounts,
    saveCounts,
    userRsvps,
    userSaves,
    friendAttendees,
    eventFeatures,
    detailOpenCounts,
  ] = await Promise.all([
    db
      .select({ eventId: eventTags.eventId, tag: eventTags.tag })
      .from(eventTags)
      .where(inArray(eventTags.eventId, eventIds)),
    db
      .select({
        eventId: rsvps.eventId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(rsvps)
      .where(inArray(rsvps.eventId, eventIds))
      .groupBy(rsvps.eventId),
    db
      .select({
        eventId: savedEvents.eventId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(savedEvents)
      .where(inArray(savedEvents.eventId, eventIds))
      .groupBy(savedEvents.eventId),
    db
      .select({ eventId: rsvps.eventId })
      .from(rsvps)
      .where(and(eq(rsvps.userId, userId), inArray(rsvps.eventId, eventIds))),
    db
      .select({ eventId: savedEvents.eventId })
      .from(savedEvents)
      .where(and(eq(savedEvents.userId, userId), inArray(savedEvents.eventId, eventIds))),
    friendIds.length > 0
      ? db
          .select({
            eventId: rsvps.eventId,
            id: users.id,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(rsvps)
          .innerJoin(users, eq(rsvps.userId, users.id))
          .where(and(inArray(rsvps.eventId, eventIds), inArray(rsvps.userId, friendIds)))
      : Promise.resolve(
          [] as {
            eventId: string;
            id: string;
            displayName: string;
            avatarUrl: string | null;
          }[],
        ),
    db.select().from(eventFeedFeatures).where(inArray(eventFeedFeatures.eventId, eventIds)),
    db
      .select({
        eventId: eventInteractions.eventId,
        count:
          sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'detail_open')::int`.as(
            "count",
          ),
      })
      .from(eventInteractions)
      .where(inArray(eventInteractions.eventId, eventIds))
      .groupBy(eventInteractions.eventId),
  ]);

  const tagsByEvent = new Map<string, string[]>();
  const rsvpCountByEvent = new Map<string, number>();
  const saveCountByEvent = new Map<string, number>();
  const detailOpenCountByEvent = new Map<string, number>();
  const friendAttendeesByEvent = new Map<
    string,
    { id: string; displayName: string; avatarUrl: string | null }[]
  >();
  const featureByEvent = new Map<string, typeof eventFeedFeatures.$inferSelect>();

  for (const row of tags) {
    const existing = tagsByEvent.get(row.eventId) ?? [];
    existing.push(row.tag);
    tagsByEvent.set(row.eventId, existing);
  }

  for (const row of rsvpCounts) {
    rsvpCountByEvent.set(row.eventId, row.count);
  }

  for (const row of saveCounts) {
    saveCountByEvent.set(row.eventId, row.count);
  }

  for (const row of detailOpenCounts) {
    detailOpenCountByEvent.set(row.eventId, row.count);
  }

  for (const row of friendAttendees) {
    const existing = friendAttendeesByEvent.get(row.eventId) ?? [];
    existing.push({
      id: row.id,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
    });
    friendAttendeesByEvent.set(row.eventId, existing.slice(0, 3));
  }

  for (const row of eventFeatures) {
    featureByEvent.set(row.eventId, row);
  }

  return {
    tagsByEvent,
    rsvpCountByEvent,
    saveCountByEvent,
    detailOpenCountByEvent,
    friendAttendeesByEvent,
    userRsvpIds: new Set(userRsvps.map((row) => row.eventId)),
    userSaveIds: new Set(userSaves.map((row) => row.eventId)),
    featureByEvent,
  };
}

function dedupeSectionEvents(sectionEvents: FeedEvent[], seenIds: Set<string>) {
  return sectionEvents.filter((event) => {
    if (seenIds.has(event.id)) return false;
    seenIds.add(event.id);
    return true;
  });
}

async function persistRankingSnapshots(
  userId: string,
  sections: ExploreShelf[],
): Promise<Map<string, string>> {
  const snapshotRows = sections.flatMap((section) =>
    section.events.map((event, index) => ({
      userId,
      eventId: event.id,
      surface: "explore" as const,
      shelf: section.id,
      rank: index + 1,
      score: event.score ?? 0,
      reasonCodes: (event.reasons ?? []).map((reason) => reason.code),
      metadata: {
        title: event.title,
        orgId: event.orgId,
        tags: event.tags,
        qualityScore: event.qualityScore ?? 0,
        savedCount: event.savedCount ?? 0,
        detailOpenCount: event.detailOpenCount ?? 0,
        rsvpCount: event.rsvpCount,
        friendCount: event.friendsAttending.length,
      },
    })),
  );

  if (snapshotRows.length === 0) {
    return new Map();
  }

  const inserted = await db.insert(rankingSnapshots).values(snapshotRows).returning({
    id: rankingSnapshots.id,
    eventId: rankingSnapshots.eventId,
    shelf: rankingSnapshots.shelf,
  });

  return new Map(inserted.map((row) => [`${row.eventId}:${row.shelf ?? ""}`, row.id]));
}

function assignSnapshotIds(sections: ExploreShelf[], snapshotMap: Map<string, string>) {
  return sections.map((section) => ({
    ...section,
    events: section.events.map((event) => ({
      ...event,
      rankingSnapshotId: snapshotMap.get(`${event.id}:${section.id}`) ?? null,
      shelf: section.id,
    })),
  }));
}

function getWeeklyBriefing(events: FeedEvent[]): WeeklyBriefing | null {
  const briefingEvents = events.slice(0, 3);

  if (briefingEvents.length === 0) return null;

  return {
    title: "This week at a glance",
    description: "Three events with the best mix of relevance, momentum, and timing.",
    events: briefingEvents,
  };
}

export async function buildExploreExperience(
  userId: string,
  params: ExploreFilters = {},
): Promise<ExploreExperience> {
  const context = await getUserContext(userId);
  const { rows, dismissedCount } = await getCandidateRows(userId, params);
  const batch = await loadBatchMaps(userId, rows, context.friendIds);

  const followedOrgIds = new Set(context.followedOrgIds);
  const scoredEvents = rows.map((candidate) => {
    const tags = batch.tagsByEvent.get(candidate.id) ?? [];
    const rsvpCount = batch.rsvpCountByEvent.get(candidate.id) ?? 0;
    const savedCount = batch.saveCountByEvent.get(candidate.id) ?? 0;
    const detailOpenCount =
      batch.featureByEvent.get(candidate.id)?.detailOpenCount ??
      batch.detailOpenCountByEvent.get(candidate.id) ??
      0;
    const friendAttendees = batch.friendAttendeesByEvent.get(candidate.id) ?? [];
    const qualityScore =
      batch.featureByEvent.get(candidate.id)?.qualityScore ??
      getEventQualityReport(buildQualityInput(candidate, tags)).score;
    const interestOverlap =
      context.interestTags.length > 0
        ? tags.filter((tag) => context.interestTags.includes(tag)).length /
          context.interestTags.length
        : context.coldStart
          ? 0.55
          : 0;

    const score = computeScore({
      interestOverlap,
      friendCount: friendAttendees.length,
      isFollowedOrg: !!candidate.orgId && followedOrgIds.has(candidate.orgId),
      qualityScore,
      rsvpCount,
      savedCount,
      detailOpenCount,
      datetime: candidate.datetime,
      createdAt: candidate.createdAt,
    });

    const reasons = buildReasonList({
      coldStart: context.coldStart,
      friendCount: friendAttendees.length,
      interestOverlap,
      isFollowedOrg: !!candidate.orgId && followedOrgIds.has(candidate.orgId),
      rsvpCount,
      qualityScore,
      datetime: candidate.datetime,
      createdAt: candidate.createdAt,
    });

    return {
      id: candidate.id,
      title: candidate.title,
      orgId: candidate.orgId,
      orgName: candidate.orgName,
      datetime: formatEventDate(candidate.datetime),
      location: candidate.locationName ?? "TBD",
      tags,
      flyerUrl: candidate.flyerUrl,
      rsvpCount,
      savedCount,
      detailOpenCount,
      friendsAttending: friendAttendees,
      isRsvped: batch.userRsvpIds.has(candidate.id),
      isSaved: batch.userSaveIds.has(candidate.id),
      score,
      qualityScore,
      rankingSnapshotId: null,
      shelf: null,
      reasons,
    } satisfies FeedEvent;
  });

  scoredEvents.sort((a, b) => b.score - a.score);

  const seenIds = new Set<string>();
  const sections: ExploreShelf[] = [];

  const topPicks = dedupeSectionEvents(scoredEvents.slice(0, 6), seenIds);
  if (topPicks.length > 0) {
    sections.push({
      id: "top-picks",
      title: context.coldStart ? "Starter Picks" : "Top Picks This Week",
      description: context.coldStart
        ? "A strong starting set based on your interests and what is happening soon."
        : "The highest-confidence events for your week right now.",
      events: topPicks,
    });
  }

  const friendsGoing = dedupeSectionEvents(
    scoredEvents.filter((event) => event.friendsAttending.length > 0).slice(0, 6),
    seenIds,
  );
  if (friendsGoing.length > 0) {
    sections.push({
      id: "friends-going",
      title: "Because Friends Are Going",
      description: "Momentum from people you already know raises the odds you will actually go.",
      events: friendsGoing,
    });
  }

  const followedOrgs = dedupeSectionEvents(
    scoredEvents.filter((event) => event.orgId && followedOrgIds.has(event.orgId)).slice(0, 6),
    seenIds,
  );
  if (followedOrgs.length > 0) {
    sections.push({
      id: "followed-orgs",
      title: "From Orgs You Follow",
      description: "Fresh events from organizations you have already signaled trust in.",
      events: followedOrgs,
    });
  }

  const interestMatch = dedupeSectionEvents(
    scoredEvents
      .filter((event) => event.reasons.some((reason) => reason.code === "interest_match"))
      .slice(0, 6),
    seenIds,
  );
  if (interestMatch.length > 0) {
    sections.push({
      id: "interest-match",
      title: "Built Around Your Interests",
      description:
        "Events with strong tag overlap against the interests from your profile and history.",
      events: interestMatch,
    });
  }

  const happeningSoon = dedupeSectionEvents(
    scoredEvents
      .filter((event) => event.reasons.some((reason) => reason.code === "happening_soon"))
      .slice(0, 6),
    seenIds,
  );
  if (happeningSoon.length > 0) {
    sections.push({
      id: "happening-soon",
      title: "Happening Soon",
      description: "Short-horizon events you can still realistically act on this week.",
      events: happeningSoon,
    });
  }

  const snapshotMap = await persistRankingSnapshots(userId, sections);
  const sectionsWithSnapshots = assignSnapshotIds(sections, snapshotMap);
  const topEvents = sectionsWithSnapshots.flatMap((section) => section.events);

  const [myEvents, friendHighlights, suggestedOrgs, createdCountRows] = await Promise.all([
    db.execute(sql`
      select e.id,
             e.title,
             e.datetime,
             e.flyer_url as "flyerUrl",
             o.id as "orgId",
             o.name as "orgName",
             l.name as "locationName",
             exists (
               select 1 from rsvps r where r.user_id = ${userId} and r.event_id = e.id
             ) as "isRsvped",
             exists (
               select 1 from saved_events s where s.user_id = ${userId} and s.event_id = e.id
             ) as "isSaved"
      from events e
      left join organizations o on o.id = e.org_id
      left join campus_locations l on l.id = e.location_id
      where e.datetime > now()
        and (
          exists (select 1 from rsvps r where r.user_id = ${userId} and r.event_id = e.id)
          or exists (select 1 from saved_events s where s.user_id = ${userId} and s.event_id = e.id)
        )
      order by e.datetime asc
      limit 4
    `),
    context.friendIds.length > 0
      ? db.execute(sql`
          select e.id,
                 e.title,
                 e.datetime,
                 e.flyer_url as "flyerUrl",
                 l.name as "locationName",
                 o.id as "orgId",
                 o.name as "orgName",
                 count(distinct r.user_id)::int as "friendCount"
          from rsvps r
          inner join events e on e.id = r.event_id
          left join campus_locations l on l.id = e.location_id
          left join organizations o on o.id = e.org_id
          where r.user_id in (${sql.join(
            context.friendIds.map((friendId) => sql`${friendId}`),
            sql`, `,
          )})
            and e.datetime > now()
          group by e.id, e.title, e.datetime, e.flyer_url, l.name, o.id, o.name
          order by count(distinct r.user_id) desc, e.datetime asc
          limit 3
        `)
      : Promise.resolve([] as unknown[]),
    getSuggestedOrgs(userId, context.interestTags, context.followedOrgIds),
    db
      .select({ count: sql<number>`count(*)::int`.as("count") })
      .from(events)
      .where(and(eq(events.creatorId, userId), gt(events.datetime, new Date())))
      .limit(1),
  ]);

  const myWeekUpcoming = (
    myEvents as unknown as {
      id: string;
      title: string;
      datetime: Date;
      flyerUrl: string | null;
      orgId: string | null;
      orgName: string | null;
      locationName: string | null;
      isRsvped: boolean;
      isSaved: boolean;
    }[]
  ).map((event) => ({
    id: event.id,
    title: event.title,
    orgId: event.orgId,
    orgName: event.orgName,
    datetime: formatEventDate(event.datetime),
    location: event.locationName ?? "TBD",
    tags: [],
    flyerUrl: event.flyerUrl,
    rsvpCount: 0,
    savedCount: 0,
    detailOpenCount: 0,
    friendsAttending: [],
    isRsvped: event.isRsvped,
    isSaved: event.isSaved,
    score: 0,
    qualityScore: 0,
    rankingSnapshotId: null,
    shelf: "my-week",
    reasons: [],
  }));

  const socialHighlights = (
    friendHighlights as unknown as {
      id: string;
      title: string;
      datetime: Date;
      flyerUrl: string | null;
      orgId: string | null;
      orgName: string | null;
      locationName: string | null;
      friendCount: number;
    }[]
  ).map((event) => ({
    id: event.id,
    title: event.title,
    orgId: event.orgId,
    orgName: event.orgName,
    datetime: formatEventDate(event.datetime),
    location: event.locationName ?? "TBD",
    tags: [],
    flyerUrl: event.flyerUrl,
    rsvpCount: event.friendCount,
    savedCount: 0,
    detailOpenCount: 0,
    friendsAttending: [],
    isRsvped: false,
    isSaved: false,
    score: event.friendCount,
    qualityScore: 0,
    rankingSnapshotId: null,
    shelf: "social-highlights",
    reasons: [
      {
        code: "friend_attendance" as const,
        label: REASON_LABELS.friend_attendance(event.friendCount),
      },
    ],
  }));

  const weeklyBriefing = getWeeklyBriefing(topEvents);

  return {
    sections: sectionsWithSnapshots,
    weeklyBriefing,
    myWeek: {
      upcoming: myWeekUpcoming,
      socialHighlights,
      suggestedOrgs,
      savedCount: myWeekUpcoming.filter((event) => event.isSaved).length,
      rsvpedCount: myWeekUpcoming.filter((event) => event.isRsvped).length,
      createdCount: createdCountRows[0]?.count ?? 0,
      followedOrgCount: context.followedOrgIds.length,
    },
    totalCandidates: scoredEvents.length,
    dismissedCount,
    coldStart: context.coldStart,
  };
}

export async function recordEventInteractions(
  userId: string,
  inputs: RecommendationInteractionInput[],
) {
  if (inputs.length === 0) return;

  await db.insert(eventInteractions).values(
    inputs.map((input) => ({
      userId,
      eventId: input.eventId,
      rankingSnapshotId: input.rankingSnapshotId ?? null,
      interactionType: input.interactionType,
      surface: input.surface,
      shelf: input.shelf ?? null,
      reasonCodes: input.reasonCodes ?? [],
      metadata: input.metadata ?? {},
    })),
  );
}

export async function dismissEventForUser(
  userId: string,
  eventId: string,
  surface: RecommendationSurface,
  shelf?: string | null,
  reason?: string,
) {
  await db
    .insert(dismissedEvents)
    .values({
      userId,
      eventId,
      surface,
      reason: reason ?? null,
    })
    .onConflictDoUpdate({
      target: [dismissedEvents.userId, dismissedEvents.eventId],
      set: {
        surface,
        reason: reason ?? null,
        createdAt: new Date(),
      },
    });

  await recordEventInteractions(userId, [
    {
      eventId,
      interactionType: "dismiss",
      surface,
      shelf: shelf ?? null,
      metadata: reason ? { reason } : undefined,
    },
  ]);
}

export async function getOrganizerAnalyticsForEvent(
  eventId: string,
  input: EventQualityInput,
): Promise<OrganizerAnalytics> {
  const [featureRow] = await db
    .select()
    .from(eventFeedFeatures)
    .where(eq(eventFeedFeatures.eventId, eventId))
    .limit(1);

  const [rawCounts] = await db
    .select({
      impressionCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'impression')::int`.as(
          "impression_count",
        ),
      detailOpenCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'detail_open')::int`.as(
          "detail_open_count",
        ),
      saveCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'save')::int`.as(
          "save_count",
        ),
      rsvpCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'rsvp')::int`.as(
          "rsvp_count",
        ),
      shareCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'share')::int`.as(
          "share_count",
        ),
      exportCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'calendar_export')::int`.as(
          "export_count",
        ),
      dismissCount:
        sql<number>`count(*) filter (where ${eventInteractions.interactionType} = 'dismiss')::int`.as(
          "dismiss_count",
        ),
    })
    .from(eventInteractions)
    .where(eq(eventInteractions.eventId, eventId));

  const quality = getEventQualityReport(input);
  const impressionCount = featureRow?.impressionCount ?? rawCounts?.impressionCount ?? 0;
  const detailOpenCount = featureRow?.detailOpenCount ?? rawCounts?.detailOpenCount ?? 0;
  const saveCount = featureRow?.saveCount ?? rawCounts?.saveCount ?? 0;
  const rsvpCount = featureRow?.rsvpCount ?? rawCounts?.rsvpCount ?? 0;
  const shareCount = featureRow?.shareCount ?? rawCounts?.shareCount ?? 0;
  const exportCount = featureRow?.exportCount ?? rawCounts?.exportCount ?? 0;
  const dismissCount = featureRow?.dismissCount ?? rawCounts?.dismissCount ?? 0;
  const clickThroughRate =
    featureRow?.clickThroughRate ?? (impressionCount > 0 ? detailOpenCount / impressionCount : 0);
  const saveRate = featureRow?.saveRate ?? (impressionCount > 0 ? saveCount / impressionCount : 0);
  const rsvpRate = featureRow?.rsvpRate ?? (impressionCount > 0 ? rsvpCount / impressionCount : 0);

  return {
    quality,
    impressionCount,
    detailOpenCount,
    saveCount,
    rsvpCount,
    shareCount,
    exportCount,
    dismissCount,
    clickThroughRate,
    saveRate,
    rsvpRate,
    suggestions: getOrganizerInsightSuggestions({
      quality,
      impressionCount,
      detailOpenCount,
      saveCount,
      rsvpCount,
      exportCount,
      dismissCount,
    }),
    lastAggregatedAt: featureRow?.lastAggregatedAt?.toISOString() ?? null,
  };
}

export async function getRecentRecommendationDiagnostics(userId: string, limit = 20) {
  const rows = await db
    .select({
      id: rankingSnapshots.id,
      eventId: rankingSnapshots.eventId,
      title: events.title,
      surface: rankingSnapshots.surface,
      shelf: rankingSnapshots.shelf,
      score: rankingSnapshots.score,
      reasonCodes: rankingSnapshots.reasonCodes,
      metadata: rankingSnapshots.metadata,
      createdAt: rankingSnapshots.createdAt,
    })
    .from(rankingSnapshots)
    .innerJoin(events, eq(rankingSnapshots.eventId, events.id))
    .where(eq(rankingSnapshots.userId, userId))
    .orderBy(desc(rankingSnapshots.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function ensureWeeklyBriefingNotification(
  userId: string,
  briefing: WeeklyBriefing | null,
) {
  if (!briefing || briefing.events.length === 0) return;

  const weekKey = new Date().toISOString().slice(0, 10);
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "weekly_briefing"),
        sql`${notifications.payload}->>'weekKey' = ${weekKey}`,
      ),
    )
    .limit(1);

  if (existing) return;

  await db.insert(notifications).values({
    userId,
    type: "weekly_briefing",
    payload: {
      weekKey,
      title: briefing.title,
      eventIds: briefing.events.map((event) => event.id),
      eventTitles: briefing.events.map((event) => event.title),
    },
  });
}
