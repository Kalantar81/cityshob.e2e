import { layers as sel } from "../selectors";
import { exactText } from "@common";

/** app-map-layers-panel (maps/components/map-layers-panel/map-layers-panel.component.html:14-65). */
export const LayersPanel = {
  open(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.trigger).first().click();
  },
  filter(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.search).clear().type(text);
  },
  /** Layer row (role=checkbox, aria-checked) by its exact visible name. */
  row(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(sel.row, exactText(name));
  },
  click(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return LayersPanel.row(name).click();
  },
};
