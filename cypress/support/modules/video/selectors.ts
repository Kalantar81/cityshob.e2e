import { selectors as common } from "@common";

const { testId } = common;

/** Camera tree (cameras/components/cameras-search-picker, camera-item). */
export const tree = {
  showList: testId("btn-cameras-show-list"),
  search: "#cameras_filterquery", // TODO(testid) camera-tree-search
  group: ".camera-folder > button", // TODO(testid) camera-tree-group-<GroupId>
  item: (unitId: string): string => testId(`camera-item-${unitId}`),
  anyItem: '[data-testid^="camera-item-"]',
  itemName: ".camera-item-name",
  spinner: "app-cameras-search-picker app-spinner",
} as const;

/** Grid + player cells (videos/components/player, camera-pane-overlay, cameras-grid-bar). */
export const grid = {
  /** Grid slots (cameras/components/camera-grid/camera-grid.component.html:7-14); `.empty` = no camera. */
  slot: ".grid-container > .grid-item", // TODO(testid) video-grid-cell-<i>
  /** Player stage where the vendor SDK injects its <video> (player.component.html:75-87). */
  cell: (i: number): string => `.camera-holder.camera-${i}`, // TODO(testid) video-player-stage-<i>
  video: "video",
  liveIndicator: ".live", // TODO(testid) video-player-live-indicator
  fullscreen: (i: number): string => testId(`btn-camera-pane-fullscreen-${i}`),
  remove: (i: number): string => testId(`btn-camera-pane-remove-${i}`),
  layout: (cells: number): string => testId(`btn-grid-bar-layout-${cells}`),
  maximized: ".grid-item.maximized",
} as const;

/** Player error overlays. */
export const errors = {
  "no-access": ".no-access", // TODO(testid) video-player-no-access
  "camera-in-use": ".locked-camera-alert", // TODO(testid) video-player-camera-in-use
  unavailable: ".pane-unavailable",
  /** VXG CloudPlayerSDK renders its own error box inside the cell (e.g. "Network error"). */
  "sdk-error": ".cloudplayer-error:visible",
} as const;

export const sdkErrorText = ".cloudplayer-error-text";

/** Right-click p-contextMenu on the player, appended to body (player-context-menu.component.ts:59-118). */
export const contextMenu = {
  live: ".p-contextmenu .live", // TODO(testid) ctx-live
  fast: ".p-contextmenu .fast-playback", // TODO(testid) ctx-fast-playback
  custom: ".p-contextmenu .custom-playback", // TODO(testid) ctx-custom-playback
} as const;

/** PTZ controls; hidden for VXG cameras which render their own joystick (vxgPlayerAdapter.ts:29). */
export const ptz = {
  zoomOut: '.control-icon:has(img[alt="zoom out"])', // TODO(testid) btn-ptz-zoom-out (player.component.html:149-164)
  zoomIn: '.control-icon:has(img[alt="zoom in"])', // TODO(testid) btn-ptz-zoom-in (player.component.html:171-185)
  presets: ".presets-control img", // TODO(testid) btn-ptz-presets (player.component.html:192-203)
  presetItem: ".presets-menu li:not(.presets-menu-empty)", // TODO(testid) ptz-preset-<id>
} as const;
