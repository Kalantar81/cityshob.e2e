@smoke @common
Feature: Login

  Scenario: User logs in and sees the webclient main page
    Given I am logged in as "admin"
    When I open the main page
    Then I see the webclient main page
