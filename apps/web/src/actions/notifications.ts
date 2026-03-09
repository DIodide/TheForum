"use server";

import { events, and, db, desc, eq, gte, lt, notifications, rsvps, sql } from "@the-forum/database";
import { auth } from "~/auth";

export type NotificationType =
  | "friend_request"
  | "event_reminder"
  | "org_new_event"
  | "social_activity"
  | "weekly_briefing";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // On-demand: generate event reminders for RSVP'd events in next 24h
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingRsvps = await db
    .select({ eventId: events.id, title: events.title })
    .from(rsvps)
    .innerJoin(events, eq(rsvps.eventId, events.id))
    .where(and(eq(rsvps.userId, userId), gte(events.datetime, now), lt(events.datetime, in24h)));

  for (const r of upcomingRsvps) {
    // Check if reminder already exists for this user+event pair
    const [existing] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "event_reminder"),
          sql`${notifications.payload}->>'eventId' = ${r.eventId}`,
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(notifications).values({
        userId,
        type: "event_reminder",
        payload: { eventId: r.eventId, eventTitle: r.title },
      });
    }
  }

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  return {
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      payload: n.payload as Record<string, unknown>,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: countResult?.count ?? 0,
  };
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));
}
