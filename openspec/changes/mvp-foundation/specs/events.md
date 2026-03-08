# Spec: Events (CRUD, RSVP, Save)

## Overview
Events are the core entity. Org leaders and students can create events, which appear in the explore feed. Users interact via RSVP (public) and Save (private).

## Requirements

### P0 — Event Creation
- Title (required, max 200 chars)
- Description (required, max 2000 chars)
- Start date/time (required, must be in future)
- End date/time (optional)
- Campus location (required, select from fixed list)
- Tags (required, at least 1, max 5, from fixed taxonomy)
- Flyer image (optional, upload to S3, max 5MB, jpeg/png/webp)
- Organization (optional — select from orgs user belongs to)
- Creator is automatically set to current user

### P1
- External registration link (optional URL)
- Draft/publish status

### P0 — Event Detail
- Display all event fields
- Show RSVP count
- Show friends who RSVP'd (avatar stack)
- RSVP button (toggle on/off)
- Save button (toggle on/off, private)
- Edit/delete visible only to creator
- Similar events: same tags or same org, max 4

### P0 — Event Editing
- Creator can edit all fields
- Creator can delete event (hard delete for MVP)

### P0 — RSVP
- Authenticated user can RSVP to any event
- RSVP is visible to user's friends
- User can un-RSVP (toggle)
- RSVP count shown on event card and detail page

### P0 — Save
- Authenticated user can save any event
- Saves are private (not visible to others)
- User can unsave (toggle)
- Saved events appear in "My Events" sidebar section

## Server Actions

```typescript
// src/actions/events.ts

createEvent(data: CreateEventInput): Promise<{ id: string }>
updateEvent(eventId: string, data: UpdateEventInput): Promise<void>
deleteEvent(eventId: string): Promise<void>
getEvent(eventId: string): Promise<EventDetail>
getFeedEvents(params: FeedParams): Promise<{ events: EventCard[], cursor: string | null }>
toggleRsvp(eventId: string): Promise<{ rsvped: boolean, count: number }>
toggleSave(eventId: string): Promise<{ saved: boolean }>
getMyEvents(): Promise<{ created: EventCard[], rsvped: EventCard[], saved: EventCard[] }>
getSimilarEvents(eventId: string): Promise<EventCard[]>
```

## Data Types

```typescript
interface EventCard {
  id: string
  title: string
  orgName: string | null
  datetime: Date
  location: { id: string, name: string }
  tags: string[]
  flyerUrl: string | null
  rsvpCount: number
  friendsAttending: { id: string, displayName: string, avatarUrl: string | null }[]
  isRsvped: boolean
  isSaved: boolean
}

interface EventDetail extends EventCard {
  description: string
  endDatetime: Date | null
  externalLink: string | null
  creatorId: string
  orgId: string | null
  createdAt: Date
  attendees: { id: string, displayName: string, avatarUrl: string | null }[]
}
```
