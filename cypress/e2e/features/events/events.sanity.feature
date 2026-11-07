@smoke @events
Feature: Events module sanity

  Scenario: The events table opens
    Given I am logged in as "admin"
    And I am on a temporary workspace with a "events_table" widget
    Then the events table is shown
