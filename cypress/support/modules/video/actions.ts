/// <reference types="cypress" />
import { APP_STORAGE_KEY, openWorkspace } from "@common";
import type { Done } from "@common";
import { CameraTree } from "./pages/CameraTree";
import { CameraGrid } from "./pages/CameraGrid";
import { videoAliases, interceptVideo, listCameras } from "./api";
import { errors, grid, sdkErrorText, tree } from "./selectors";
import type { Camera, CameraRef, PlaybackMode, PlayerError } from "./types";

const done = (): Done => cy.wrap(null, { log: false });

/**
 * Removes the saved grid (layout, _cameraObj_<gridId>) from city_shob so cameras from a
 * previous run are not restored into the cells (cameras.service.ts:511, 1412-1414, 1903).
 */
export function clearSavedGrid(): Done {
  return cy
    .window({ log: false })
    .then((win) => {
      const raw = win.localStorage.getItem(APP_STORAGE_KEY);
      const state: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      Object.keys(state)
        .filter((k) => k === "layout" || k.startsWith("_cameraObj_"))
        .forEach((k) => delete state[k]);
      win.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    })
    .then(() => cy.wrap(null, { log: false }));
}

/** Opens the cameras workspace from the sidebar with an empty grid and the camera tree loaded. */
export function openCameras(workspaceName = "cameras"): Done {
  interceptVideo();
  cy.visit("/");
  clearSavedGrid();
  openWorkspace(workspaceName);
  cy.wait(`@${videoAliases.prepareVms}`, { timeout: 30000 });
  CameraTree.ensureVisible();
  return done();
}

export function searchCamera(text: string): Done {
  CameraTree.search(text);
  return done();
}

/** Double-clicks the camera in the tree; yields the index of the grid cell it landed in. */
export function addCameraToGrid(ref: CameraRef = {}): Cypress.Chainable<number> {
  interceptVideo();
  return CameraGrid.slots()
    .then(($slots) => $slots.toArray().findIndex((el) => el.classList.contains("empty")))
    .then((cell) => {
      if (cell < 0) throw new Error("No free grid cell: remove a camera or pick a larger layout first.");
      CameraTree.addToGrid(ref);
      cy.wait(`@${videoAliases.streamToken}`, { timeout: 30000 });
      CameraGrid.slots().eq(cell).should("not.have.class", "empty");
      return cy.wrap(cell, { log: false });
    });
}

/**
 * Asserts the stream really plays: the SDK's <video> has data (readyState >= 2), is not
 * paused, and currentTime advances. Fails fast when the player shows an error overlay.
 */
export function streamShouldPlay(cell: number, timeoutMs = 30000): Done {
  const playing = ($player: JQuery<HTMLElement>): boolean => {
    const v = $player[0].querySelector<HTMLVideoElement>(`${grid.cell(cell)} ${grid.video}`);
    return Boolean(v && v.readyState >= 2 && !v.paused);
  };
  // Retry until the player either plays or shows an error, then fail at once on the error.
  cy.get(grid.cell(cell), { timeout: timeoutMs })
    .closest("app-player", { timeout: timeoutMs })
    .should(($player) => {
      expect(playing($player) || playerErrorIn($player) !== null, `cell ${cell}: <video> readyState >= 2 and playing`).to.eq(true);
    })
    .then(($player) => {
      const shown = playerErrorIn($player);
      if (shown) throw new Error(`Player in cell ${cell} shows an error: ${shown}`);
    });
  return CameraGrid.video(cell, timeoutMs)
    .then(($v) => $v[0].currentTime)
    .then((t0) =>
      CameraGrid.video(cell, timeoutMs).should(($v) => {
        expect($v[0].currentTime, "video currentTime advances").to.be.gt(t0);
      }),
    )
    .then(() => cy.wrap(null, { log: false }));
}

/** "<kind>: <text>" of the first error overlay shown in the player, or null. */
function playerErrorIn($player: JQuery<HTMLElement>): string | null {
  for (const key of Object.keys(errors) as PlayerError[]) {
    const $err = $player.find(errors[key]);
    if ($err.length) {
      const text = (key === "sdk-error" ? $err.find(sdkErrorText) : $err).first().text().trim();
      return `${key}: ${text}`;
    }
  }
  return null;
}

/** Asserts the player shows one of its error overlays and yields which one. */
export function streamShouldFail(cell: number): Cypress.Chainable<PlayerError> {
  const any = Object.values(errors).join(", ");
  return CameraGrid.slots()
    .eq(cell)
    .find(any, { timeout: 30000 })
    .should("be.visible")
    .then(($el) => {
      const hit = (Object.keys(errors) as PlayerError[]).find((key) => $el.is(errors[key]));
      return hit ?? "unavailable";
    });
}

export function fullscreen(cell: number): Done {
  CameraGrid.clickFullscreen(cell);
  cy.get(grid.maximized).should("exist");
  return done();
}

export function removeFromGrid(cell: number): Done {
  CameraGrid.clickRemove(cell);
  CameraGrid.slots().eq(cell).should("have.class", "empty");
  return done();
}

export function setGridLayout(cells: number): Done {
  CameraGrid.clickLayout(cells);
  CameraGrid.slots().should("have.length.gte", cells);
  return done();
}

/** Switches live / fast playback / custom playback via the player's context menu. */
export function setPlaybackMode(cell: number, mode: PlaybackMode): Done {
  CameraGrid.openContextMenu(cell);
  CameraGrid.clickContextItem(mode);
  return done();
}

/** PTZ zoom; app controls exist only for non-VXG PTZ cameras in live mode (player.component.html:134). */
export function ptzZoom(cell: number, dir: "in" | "out"): Done {
  CameraGrid.ptzZoom(cell, dir);
  return done();
}

export function ptzGotoPreset(cell: number, name: string): Done {
  CameraGrid.openPresets(cell);
  CameraGrid.clickPreset(cell, name);
  return done();
}

/** Camera tree rendered with at least one camera row (works for a widget added to any workspace). */
export function cameraTreeShouldBeLoaded(): Done {
  CameraTree.ensureVisible();
  cy.get(tree.spinner).should("not.exist");
  return done();
}

/**
 * First camera that GET prepare-vms reports WorkingProperly. With `allowUnhealthy`, falls back
 * to the first camera (and logs its health) instead of failing.
 */
export function pickAvailableCamera(allowUnhealthy = false): Cypress.Chainable<Camera> {
  return listCameras().then((cams) => {
    const healthy = cams.find((c) => c.HealthState === "WorkingProperly");
    const cam = healthy ?? (allowUnhealthy ? cams[0] : undefined);
    if (!cam) {
      throw new Error(`No WorkingProperly camera among ${cams.length} returned by GET prepare-vms.`);
    }
    if (!healthy) Cypress.log({ name: "camera", message: `${cam.Name} is ${cam.HealthState ?? "unknown"}` });
    return cam;
  });
}
