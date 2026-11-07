/** Camera as returned by GET prepare-vms (cameras.service.ts:1002-1022, domain/cameras.models.ts:30-69). */
export interface Camera {
  UnitId: string;
  PhysicalId: string;
  Name: string;
  /** 1 = Camera, 2 = CameraPTZ (cameras.models.ts:207-210). */
  UnitTypeId: number;
  HealthState?: CameraHealth;
  VmsID?: string;
}

export type CameraHealth = "WorkingProperly" | "Warning" | "Failed" | "Unknown" | "Inactive" | "Malfunction";

/** One VMS entry of GET prepare-vms. */
export interface VmsEntry {
  vmsId: string;
  vmsName: string;
  hostAddress: string;
  cameras: Camera[];
}

/** Identify a camera by tree UnitId (data-testid camera-item-<UnitId>) and/or by visible name. */
export interface CameraRef {
  unitId?: string;
  name?: string;
}

export type PlaybackMode = "live" | "fast" | "custom";

/** Error states the player renders (player.component.html:67-105, camera-pane-overlay.component.html:32-38). */
export type PlayerError = "no-access" | "camera-in-use" | "unavailable" | "sdk-error";

/** Grid sizes offered by the grid bar (data-testid btn-grid-bar-layout-<cells>). */
export type GridCells = 1 | 4 | 6 | 9 | 16 | (number & {});
