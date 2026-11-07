/**
 * Map (ArcGIS) selectors. The maps module has no test ids yet: every entry is a
 * TODO(testid), see README "Selectors the webclient still needs".
 */
export const map = {
  root: (id: string): string => `.map-container[data-uniqid="${id}"]`, // TODO(testid) map-root
  loading: ".map-loading-overlay", // TODO(testid) map-loading
  view: ".mapbox", // TODO(testid) map-view (#mapbox is duplicated when several maps exist)
  basemapButton: ".map-basemap-button", // TODO(testid) map-basemap-toggle
  search: "cscore-search-widget", // TODO(testid) map-search (inner DOM comes from cityshob-ui-kit)
  searchInput: "cscore-search-widget input",
} as const;

export const layers = {
  panel: "app-map-layers-panel",
  panelLoading: "app-map-layers-panel.layers-loading",
  trigger: "button.layers-panel__trigger", // TODO(testid) map-layers-toggle
  search: "input.layers-panel__search-input", // TODO(testid) map-layers-search
  row: "div.layers-panel__row[role=checkbox]", // TODO(testid) map-layer-row + data-layer-id
} as const;

export const popup = {
  loaded: "app-map-context-menu .wrapper", // TODO(testid) map-popup
  title: "app-map-context-menu .popup-multi-list",
  objectInfoDialog: ".object-info-content", // TODO(testid) map-object-info-dialog
} as const;
