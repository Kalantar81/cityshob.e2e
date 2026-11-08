import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
<<<<<<< Updated upstream
import { login, logout, openDashboard, waitForAppReady } from "@common";
=======
import {
  login,
  loginAndOpenMainPage,
  logout,
  logoutAndVerifySessionClosed,
  ensureLoggedIn,
  expectNoNewLogin,
  openDashboard,
  waitForAppReady,
  rememberAuthTokens,
  openProtectedPage,
  goBack,
  expectLoginPage,
  expectTokenRejected,
  expectNoAuthDataInBrowser,
} from "@common";
>>>>>>> Stashed changes

Given("I am logged in as {string}", (role: string) => {
  login(role);
});

/** One-line login: every action of login.feature. */
Given("I am logged in to the webclient as {string}", (role: string) => {
  loginAndOpenMainPage(role);
});

/** One-line logout: every check of logout.feature. */
When("I log out and my session is fully closed", () => {
  logoutAndVerifySessionClosed();
});

When("I open the main page", () => {
  openDashboard();
});

Then("I see the webclient main page", () => {
  waitForAppReady();
});

When("I log out", () => {
  logout();
});

Then("I see the login page", () => {
  cy.location("pathname").should("eq", "/auth/login");
});
