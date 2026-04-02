"use server";

import { db, interactions } from "@the-forum/database";
import { auth } from "~/auth";

/** Interaction weights — maps type to implicit feedback score */
const INTERACTION_WEIGHTS: Record<string, number> = {
  view: 1.0,
  click: 2.0,
  share: 2.0,
  save: 3.0,
  rsvp: 5.0,
  hide: -1.0,
};

/**
 * Log an implicit user interaction. Fire-and-forget — failures are silently
 * dropped so logging never breaks the UX.
 */
export async function logInteraction(data: {
  itemId: string;
  itemType?: "event" | "organization";
  interactionType: "view" | "click" | "rsvp" | "save" | "share" | "hide";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) return; // not logged in — skip silently

    await db.insert(interactions).values({
      userId: session.user.id,
      itemId: data.itemId,
      itemType: data.itemType ?? "event",
      interactionType: data.interactionType,
      interactionValue: INTERACTION_WEIGHTS[data.interactionType] ?? 1.0,
      metadata: data.metadata ?? null,
    });
  } catch {
    // Silently drop — logging should never break the app
  }
}
