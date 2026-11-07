import { wizard as sel } from "../selectors";
import { WIDGETS, iconClass } from "../types";
import type { WidgetSize, WidgetType } from "../types";

/** Add/edit widget wizard: p-sidebar appended to body (widgets/components/widget-wizard). */
export const WidgetWizard = {
  root(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.root);
  },
  /** Picks the type by its metadata icon: labels are translated (widget-picker.component.html:9-15). */
  chooseType(type: WidgetType): Cypress.Chainable<JQuery<HTMLElement>> {
    const icon = iconClass(WIDGETS[type].icon);
    cy.get(sel.typeDropdown).find(".p-dropdown").should("be.visible").click();
    return cy.get(sel.typeOption(icon)).should("be.visible").click();
  },
  /** The dropdown shows the chosen type's icon. */
  selectedType(type: WidgetType): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.typeDropdown).find(`.p-dropdown-label i.${iconClass(WIDGETS[type].icon)}`);
  },
  /** Shown only when adding a widget without a target area (widget-wizard.component.html:24-49). */
  chooseSize(size: WidgetSize): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.size(size)).check({ force: true });
  },
  fill(field: string, value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.field(field)).first().clear().type(value);
  },
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.submit).should("be.enabled").click();
  },
  cancel(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.cancel).click();
  },
};
