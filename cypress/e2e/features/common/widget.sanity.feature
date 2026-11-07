@smoke @common
Feature: Common module sanity

  Scenario: Create and delete a widget on a temporary workspace
    Given I am logged in as "admin"
    And I am on a temporary workspace
    When I create a "browser" widget
    Then the "browser" widget is shown
    When I delete the "browser" widget
