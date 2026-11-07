/** Value yielded by helpers that only perform an action. */
export type Done = Cypress.Chainable<null>;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";

export interface Credentials {
  email: string;
  password: string;
  /** Organization to pick on /auth/organizations (multi-org users only). */
  org?: string;
}

/** Last class of a metadata icon ("pi pi-map" -> "pi-map"), usable as a CSS class selector. */
export const iconClass = (icon: string): string => icon.split(" ").pop() ?? icon;

/**
 * Widget types registered in the webclient
 * (WC widgets/services/widgets.service.ts:29-34, each widget-<x>/metadata.ts).
 */
export type WidgetType = "browser" | "map" | "events_table" | "cameras";

/**
 * `name` is the metadata name; `icon` is the metadata icon class. The wizard dropdown shows the
 * icon next to a translated label, so the icon is the language-independent way to pick a type.
 */
export const WIDGETS: Readonly<Record<WidgetType, { name: string; icon: string }>> = {
  browser: { name: "Browser", icon: "icon icon-browser" },
  map: { name: "Map", icon: "pi pi-map" },
  events_table: { name: "Events table", icon: "pi pi-calendar" },
  cameras: { name: "Cameras", icon: "pi pi-camera" },
};

/** Widget menu actions (area-widget-menu.component.ts:43-76). */
export type WidgetMenuAction = "edit" | "toVirtual" | "deleteWidget" | "deleteArea";

/** Formly configuration per widget type. Only Browser has fields (widget-browser/metadata.ts:16-32). */
export interface WidgetConfig {
  browser: { url: string };
  map: Record<string, never>;
  events_table: Record<string, never>;
  cameras: Record<string, never>;
}

export type WidgetSize = "xs" | "sm" | "md" | "lg";

export interface GridStackWidget {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutArea {
  id: string;
  gridStackWidget: GridStackWidget;
  /**
   * Never seed an area without a real widget: layout-container.component.ts:370 reads
   * area.widget.id for every area and the page crashes (an empty `{}` deserializes to undefined).
   */
  widget: {
    id?: WidgetType;
    name?: string;
    icon?: string;
    settings?: Record<string, unknown>;
    fields?: unknown[];
    areaId?: string;
    preferredSize?: WidgetSize;
  };
}

export interface Layout {
  gridStackOptions?: Record<string, unknown>;
  areas: LayoutArea[];
}

/** BFF models/workspace.js (toJSON maps _id -> id). */
export interface Workspace {
  id: string;
  name: string;
  order?: number;
  virtual?: boolean;
}

export type ToastSeverity = "success" | "info" | "warning" | "error";

/** Handle of a widget rendered in a layout area. */
export interface WidgetHandle {
  type: WidgetType;
  /** Selector of the layout area (.grid-stack-item) that holds the widget. */
  area: string;
}
