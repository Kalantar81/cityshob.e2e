import { layout as sel } from "../selectors";
import type { WidgetMenuAction, WidgetType } from "../types";

/** Selector of a layout area without a widget. */
export const emptyAreaSelector = `${sel.area}:has(${sel.areaAddWidget})`;

/** Selector of the layout area holding a widget of `type` (container class widget-<id>, widget-container.component.ts:41-45). */
export const widgetAreaSelector = (type: WidgetType): string => `${sel.area}:has(${sel.widgetContainer(type)})`;

/** A layout area (.grid-stack-item) and its widget menu (layouts/components/area, area-widget-menu). */
export const WidgetArea = {
  get(area: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(area);
  },
  clickAddWidget(area: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(area).first().find(sel.areaAddWidget).click();
  },
  /** Layout context menu > Add widget: works on any workspace, including one with no areas. */
  addWidgetFromContextMenu(): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.get(sel.contextTarget).rightclick({ force: true });
    return cy.get(sel.contextAddWidget).should("be.visible").click();
  },
  /** The menu button is revealed on hover, hence force. */
  openMenu(area: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(area).first().find(sel.widgetMenuButton).click({ force: true });
  },
  /** Items are matched by icon; delete widget is the first pi-trash item, delete area the last. */
  clickMenuItem(action: WidgetMenuAction): Cypress.Chainable<JQuery<HTMLElement>> {
    const items = cy.get(sel.menuItem).filter(`:visible:has(${sel.menuIcon[action]})`);
    return (action === "deleteArea" ? items.last() : items.first()).click();
  },
  toggleEditMode(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.editToggle).find(".p-inputswitch").click();
  },
};
