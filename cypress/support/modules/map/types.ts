export interface LngLat {
  lng: number;
  lat: number;
}

/** Map instance id (`uniqid` input of app-arcgis-map). The main map widget uses "global" (map.component.ts:38). */
export type MapId = "global" | "create-event" | `event-view-${string}` | (string & {});

/** Layer ids drawn by the webclient (map-entities-factory.service.ts, assets/config/map-layers.config.json). */
export const MAP_LAYERS = {
  cameras: "4",
  tls: "5",
  eventsCritical: "events-critical",
  eventsHigh: "events-high",
  eventsMediumLow: "events-medium-low-verylow",
  singleEventMarker: "single-event-marker",
} as const;

export interface MapPopupInfo {
  title: string;
  text: string;
}

/**
 * Minimal shape of the ArcGIS MapView the e2e hook would expose (window.__e2e.mapViews[id]).
 * Declared here to avoid depending on @arcgis/core types.
 */
export interface E2eMapView {
  ready: boolean;
  updating: boolean;
  stationary: boolean;
  zoom: number;
  goTo(target: { center: [number, number]; zoom?: number }): Promise<unknown>;
  toScreen(point: { type: "point"; longitude: number; latitude: number }): { x: number; y: number } | null;
}

export interface E2eHooks {
  mapViews?: Record<string, E2eMapView>;
}
