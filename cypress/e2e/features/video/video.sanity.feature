@smoke @video
Feature: Video module sanity

  Scenario: A camera stream plays
    Given I am logged in as "admin"
    And I am on a temporary workspace with a "cameras" widget
    Then the camera tree is loaded
    When I add an available camera to the grid
    Then the stream is playing
