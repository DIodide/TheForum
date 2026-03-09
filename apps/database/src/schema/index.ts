import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────

export const eventTagEnum = pgEnum("event_tag", [
  "free-food",
  "workshop",
  "performance",
  "speaker",
  "social",
  "career",
  "sports",
  "music",
  "art",
  "academic",
  "cultural",
  "community-service",
  "religious",
  "political",
  "tech",
  "gaming",
  "outdoor",
  "wellness",
]);

export const campusRegionEnum = pgEnum("campus_region", [
  "central",
  "east",
  "west",
  "south",
  "north",
  "off-campus",
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "declined",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "friend_request",
  "event_reminder",
  "org_new_event",
  "social_activity",
  "weekly_briefing",
]);

export const orgCategoryEnum = pgEnum("org_category", [
  "career",
  "affinity",
  "performance",
  "academic",
  "athletic",
  "social",
  "cultural",
  "religious",
  "political",
  "service",
]);

export const orgRoleEnum = pgEnum("org_role", ["owner", "officer", "member"]);

export const locationCategoryEnum = pgEnum("location_category", [
  "academic",
  "residential",
  "athletic",
  "social",
  "administrative",
  "library",
  "dining",
  "other",
]);

export const eventInteractionTypeEnum = pgEnum("event_interaction_type", [
  "impression",
  "detail_open",
  "save",
  "unsave",
  "rsvp",
  "unrsvp",
  "share",
  "calendar_export",
  "dismiss",
]);

export const recommendationSurfaceEnum = pgEnum("recommendation_surface", [
  "explore",
  "event_detail",
  "my_week",
  "notification",
  "weekly_briefing",
  "organizer",
]);

// ── Tables ────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  netId: varchar("net_id", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  classYear: varchar("class_year", { length: 10 }),
  major: varchar("major", { length: 255 }),
  avatarUrl: text("avatar_url"),
  isOrgLeader: boolean("is_org_leader").default(false).notNull(),
  onboarded: boolean("onboarded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userInterests = pgTable(
  "user_interests",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tag: eventTagEnum("tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tag] })],
);

export const userRegions = pgTable(
  "user_regions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    region: campusRegionEnum("region").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.region] })],
);

export const campusLocations = pgTable("campus_locations", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  category: locationCategoryEnum("category").notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  category: orgCategoryEnum("category").notNull(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] })],
);

export const orgFollowers = pgTable(
  "org_followers",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] })],
);

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  datetime: timestamp("datetime").notNull(),
  endDatetime: timestamp("end_datetime"),
  locationId: varchar("location_id", { length: 100 })
    .notNull()
    .references(() => campusLocations.id),
  orgId: uuid("org_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  flyerUrl: text("flyer_url"),
  externalLink: text("external_link"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventTags = pgTable(
  "event_tags",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    tag: eventTagEnum("tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.tag] })],
);

export const rsvps = pgTable(
  "rsvps",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

export const savedEvents = pgTable(
  "saved_events",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

export const eventReports = pgTable("event_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rankingSnapshots = pgTable("ranking_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  surface: recommendationSurfaceEnum("surface").notNull(),
  shelf: varchar("shelf", { length: 80 }),
  rank: integer("rank").notNull(),
  score: doublePrecision("score").notNull(),
  reasonCodes: jsonb("reason_codes").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventInteractions = pgTable("event_interactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  rankingSnapshotId: uuid("ranking_snapshot_id").references(() => rankingSnapshots.id, {
    onDelete: "set null",
  }),
  interactionType: eventInteractionTypeEnum("interaction_type").notNull(),
  surface: recommendationSurfaceEnum("surface").notNull(),
  shelf: varchar("shelf", { length: 80 }),
  reasonCodes: jsonb("reason_codes").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dismissedEvents = pgTable(
  "dismissed_events",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    surface: recommendationSurfaceEnum("surface").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

export const userFeedFeatures = pgTable("user_feed_features", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  topTags: jsonb("top_tags").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  topOrgCategories: jsonb("top_org_categories")
    .$type<string[]>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  followedOrgIds: jsonb("followed_org_ids").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  impressionCount: integer("impression_count").default(0).notNull(),
  detailOpenCount: integer("detail_open_count").default(0).notNull(),
  saveCount: integer("save_count").default(0).notNull(),
  rsvpCount: integer("rsvp_count").default(0).notNull(),
  shareCount: integer("share_count").default(0).notNull(),
  exportCount: integer("export_count").default(0).notNull(),
  dismissCount: integer("dismiss_count").default(0).notNull(),
  lastAggregatedAt: timestamp("last_aggregated_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventFeedFeatures = pgTable("event_feed_features", {
  eventId: uuid("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  impressionCount: integer("impression_count").default(0).notNull(),
  detailOpenCount: integer("detail_open_count").default(0).notNull(),
  saveCount: integer("save_count").default(0).notNull(),
  rsvpCount: integer("rsvp_count").default(0).notNull(),
  shareCount: integer("share_count").default(0).notNull(),
  exportCount: integer("export_count").default(0).notNull(),
  dismissCount: integer("dismiss_count").default(0).notNull(),
  clickThroughRate: doublePrecision("click_through_rate").default(0).notNull(),
  saveRate: doublePrecision("save_rate").default(0).notNull(),
  rsvpRate: doublePrecision("rsvp_rate").default(0).notNull(),
  qualityScore: doublePrecision("quality_score").default(0).notNull(),
  lastAggregatedAt: timestamp("last_aggregated_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgFeedFeatures = pgTable("org_feed_features", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  followerCount: integer("follower_count").default(0).notNull(),
  eventCount: integer("event_count").default(0).notNull(),
  averageImpressionCount: doublePrecision("average_impression_count").default(0).notNull(),
  averageSaveRate: doublePrecision("average_save_rate").default(0).notNull(),
  averageRsvpRate: doublePrecision("average_rsvp_rate").default(0).notNull(),
  lastAggregatedAt: timestamp("last_aggregated_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const friendships = pgTable(
  "friendships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: uuid("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.friendId] })],
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  payload: jsonb("payload").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  interests: many(userInterests),
  regions: many(userRegions),
  createdEvents: many(events),
  rsvps: many(rsvps),
  savedEvents: many(savedEvents),
  eventReports: many(eventReports),
  feedFeatures: one(userFeedFeatures),
  interactions: many(eventInteractions),
  dismissedEvents: many(dismissedEvents),
  orgMemberships: many(orgMembers),
  orgFollows: many(orgFollowers),
  rankingSnapshots: many(rankingSnapshots),
  sentFriendRequests: many(friendships, { relationName: "sentRequests" }),
  receivedFriendRequests: many(friendships, {
    relationName: "receivedRequests",
  }),
  notifications: many(notifications),
}));

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id],
  }),
}));

export const userRegionsRelations = relations(userRegions, ({ one }) => ({
  user: one(users, {
    fields: [userRegions.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  creator: one(users, {
    fields: [organizations.creatorId],
    references: [users.id],
  }),
  members: many(orgMembers),
  followers: many(orgFollowers),
  feedFeatures: one(orgFeedFeatures),
  events: many(events),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  org: one(organizations, {
    fields: [orgMembers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgMembers.userId],
    references: [users.id],
  }),
}));

export const orgFollowersRelations = relations(orgFollowers, ({ one }) => ({
  org: one(organizations, {
    fields: [orgFollowers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgFollowers.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  location: one(campusLocations, {
    fields: [events.locationId],
    references: [campusLocations.id],
  }),
  organization: one(organizations, {
    fields: [events.orgId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
  tags: many(eventTags),
  rsvps: many(rsvps),
  savedBy: many(savedEvents),
  reports: many(eventReports),
  feedFeatures: one(eventFeedFeatures),
  interactions: many(eventInteractions),
  dismissedBy: many(dismissedEvents),
  rankingSnapshots: many(rankingSnapshots),
}));

export const eventTagsRelations = relations(eventTags, ({ one }) => ({
  event: one(events, {
    fields: [eventTags.eventId],
    references: [events.id],
  }),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  user: one(users, { fields: [rsvps.userId], references: [users.id] }),
  event: one(events, { fields: [rsvps.eventId], references: [events.id] }),
}));

export const savedEventsRelations = relations(savedEvents, ({ one }) => ({
  user: one(users, {
    fields: [savedEvents.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [savedEvents.eventId],
    references: [events.id],
  }),
}));

export const eventReportsRelations = relations(eventReports, ({ one }) => ({
  event: one(events, {
    fields: [eventReports.eventId],
    references: [events.id],
  }),
  reporter: one(users, {
    fields: [eventReports.reporterId],
    references: [users.id],
  }),
}));

export const rankingSnapshotsRelations = relations(rankingSnapshots, ({ one, many }) => ({
  user: one(users, {
    fields: [rankingSnapshots.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [rankingSnapshots.eventId],
    references: [events.id],
  }),
  interactions: many(eventInteractions),
}));

export const eventInteractionsRelations = relations(eventInteractions, ({ one }) => ({
  user: one(users, {
    fields: [eventInteractions.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventInteractions.eventId],
    references: [events.id],
  }),
  rankingSnapshot: one(rankingSnapshots, {
    fields: [eventInteractions.rankingSnapshotId],
    references: [rankingSnapshots.id],
  }),
}));

export const dismissedEventsRelations = relations(dismissedEvents, ({ one }) => ({
  user: one(users, {
    fields: [dismissedEvents.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [dismissedEvents.eventId],
    references: [events.id],
  }),
}));

export const userFeedFeaturesRelations = relations(userFeedFeatures, ({ one }) => ({
  user: one(users, {
    fields: [userFeedFeatures.userId],
    references: [users.id],
  }),
}));

export const eventFeedFeaturesRelations = relations(eventFeedFeatures, ({ one }) => ({
  event: one(events, {
    fields: [eventFeedFeatures.eventId],
    references: [events.id],
  }),
}));

export const orgFeedFeaturesRelations = relations(orgFeedFeatures, ({ one }) => ({
  org: one(organizations, {
    fields: [orgFeedFeatures.orgId],
    references: [organizations.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "sentRequests",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "receivedRequests",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ── Type exports ──────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type CampusLocation = typeof campusLocations.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type EventReport = typeof eventReports.$inferSelect;
export type RankingSnapshot = typeof rankingSnapshots.$inferSelect;
export type EventInteraction = typeof eventInteractions.$inferSelect;
export type DismissedEvent = typeof dismissedEvents.$inferSelect;
export type UserFeedFeature = typeof userFeedFeatures.$inferSelect;
export type EventFeedFeature = typeof eventFeedFeatures.$inferSelect;
export type OrgFeedFeature = typeof orgFeedFeatures.$inferSelect;
