"use server";

import {
  and,
  db,
  eq,
  friendships,
  ilike,
  notifications,
  or,
  sql,
  users,
} from "@the-forum/database";
import { revalidatePath } from "next/cache";
import { auth } from "~/auth";

export interface FriendProfile {
  id: string;
  displayName: string;
  netId: string;
  avatarUrl: string | null;
  classYear: string | null;
  major: string | null;
}

export interface FriendRequest {
  id: string;
  displayName: string;
  netId: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export async function searchUsers(query: string): Promise<FriendProfile[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!query.trim()) return [];

  const results = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      netId: users.netId,
      avatarUrl: users.avatarUrl,
      classYear: users.classYear,
      major: users.major,
    })
    .from(users)
    .where(
      and(
        or(ilike(users.displayName, `%${query}%`), ilike(users.netId, `%${query}%`)),
        sql`${users.id} != ${session.user.id}`,
      ),
    )
    .limit(20);

  return results;
}

export async function getFriends(): Promise<FriendProfile[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Friends where current user is the sender
  const sent = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      netId: users.netId,
      avatarUrl: users.avatarUrl,
      classYear: users.classYear,
      major: users.major,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")));

  // Friends where current user is the receiver
  const received = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      netId: users.netId,
      avatarUrl: users.avatarUrl,
      classYear: users.classYear,
      major: users.major,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.userId, users.id))
    .where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted")));

  return [...sent, ...received];
}

export async function getPendingRequests(): Promise<{
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const incoming = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      netId: users.netId,
      avatarUrl: users.avatarUrl,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.userId, users.id))
    .where(and(eq(friendships.friendId, userId), eq(friendships.status, "pending")));

  const outgoing = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      netId: users.netId,
      avatarUrl: users.avatarUrl,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .where(and(eq(friendships.userId, userId), eq(friendships.status, "pending")));

  return { incoming, outgoing };
}

export async function getFriendshipStatus(
  otherUserId: string,
): Promise<"none" | "pending_sent" | "pending_received" | "accepted"> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [sent] = await db
    .select({ status: friendships.status })
    .from(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.friendId, otherUserId)))
    .limit(1);

  if (sent) {
    return sent.status === "accepted" ? "accepted" : "pending_sent";
  }

  const [received] = await db
    .select({ status: friendships.status })
    .from(friendships)
    .where(and(eq(friendships.userId, otherUserId), eq(friendships.friendId, userId)))
    .limit(1);

  if (received) {
    return received.status === "accepted" ? "accepted" : "pending_received";
  }

  return "none";
}

export async function sendFriendRequest(friendId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  if (userId === friendId) throw new Error("Cannot send friend request to yourself");

  // Check if friendship already exists in either direction
  const [existing] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId)),
      ),
    )
    .limit(1);

  if (existing) throw new Error("Friend request already exists");

  await db.insert(friendships).values({
    userId,
    friendId,
    status: "pending",
  });

  // Create notification for the recipient
  await db.insert(notifications).values({
    userId: friendId,
    type: "friend_request",
    payload: {
      fromUserId: userId,
      fromDisplayName: session.user.name ?? "Someone",
    },
  });

  revalidatePath("/friends");
}

export async function acceptFriendRequest(fromUserId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(
      and(
        eq(friendships.userId, fromUserId),
        eq(friendships.friendId, session.user.id),
        eq(friendships.status, "pending"),
      ),
    );

  revalidatePath("/friends");
}

export async function declineFriendRequest(fromUserId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.userId, fromUserId),
        eq(friendships.friendId, session.user.id),
        eq(friendships.status, "pending"),
      ),
    );

  revalidatePath("/friends");
}

export async function removeFriend(friendId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  await db
    .delete(friendships)
    .where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId)),
      ),
    );

  revalidatePath("/friends");
}
