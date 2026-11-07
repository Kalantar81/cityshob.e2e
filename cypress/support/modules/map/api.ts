/// <reference types="cypress" />
import type { E2eHooks, E2eMapView } from "./types";

export const mapAliases = {
  layerQuery: "mapLayerQuery",
} as const;

/** ArcGIS feature-layer queries (map-entities-factory.service.ts:676: <portal>/<layerId>/query). */
export function interceptMap(): Cypress.Chainable<null> {
  cy.intercept("GET", "**/MapServer/*/query*").as(mapAliases.layerQuery);
  return cy.wrap(null, { log: false });
}

const HOOK_MISSING =
  "This map helper needs the webclient e2e hook (window.__e2e.mapViews[<uniqid>]), which is not " +
  "implemented yet. See README > Map module > e2e hook.";

/** True when the app exposes the proposed e2e hook. */
export function hasMapHook(id: string): Cypress.Chainable<boolean> {
  return cy.window({ log: false }).then((win) => {
    const hooks = (win as Window & { __e2e?: E2eHooks }).__e2e;
    return Boolean(hooks?.mapViews?.[id]);
  });
}

/** MapView from the e2e hook; fails with a clear message when the hook is absent. */
export function getMapView(id: string): Cypress.Chainable<E2eMapView> {
  return cy.window({ log: false }).then((win) => {
    const view = (win as Window & { __e2e?: E2eHooks }).__e2e?.mapViews?.[id];
    if (!view) throw new Error(HOOK_MISSING);
    return view;
  });
}
