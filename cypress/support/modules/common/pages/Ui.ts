import { ui as sel } from "../selectors";
import type { ToastSeverity } from "../types";

/** Shared UI: toastify toasts, global p-confirmDialog, spinners. */
export const toast = {
  shouldShow(severity?: ToastSeverity, text?: string): Cypress.Chainable<JQuery<HTMLElement>> {
    const t = cy.get(sel.toast(severity)).should("be.visible");
    return text ? t.should("contain.text", text) : t;
  },
};

export const confirmDialog = {
  root(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.confirmDialog).should("be.visible");
  },
  accept(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.confirmAccept).should("be.visible").click();
  },
  reject(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.confirmReject).should("be.visible").click();
  },
  shouldBeClosed(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.confirmDialog).should("not.exist");
  },
};

export const spinners = {
  /** Waits until neither the global ngx-spinner nor any app-spinner is on screen. */
  waitGone(): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.get(sel.globalSpinner).should(($el) => expect($el.filter(":visible"), "visible global spinner").to.have.length(0));
    return cy.get(sel.appSpinner).should("not.exist");
  },
};
