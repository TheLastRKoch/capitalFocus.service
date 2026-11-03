# Spec Delta

## ADDED Requirements

### Requirement: Projection Details Toggle

The Budget projection card on the budget details page SHALL include a down-arrow toggle control. The details area SHALL be collapsed by default, and activating the control SHALL expand it; activating it again SHALL collapse it. The arrow SHALL point down while collapsed and up while expanded, and the control SHALL expose its expanded state accessibly.

#### Scenario: Details start collapsed

- **GIVEN** the budget details page has loaded
- **WHEN** the Budget projection card is displayed
- **THEN** the projection details area is hidden
- **AND** the toggle shows a down arrow with an accessible collapsed state

#### Scenario: Expanding the details

- **GIVEN** the projection details area is collapsed
- **WHEN** the user activates the toggle
- **THEN** the details area becomes visible
- **AND** the toggle shows an up arrow with an accessible expanded state

#### Scenario: Collapsing the details

- **GIVEN** the projection details area is expanded
- **WHEN** the user activates the toggle
- **THEN** the details area becomes hidden
- **AND** the toggle shows a down arrow with an accessible collapsed state

#### Scenario: Toggle uses loaded data

- **GIVEN** the budget details have already been fetched
- **WHEN** the user expands or collapses the details
- **THEN** no additional budget request is sent

### Requirement: Projection Details Content

The expanded projection details area SHALL display the budget's `budget_spent` and `budget_encumbered_remaining` values returned by `GET /api/budgets/<id>/complete/`, each formatted as currency.

#### Scenario: Values are displayed

- **GIVEN** the complete-budget response contains `budget_spent` and `budget_encumbered_remaining`
- **WHEN** the details area is expanded
- **THEN** the spent value shows the formatted `budget_spent` amount
- **AND** the encumbered remaining value shows the formatted `budget_encumbered_remaining` amount

#### Scenario: Missing values fall back to zero

- **GIVEN** the response omits `budget_spent` or `budget_encumbered_remaining`
- **WHEN** the details area is expanded
- **THEN** the missing value is displayed as the formatted zero amount

### Requirement: Projection Details Refresh Consistency

Refreshing budget data SHALL update the displayed spent and encumbered remaining values without changing whether the details area is expanded or collapsed.

#### Scenario: Refresh updates values in place

- **GIVEN** the details area is expanded
- **WHEN** refreshed complete-budget data returns new `budget_spent` and `budget_encumbered_remaining` values
- **THEN** both displayed values update to the new amounts
- **AND** the details area remains expanded

#### Scenario: Refresh while collapsed

- **GIVEN** the details area is collapsed
- **WHEN** refreshed complete-budget data returns new values
- **THEN** the details area remains collapsed
