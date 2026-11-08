import { selectors as common } from "@common";

const { testId } = common;

/** Events table (events/components/events-table, p-treeTable). */
export const table = {
  root: "app-events-table", // TODO(testid) events-table
  row: (id: string): string => testId(`event-row-${id}`),
  anyRow: '[data-testid^="event-row-"]',
  empty: "app-events-table p-messages", // TODO(testid) events-empty-message
  loading: "app-events-table .p-treetable-loading-overlay",
  search: "app-events-table input.search-input", // TODO(testid) events-search-input
  sortableHeader: "app-events-table th.p-sortable-column", // TODO(testid) events-col-header-<key>
  paginator: "app-events-table p-paginator", // TODO(testid) events-paginator
  toggleFilters: testId("btn-toggle-filter-bar"),
  applyFilters: testId("btn-apply-filters"),
  filterToggle: (field: string): string => testId(`filter-toggle-${field}`),
  filterPopup: (field: string): string => testId(`filter-popup-${field}`),
  filterValue: testId("filter-value-input"),
  filterCheckbox: (value: string): string => testId(`filter-checkbox-${value}`),
  filterApply: testId("filter-apply-btn"),
  filterReset: testId("filter-reset-btn"),
} as const;

/**
 * Create-event wizard: p-sidebar .event-create-modal mounted globally (root-layout.component.html:28,
 * events-create.component.html:1-12). Scoped to the modal: app-event-details reuses the same test ids.
 */
const createModal = ".event-create-modal";
export const create = {
  open: testId("btn-navbar-create-event"),
  /** p-sidebar host (0x0 box, removed on close by *ngIf); the visible panel is `panel`. */
  modal: createModal, // TODO(testid) event-create-modal
  panel: `${createModal} .p-sidebar`,
  typeInput: `${createModal} ${testId("event-type-picker")} input.search-input`, // TODO(testid) event-type-search
  typeList: `${createModal} ${testId("event-type-picker")} .event-types-container`,
  typeLeaf: ".selectable-item", // TODO(testid) event-type-item
  priority: `${createModal} ${testId("priority-picker")} .p-dropdown`, // TODO(testid) priority-picker-dropdown (objectMode only today)
  severity: `${createModal} ${testId("severity-picker-wrapper")} .p-dropdown`,
  /** Radio group, required when the trafficField flag is on (event-traffic-picker.component.html). */
  trafficOption: `${createModal} app-event-traffic-picker label.traffic-radio-option`, // TODO(testid) traffic-option-<id>
  /** Wizard header, required when the NotificationStatus flag is on (events-create.component.html:25). */
  status: `${createModal} app-event-notifstatus-picker .p-dropdown`, // TODO(testid) notif-status-picker
  /** "Up/down" road direction, required when the CustomerDirectionLong flag is on (event-directions-picker). */
  directionUpDown: `${createModal} ${testId("event-directions-picker")}[automationid="UDUD"] .p-dropdown`,
  /** Merhav (region), shown when the merhav flag is on (event-location-v2.component.html:52-68). */
  region: `${createModal} ${testId("region-picker")} .p-dropdown`,
  lat: `${createModal} input#lat`, // TODO(testid) event-location-lat
  lng: `${createModal} input#lng`, // TODO(testid) event-location-lng
  save: `${createModal} ${testId("btn-save-event")}`,
} as const;

/** Event details p-sidebar (events/components/event-details, mounted in root-layout). */
export const details = {
  panel: ".event-details-modal", // TODO(testid) event-details-panel
  handle: testId("btn-handle-event"),
  unhandle: testId("btn-unhandle-event"),
  save: testId("btn-save-event"),
} as const;
