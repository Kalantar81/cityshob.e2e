import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { WIDGETS, createTempWorkspace, createWidget, deleteWidget, findWidget, openTempWorkspaceWith, openWorkspaceById } from "@common";
import type { WidgetConfig, WidgetType } from "@common";

function widgetType(value: string): WidgetType {
  if (!(value in WIDGETS)) {
    throw new Error(`Unknown widget type "${value}". Use one of: ${Object.keys(WIDGETS).join(", ")}`);
  }
  return value as WidgetType;
}

Given("I am on a temporary workspace", () => {
  createTempWorkspace().then((ws) => openWorkspaceById(ws.id));
});

/** Seeds the widget through the BFF (no UI): for module tests that need the widget, not its creation. */
Given("I am on a temporary workspace with a {string} widget", (value: string) => {
  openTempWorkspaceWith(widgetType(value));
});

/** Configuration comes from cypress/fixtures/common/widgets.json, keyed by widget type. */
When("I create a {string} widget", (value: string) => {
  const type = widgetType(value);
  cy.fixture<Partial<WidgetConfig>>("common/widgets.json").then((configs) => {
    const config = (configs[type] ?? {}) as WidgetConfig[typeof type];
    createWidget(type, config);
  });
});

Then("the {string} widget is shown", (value: string) => {
  findWidget(widgetType(value)).should("be.visible");
});

When("I delete the {string} widget", (value: string) => {
  deleteWidget(widgetType(value));
});
