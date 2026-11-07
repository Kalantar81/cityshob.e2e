/**
 * Common module selectors. The webclient uses `data-testid` (no `data-cy` anywhere).
 * Entries marked TODO(testid) are CSS/ids used until the webclient adds a test id;
 * see README "Selectors the webclient still needs".
 */
export const testId = (id: string): string => `[data-testid="${id}"]`;

export const login = {
  email: "#email", // TODO(testid) login-email
  password: "#password", // TODO(testid) login-password
  submit: "#loginFormBtnLocal button", // TODO(testid) login-submit
  orgDropdown: 'p-dropdown[name="organizations"]', // TODO(testid) org-select
  orgSubmit: ".app-org-form button[type=submit]", // TODO(testid) org-submit
} as const;

export const nav = {
  avatar: testId("navbar-user-avatar"),
  sidebar: "#app-sidebar", // TODO(testid) app-sidebar
  logout: testId("sidebar-logout-btn"),
  dashboard: testId("sidebar-menu-dashboard"),
  settings: testId("sidebar-menu-settings"),
  workspace: (name: string): string => testId(`sidebar-workspace-${name.toLowerCase()}`),
} as const;

export const layout = {
  root: ".layout-wrap-page", // TODO(testid) layout-root
  editToggle: ".app-workspace-page-header p-inputswitch", // TODO(testid) layout-edit-toggle
  area: ".grid-stack-item", // TODO(testid) layout-area
  areaAddWidget: "button.app-workspace-layout-area-add-widget", // TODO(testid) area-add-widget-btn
  /** Full-size overlay that owns the layout context menu (layout-container.component.html:63, .scss:18-25). */
  contextTarget: ".context-menu-fix", // TODO(testid) layout-context-target
  /** Context menu "Add widget" item, icon pi-box (layout-container.component.ts:390-397); appended to body. */
  contextAddWidget: ".p-contextmenu .p-menuitem-link:has(.pi-box)", // TODO(testid) layout-ctx-add-widget
  widgetContainer: (type: string): string => `.app-widget-container.widget-${type}`,
  widgetTitle: ".topbar-area h2", // TODO(testid) widget-title
  widgetMenuButton: ".app-area-widget-menu button.btn-control", // TODO(testid) widget-menu-btn
  /** Popup p-menu appended to body; items are told apart by icon (labels are translated). */
  menuItem: ".p-menu-overlay .p-menuitem-link", // TODO(testid) widget-menu-<action>
  menuIcon: {
    edit: ".pi-pencil",
    toVirtual: ".pi-external-link",
    /** Both delete items use pi-trash; delete widget comes before delete area. */
    deleteWidget: ".pi-trash",
    deleteArea: ".pi-trash",
  },
} as const;

export const wizard = {
  root: ".p-sidebar:visible", // TODO(testid) widget-wizard
  typeDropdown: "app-widget-picker", // TODO(testid) widget-type-dropdown
  typeOption: (icon: string): string => `.p-dropdown-panel li.p-dropdown-item:has(i.${icon})`,
  size: (size: string): string => `#widget_size_${size}`,
  field: (key: string): string => `formly-form [id$="_${key}_0"], formly-form input[name="${key}"]`,
  submit: ".p-sidebar button.p-button-primary[type=submit]", // TODO(testid) widget-wizard-submit
  cancel: ".p-sidebar button.p-button-outlined", // TODO(testid) widget-wizard-cancel
} as const;

export const ui = {
  /** toastify-js toasts (shared/services/global-toast.service.ts:25-54). */
  toast: (severity?: string): string => (severity ? `.toastify.${severity}` : ".toastify"),
  confirmDialog: ".p-confirm-dialog", // TODO(testid) confirm-dialog
  confirmAccept: ".p-confirm-dialog .p-confirm-dialog-accept",
  confirmReject: ".p-confirm-dialog .p-confirm-dialog-reject",
  appSpinner: "app-spinner", // TODO(testid) app-spinner
  globalSpinner: ".global-top-overlay ngx-spinner .ngx-spinner-overlay",
} as const;
