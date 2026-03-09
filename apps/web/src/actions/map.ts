"use server";

import {
  events,
  and,
  campusLocations,
  db,
  eq,
  eventTags,
  gte,
  lt,
  organizations,
} from "@the-forum/database";
import { auth } from "~/auth";

export interface MapEvent {
  id: string;
  title: string;
  datetime: string;
  rawDatetime: string; // ISO string for relative time calc
  orgName: string | null;
  flyerUrl: string | null;
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  tags: string[];
}

/** Fetch events for a date range (defaults to next 7 days). */
export async function getMapEvents(opts?: {
  from?: string;
  days?: number;
}): Promise<MapEvent[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const startDate = opts?.from ? new Date(opts.from) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (opts?.days ?? 7));
  endDate.setHours(23, 59, 59, 999);

  const results = await db
    .select({
      id: events.id,
      title: events.title,
      datetime: events.datetime,
      orgName: organizations.name,
      flyerUrl: events.flyerUrl,
      locationId: campusLocations.id,
      locationName: campusLocations.name,
      latitude: campusLocations.latitude,
      longitude: campusLocations.longitude,
    })
    .from(events)
    .innerJoin(campusLocations, eq(events.locationId, campusLocations.id))
    .leftJoin(organizations, eq(events.orgId, organizations.id))
    .where(and(gte(events.datetime, startDate), lt(events.datetime, endDate)))
    .orderBy(events.datetime);

  return Promise.all(
    results.map(async (r) => {
      const tags = await db
        .select({ tag: eventTags.tag })
        .from(eventTags)
        .where(eq(eventTags.eventId, r.id));

      return {
        ...r,
        locationId: r.locationId ?? "",
        locationName: r.locationName ?? "TBD",
        rawDatetime: r.datetime.toISOString(),
        datetime: r.datetime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        tags: tags.map((t) => t.tag),
      };
    }),
  );
}
