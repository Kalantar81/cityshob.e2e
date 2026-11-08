@events
Feature: Create a manual event

  Scenario: User creates a manual event and sees it in the events table
    Given I am logged in to the webclient as "admin"
    And I create an event workspace
    When I start creating a manual event
    And I choose the first event status
    And I choose the first event type
    And I choose the first traffic disruption level
    And I choose the first event priority
    And I choose the first event severity
    And I set the event location to latitude 32.0853 and longitude 34.7818
    And I choose the first up-down road direction
    And I choose the first region
    And I save the event
    Then the created event is shown in the events table
    When I go back to the dashboard
    And I open the event workspace
    And I delete the "events_table" widget
    And I log out and my session is fully closed
