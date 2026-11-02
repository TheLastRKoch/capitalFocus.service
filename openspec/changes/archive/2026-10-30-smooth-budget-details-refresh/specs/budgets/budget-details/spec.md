# Spec Delta

## Purpose
Provides client-side state handling and seamless in-place data synchronization for the budget details interface, preventing jarring page resets and preserving user context.

## ADDED Requirements

### Requirement: In-Place Refresh Data Fetching
When the user triggers a refresh on the budget details view, the system SHALL asynchronously re-fetch the budget completion data and missing sections from the API without reloading the browser page or blanking out the content container.

#### Scenario: User clicks refresh button
- **WHEN** the user clicks the Refresh button on the budget details page
- **THEN** the system sends background requests to `/api/budgets/<id>/complete` and `/api/budgets/<id>/missing_sections/` while maintaining the current DOM visible to the user.

### Requirement: Accordion Expansion State Persistence
The system SHALL preserve the expanded or collapsed state of all category section accordions across data refresh cycles.

#### Scenario: Refreshing with an expanded section
- **WHEN** the user has one or more category section panels open and triggers a data refresh
- **THEN** the updated section panels re-render with the exact same open panels remaining expanded.

### Requirement: Non-Disruptive Refresh Feedback
The system SHALL provide localized visual feedback on the Refresh control during background data fetching instead of displaying a full-container loading spinner over the page content.

#### Scenario: Refresh operation in progress
- **WHEN** a background data refresh is triggered
- **THEN** the Refresh button indicates loading state and prevents duplicate clicks until data retrieval finishes.

### Requirement: Smooth Overview and Section Reconciliation
Upon receiving refreshed budget data, the system SHALL update the summary cards (budget projection and remaining amount), individual section projections, transaction lists, and missing section dropdown items in-place.

#### Scenario: Budget metrics update
- **WHEN** refreshed budget data is returned by the API
- **THEN** the budget title, projection card, remaining balance card, and section tables update with new values without layout flicker.

### Requirement: Post-Balance Seamless Synchronization
When a user executes the Balance action on any budget section, the system SHALL update the section projection via API and subsequently run the in-place refresh process without closing active sections or resetting scroll position.

#### Scenario: Successful section balancing
- **WHEN** the user clicks the Balance button for an overspent or underspent section and the update succeeds
- **THEN** the system displays a confirmation notification and automatically refreshes budget overview and section calculations in-place.
