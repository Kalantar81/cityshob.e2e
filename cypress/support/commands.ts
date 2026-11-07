/// <reference types="cypress" />
import { login } from "@common";

Cypress.Commands.add("getByDataCy", (id: string) => {
  return cy.get(`[data-cy="${id}"], [data-testid="${id}"]`);
});

/** Kept for existing tests; implementation lives in the common module. */
Cypress.Commands.add("login", (role: string) => {
  login(role);
});
