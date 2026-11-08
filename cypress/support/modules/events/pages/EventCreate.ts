import { create as sel } from "../selectors";

/** Opens the first accordion tab of `tab`'s level until a leaf is reached, then clicks that leaf. */
function clickFirstLeaf($scope: JQuery<HTMLElement>, depth = 0): void {
  if (depth > 3) throw new Error("No selectable event type found within 3 accordion levels");
  const $tab = $scope.find("p-accordiontab").first();
  if ($tab.length === 0) {
    cy.wrap($scope.find(sel.typeLeaf).first()).should("be.visible").click();
    return;
  }
  cy.wrap($tab).find(".p-accordion-header-link").first().click();
  cy.wrap($tab)
    .find(".p-accordion-content")
    .first()
    .should("be.visible")
    .then(($content) => clickFirstLeaf($content, depth + 1));
}

/** First enabled option of a p-dropdown (panel appended to body). */
function chooseFirstOption(dropdown: string): Cypress.Chainable<JQuery<HTMLElement>> {
  cy.get(dropdown).scrollIntoView().should("be.visible").click();
  cy.get(".p-dropdown-panel").should("be.visible").find("li.p-dropdown-item:not(.p-disabled)").first().click();
  return cy.get(".p-dropdown-panel").should("not.exist");
}

/** Create-event wizard (events/components/events-create, event-details-properties). */
export const EventCreate = {
  open(): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.get(sel.open).should("be.visible").click();
    return cy.get(sel.panel).should("be.visible");
  },
  /**
   * Type / subtype / sub-subtype are one search picker (event-type-search-picker.html): focusing the
   * input shows an accordion tree; the subtype is required, so the deepest first leaf is chosen.
   */
  chooseFirstType(): void {
    cy.get(sel.typeInput).should("be.visible").click();
    cy.get(sel.typeList).should("be.visible").then(($list) => clickFirstLeaf($list));
    cy.get(sel.typeInput).should("not.have.class", "invalid");
  },
  chooseFirstPriority(): Cypress.Chainable<JQuery<HTMLElement>> {
    return chooseFirstOption(sel.priority);
  },
  chooseFirstSeverity(): Cypress.Chainable<JQuery<HTMLElement>> {
    return chooseFirstOption(sel.severity);
  },
  chooseFirstStatus(): Cypress.Chainable<JQuery<HTMLElement>> {
    return chooseFirstOption(sel.status);
  },
  chooseFirstDirection(): Cypress.Chainable<JQuery<HTMLElement>> {
    return chooseFirstOption(sel.directionUpDown);
  },
  chooseFirstRegion(): Cypress.Chainable<JQuery<HTMLElement>> {
    return chooseFirstOption(sel.region);
  },
  chooseFirstTraffic():Cypress.Chainable<JQuery<HTMLElement>> {
    cy.get(sel.trafficOption).first().scrollIntoView().should("be.visible").click();
    return cy.get(sel.trafficOption).first().should("have.class", "selected");
  },
  /**
   * Point location via the lat/lng inputs (event-location-picker.component.html:137,144), in the
   * Location accordion that opens by itself in create mode, below the visible part of the form.
   */
  setLocation(lat: number, lng: number): void {
    cy.get(sel.lat).scrollIntoView().should("be.visible").clear().type(String(lat));
    cy.get(sel.lng).scrollIntoView().should("be.visible").clear().type(String(lng));
  },
  save(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.save).should("be.enabled").click();
  },
};
