@common
Feature: Logout

  # Logs in (and opens the main page) only when not logged in already; then each scenario logs out.
  Background:
    Given I make sure I am logged in as "admin"
    And I see the webclient main page

  @smoke
  Scenario: User logs out and lands on the login page
    When I log out
    Then I see the login page

  Scenario: An already logged-in user is not logged in again before logout
    Given I make sure I am logged in as "admin"
    Then I was not logged in again
    When I log out
    Then I see the login page

  Scenario: A protected page opened directly after logout redirects to the login page
    When I log out
    And I open the protected page "/dashboard" directly
    Then I see the login page

  Scenario: Browser Back after logout does not return to an authenticated page
    When I log out
    And I go back in the browser
    Then I see the login page

  Scenario: The access token used before logout is rejected by the BFF
    Given I remember my auth tokens
    When I log out
    Then my previous access token is rejected by the BFF

  Scenario: Auth tokens are removed from the browser after logout
    Given I remember my auth tokens
    When I log out
    Then no auth tokens remain in the browser storage
