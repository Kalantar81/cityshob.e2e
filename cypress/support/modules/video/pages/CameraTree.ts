import { tree as sel } from "../selectors";
import type { CameraRef } from "../types";

/** Camera list/tree (cameras/components/cameras-search-picker). */
export const CameraTree = {
  /** The list can be collapsed (isListVisible in city_shob); expand it when the toggle is shown. */
  ensureVisible(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("body").then(($body) => {
      if ($body.find(sel.showList).length) cy.get(sel.showList).click();
      return cy.get(sel.search).should("be.visible");
    });
  },
  search(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.search).clear().type(text);
  },
  item(ref: CameraRef): Cypress.Chainable<JQuery<HTMLElement>> {
    if (ref.unitId) return cy.get(sel.item(ref.unitId));
    if (ref.name) return cy.contains(sel.anyItem, ref.name);
    return cy.get(sel.anyItem).first();
  },
  /** Double click adds the camera to the next free grid cell (camera-item.component.ts:235-259). */
  addToGrid(ref: CameraRef): Cypress.Chainable<JQuery<HTMLElement>> {
    return CameraTree.item(ref).should("be.visible").dblclick();
  },
  expandGroup(index = 0): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.group).eq(index).click();
  },
};
