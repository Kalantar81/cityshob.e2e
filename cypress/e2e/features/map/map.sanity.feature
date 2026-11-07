@smoke @map
Feature: Map module sanity

  Scenario: The map widget loads
    Given I am logged in as "admin"
    And I am on a temporary workspace with a "map" widget
    Then the map is loaded
