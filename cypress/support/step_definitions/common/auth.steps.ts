import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { login, logout, openDashboard, waitForAppReady } from "@common";

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
  cy.location("pathname").should("eq", "/auth/login");
});
