# Spec: Social Features (Friends + Notifications)

## Overview
Users can add friends and see which events their friends are attending. Notifications alert users to friend requests and upcoming events.

## Requirements

### P0 — Friends
- Search users by display name or NetID
- Send friend request (creates `pending` friendship)
- Accept/decline friend requests
- View friend list
- "Friends attending" shown on event cards (avatar stack + count)
- Bidirectional: if A friends B, both see each other's RSVPs

### P1
- "Friends attending" scrollable list on event detail page
- Suggested friends (friends of friends)

### P0 — Notifications
- Friend request received → notification
- Upcoming RSVP'd event (1 day before) → notification
- Notification dropdown from bell icon in TopBar
- Unread count badge on bell icon
- Mark individual notification as read
- Mark all as read

### P1
- Org new event notification (for followed orgs)

## Server Actions

```typescript
// src/actions/friends.ts
searchUsers(query: string): Promise<UserSearchResult[]>
sendFriendRequest(userId: string): Promise<void>
acceptFriendRequest(friendshipId: string): Promise<void>
declineFriendRequest(friendshipId: string): Promise<void>
getFriends(): Promise<Friend[]>
getPendingRequests(): Promise<FriendRequest[]>

// src/actions/notifications.ts
getNotifications(limit?: number): Promise<Notification[]>
getUnreadCount(): Promise<number>
markRead(notificationId: string): Promise<void>
markAllRead(): Promise<void>
```

## Notification Generation

Notifications are created by server actions as side effects:

- `acceptFriendRequest()` → create notification for the requester
- `sendFriendRequest()` → create notification for the recipient
- Cron/scheduled job: scan RSVP'd events happening tomorrow, create reminders (or do this lazily at query time)

For MVP, event reminders can be computed at read time: "show events you RSVP'd to that start within 24 hours" — no need for a background job.

## Polling

Client-side polling on the explore page:
```typescript
// Poll every 60 seconds
useEffect(() => {
  const interval = setInterval(() => fetchUnreadCount(), 60_000)
  return () => clearInterval(interval)
}, [])
```
