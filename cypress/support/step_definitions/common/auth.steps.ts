import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import {
  login,
  logout,
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
