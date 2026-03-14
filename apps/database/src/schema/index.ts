import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
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
  source: varchar("source", { length: 20 }).default("manual").notNull(),
  sourceMessageId: varchar("source_message_id", { length: 255 }).unique(),
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

export const pipelineLogStatusEnum = pgEnum("pipeline_log_status", [
  "success",
  "skipped_not_event",
  "duplicate",
  "error",
]);

export const listservConfigs = pgTable("listserv_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  orgId: uuid("org_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  gmailLabel: varchar("gmail_label", { length: 255 }),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pipelineLogs = pgTable("pipeline_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: varchar("message_id", { length: 255 }).notNull(),
  listservConfigId: uuid("listserv_config_id").references(() => listservConfigs.id, {
    onDelete: "set null",
  }),
  status: pipelineLogStatusEnum("status").notNull(),
  errorText: text("error_text"),
  extractedEventId: uuid("extracted_event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  interests: many(userInterests),
  regions: many(userRegions),
  createdEvents: many(events),
  rsvps: many(rsvps),
  savedEvents: many(savedEvents),
  orgMemberships: many(orgMembers),
  orgFollows: many(orgFollowers),
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

export const listservConfigsRelations = relations(listservConfigs, ({ one }) => ({
  org: one(organizations, {
    fields: [listservConfigs.orgId],
    references: [organizations.id],
  }),
}));

export const pipelineLogsRelations = relations(pipelineLogs, ({ one }) => ({
  listservConfig: one(listservConfigs, {
    fields: [pipelineLogs.listservConfigId],
    references: [listservConfigs.id],
  }),
  extractedEvent: one(events, {
    fields: [pipelineLogs.extractedEventId],
    references: [events.id],
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
export type ListservConfig = typeof listservConfigs.$inferSelect;
export type NewListservConfig = typeof listservConfigs.$inferInsert;
export type PipelineLog = typeof pipelineLogs.$inferSelect;
export type NewPipelineLog = typeof pipelineLogs.$inferInsert;
