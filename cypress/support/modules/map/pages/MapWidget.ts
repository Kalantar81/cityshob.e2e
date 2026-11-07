import { map as sel, layers } from "../selectors";

/** app-arcgis-map host (maps/components/arcgis-map/arcgis-map.component.html). */
export const MapWidget = {
  root(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.root(id));
  },
  view(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.root(id)).find(sel.view);
  },
  /**
   * DOM-level "ready": loading overlay gone, basemap button enabled (mapReady), layers panel
   * rendered and no longer loading (arcgis-map.component.html:6-57, .ts:2629-2653).
   */
  shouldBeLoaded(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.get(sel.root(id), { timeout: 60000 }).should("be.visible");
    cy.get(sel.root(id)).find(sel.loading, { timeout: 60000 }).should("not.exist");
    cy.get(sel.root(id)).find(sel.basemapButton).should("not.be.disabled");
    cy.get(sel.root(id)).find(layers.panel, { timeout: 60000 }).should("exist");
    return cy.get(sel.root(id)).find(layers.panelLoading, { timeout: 60000 }).should("not.exist");
  },
  typeSearch(id: string, text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.root(id)).find(sel.searchInput).first().clear().type(text);
  },
  clickAtScreen(id: string, x: number, y: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.root(id)).find(sel.view).click(x, y);
  },
};
