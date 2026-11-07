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

/** Event details p-sidebar (events/components/event-details, mounted in root-layout). */
export const details = {
  panel: ".event-details-modal", // TODO(testid) event-details-panel
  handle: testId("btn-handle-event"),
  unhandle: testId("btn-unhandle-event"),
  save: testId("btn-save-event"),
} as const;
