## ADDED Requirements

### Requirement: Event reminder notifications
The system SHALL generate an `event_reminder` notification for each user who has RSVP'd to an event occurring within the next 24 hours. Reminders SHALL NOT be duplicated if already generated for the same event+user pair.

#### Scenario: Reminder generated on notification fetch
- **WHEN** a user fetches their notifications and has RSVP'd to an event starting within 24 hours
- **THEN** the system creates an `event_reminder` notification with the event ID and title in the payload, if one does not already exist

#### Scenario: No duplicate reminders
- **WHEN** a reminder notification already exists for a given user+event pair
- **THEN** the system SHALL NOT create another reminder for that pair

### Requirement: Org new-event notifications
The system SHALL generate `org_new_event` notifications for all followers of an organization when a new event is created under that organization.

#### Scenario: Notifications created on event creation
- **WHEN** a user creates an event with an `orgId`
- **THEN** the system creates an `org_new_event` notification for every user who follows that organization, with the event ID, event title, and org name in the payload

#### Scenario: Creator excluded from notification
- **WHEN** the event creator is also a follower of the organization
- **THEN** the creator SHALL NOT receive an `org_new_event` notification for their own event
