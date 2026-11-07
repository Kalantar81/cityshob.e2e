/// <reference types="cypress" />
import type { Done } from "@common";
import { MapWidget } from "./pages/MapWidget";
import { LayersPanel } from "./pages/LayersPanel";
import { MapPopup } from "./pages/MapPopup";
import { getMapView, hasMapHook } from "./api";
import type { LngLat, MapId, MapPopupInfo } from "./types";
import { layers } from "./selectors";

const done = (): Done => cy.wrap(null, { log: false });

/**
 * Waits until the map is usable. DOM signals always; when the e2e hook exists,
 * additionally waits for view.ready && !view.updating (layer views drawn).
 */
export function waitForMapLoaded(id: MapId = "global"): Done {
  MapWidget.shouldBeLoaded(id);
  return hasMapHook(id).then((hook) => {
    if (hook) {
      getMapView(id).should((view) => {
        expect(view.ready, "view.ready").to.eq(true);
        expect(view.updating, "view.updating").to.eq(false);
      });
    }
    return cy.wrap(null, { log: false });
  });
}

export function layerShouldBe(name: string, on: boolean): Done {
  LayersPanel.row(name).should("have.attr", "aria-checked", String(on));
  return done();
}

/** Opens the layers panel if needed and sets the layer visibility. */
export function toggleLayer(name: string, on: boolean): Done {
  // The trigger toggles the panel, so click it only while the panel's search box is not shown.
  cy.get(layers.trigger).first().then(() =>
    cy.get("body").then(($body) => {
      if (!$body.find(`${layers.search}:visible`).length) LayersPanel.open();
    }),
  );
  cy.get(layers.search).should("be.visible");
  LayersPanel.filter(name);
  LayersPanel.row(name).then(($row) => {
    if ($row.attr("aria-checked") !== String(on)) LayersPanel.click(name);
  });
  return layerShouldBe(name, on);
}

/** Types into the map search widget (cscore-search-widget; inner DOM from cityshob-ui-kit). */
export function searchLocation(text: string, id: MapId = "global"): Done {
  MapWidget.typeSearch(id, text);
  return done();
}

/** Requires the e2e hook: view.goTo + wait until stationary. */
export function centerAt(point: LngLat, zoom?: number, id: MapId = "global"): Done {
  return getMapView(id)
    .then((view) => cy.wrap(view.goTo({ center: [point.lng, point.lat], zoom }), { log: false }))
    .then(() => getMapView(id).should((view) => expect(view.stationary && !view.updating, "map settled").to.eq(true)))
    .then(() => cy.wrap(null, { log: false }));
}

/** Requires the e2e hook: converts the coordinate to screen pixels and clicks the map there. */
export function clickAt(point: LngLat, id: MapId = "global"): Done {
  return getMapView(id)
    .then((view) => {
      const screen = view.toScreen({ type: "point", longitude: point.lng, latitude: point.lat });
      if (!screen) throw new Error(`Point ${point.lng},${point.lat} is outside the current view`);
      return MapWidget.clickAtScreen(id, screen.x, screen.y);
    })
    .then(() => cy.wrap(null, { log: false }));
}

/** Reads the feature popup opened by a map click. */
export function readPopup(): Cypress.Chainable<MapPopupInfo> {
  return MapPopup.root()
    .should("be.visible")
    .then(($el) => ({
      title: $el.find(".popup-multi-list").first().text().trim(),
      text: $el.text().trim(),
    }));
}
