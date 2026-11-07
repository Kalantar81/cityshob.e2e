/** Event state enum (WC domain/events.types.ts:29-35). */
export enum EventState {
  New = 0,
  Unhandled = 1,
  InProgress = 2,
  Suspended = 3,
  Closed = 4,
}

/** Subset of EventModel the tests use (WC domain/events.models.ts:703+; JSON id field is EventID). */
export interface EventModel {
  EventID: string;
  EventGUID?: string;
  EventType?: number;
  EventSubType?: number;
  Severity?: number;
  Priority?: number;
  State?: EventState;
  Description?: string;
  StreetAddress?: string;
  OccurrenceTime?: string;
}

/**
 * Fields for POST /api/v1/events (multipart). Upstream-required ids depend on the environment's
 * reference data, so keep them in cypress/fixtures/events/seed.json per environment.
 * Parsing reference: BFF models/event/create-event-helper.js:140-300.
 */
export interface SeedEvent {
  EventType: number;
  EventSubType: number;
  EventSubSubType?: number;
  Severity: number;
  Priority: number;
  Description: string;
  location: { lng: number; lat: number };
  /** StreetAddressObj (sent as JSON string). Required: the BFF parses it unconditionally (create-event-helper.js:325). */
  address: Record<string, unknown>;
  Comment?: string;
  SourceType?: number;
}

/** Closing reason (GET events/info/closing-reasons). */
export interface ClosingReason {
  Id: string | number;
  Name?: string;
}

/** Visible column headers in the events table (English UI, events.helper.ts:63+). */
export type EventColumn = string;

export type SortDirection = "asc" | "desc";
