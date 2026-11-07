import { popup as sel } from "../selectors";

/** Feature popup content (app-map-context-menu inside ArcGIS Popup, utils/popup-manager.ts:79-91). */
export const MapPopup = {
  root(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.loaded);
  },
  objectInfoDialog(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.objectInfoDialog);
  },
};
