import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
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
  expectLoginPage();
});

Given("I make sure I am logged in as {string}", (role: string) => {
  ensureLoggedIn(role);
});

Then("I was not logged in again", () => {
  expectNoNewLogin();
});

Given("I remember my auth tokens", () => {
  rememberAuthTokens();
});

When("I open the protected page {string} directly", (path: string) => {
  openProtectedPage(path);
});

When("I go back in the browser", () => {
  goBack();
});

Then("my previous access token is rejected by the BFF", () => {
  expectTokenRejected();
});

Then("no auth tokens remain in the browser storage", () => {
  expectNoAuthDataInBrowser();
});
