import { grid as sel, contextMenu, ptz } from "../selectors";
import type { PlaybackMode } from "../types";

/** Camera grid, pane overlay buttons and grid bar (cameras/components/camera-grid, camera-pane-overlay, cameras-grid-bar). */
export const CameraGrid = {
  slots(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.slot);
  },
  cell(i: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.cell(i));
  },
  /** First <video> the vendor SDK rendered inside the cell. */
  video(i: number, timeout = 30000): Cypress.Chainable<JQuery<HTMLVideoElement>> {
    return cy.get(sel.cell(i), { timeout }).find<HTMLVideoElement>(sel.video, { timeout }).first();
  },
  clickFullscreen(i: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.fullscreen(i)).click({ force: true });
  },
  clickRemove(i: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.remove(i)).click({ force: true });
  },
  clickLayout(cells: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.layout(cells)).click();
  },
  openContextMenu(i: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.cell(i)).rightclick();
  },
  clickContextItem(mode: PlaybackMode): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(contextMenu[mode]).should("be.visible").click();
  },
  ptzZoom(i: number, dir: "in" | "out"): Cypress.Chainable<JQuery<HTMLElement>> {
    const btn = dir === "in" ? ptz.zoomIn : ptz.zoomOut;
    return cy.get(sel.cell(i)).closest("app-player").find(btn).trigger("pointerdown").trigger("pointerup");
  },
  openPresets(i: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.cell(i)).closest("app-player").find(ptz.presets).click();
  },
  clickPreset(i: number, name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.cell(i)).closest("app-player").contains(ptz.presetItem, name).click();
  },
};
