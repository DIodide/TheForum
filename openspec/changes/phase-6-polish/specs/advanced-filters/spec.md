## ADDED Requirements

### Requirement: Global search bar functionality
The top bar search input SHALL trigger event search when the user types.

#### Scenario: User searches from top bar
- **WHEN** the user types a query in the top bar search input
- **THEN** the app navigates to the explore page with the search query applied

### Requirement: Organization type filter
The explore page SHALL allow filtering events by organization category.

#### Scenario: User filters by org category
- **WHEN** the user selects an organization category (e.g., "Career", "Social")
- **THEN** the feed shows only events from organizations of that category

### Requirement: Location filter
The explore page SHALL allow filtering events by campus location.

#### Scenario: User filters by location
- **WHEN** the user selects a campus location
- **THEN** the feed shows only events at that location

### Requirement: Date range filter
The explore page SHALL allow filtering events by date range.

#### Scenario: User filters by date
- **WHEN** the user selects "Today", "This Week", or "This Month"
- **THEN** the feed shows only events within that time range

### Requirement: Clickable org name on event cards
Event cards SHALL link the organization name to the org profile page.

#### Scenario: User clicks org name
- **WHEN** the user clicks the organization name on an event card
- **THEN** the user navigates to that organization's profile page
