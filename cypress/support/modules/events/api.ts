/// <reference types="cypress" />
import { bffRequest, cleanup } from "@common";
import { EventState } from "./types";
import type { ClosingReason, EventModel, SeedEvent } from "./types";

export const eventsAliases = {
  list: "eventsByFilters",
  get: "getEvent",
  handle: "handleEvent",
  unhandle: "unhandleEvent",
  create: "createEvent",
} as const;

/** Register before the action (events.service.ts:1148-1247, 537-595). */
export function interceptEvents(): Cypress.Chainable<null> {
  cy.intercept("POST", "**/api/v1/events/by-filters*").as(eventsAliases.list);
  cy.intercept("GET", /\/api\/v1\/events\/[^/?]+(\?.*)?$/).as(eventsAliases.get);
  cy.intercept("PUT", "**/api/v1/events/*/handle").as(eventsAliases.handle);
  cy.intercept("PUT", "**/api/v1/events/*/unhandle").as(eventsAliases.unhandle);
  // Wizard save: multipart POST events (event-wizard.service.ts:1023-1033).
  cy.intercept("POST", /\/api\/v1\/events(\?.*)?$/).as(eventsAliases.create);
  return cy.wrap(null, { log: false });
}

/** Builds a multipart/form-data body without extra libraries. */
function multipart(fields: Record<string, string>): { body: string; contentType: string } {
  const boundary = `----e2e${Date.now().toString(16)}`;
  const parts = Object.entries(fields).map(
    ([name, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
  );
  return { body: `${parts.join("")}--${boundary}--\r\n`, contentType: `multipart/form-data; boundary=${boundary}` };
}

/**
 * Creates an event via POST /api/v1/events (BFF routes/index.js:167-177) and tracks it for cleanup.
 * Description/Location/OccurrenceTime/Comment/StreetAddressObj must be JSON strings
 * (create-event-helper.js:143, 184, 284-298).
 */
export function seedEvent(data: SeedEvent): Cypress.Chainable<EventModel> {
  const fields: Record<string, string> = {
    EventType: String(data.EventType),
    EventSubType: String(data.EventSubType),
    Severity: String(data.Severity),
    Priority: String(data.Priority),
    SourceType: String(data.SourceType ?? 1),
    Description: JSON.stringify(data.Description),
    Location: JSON.stringify({ Type: "POINT", Coordinates: [data.location.lng, data.location.lat] }),
    OccurrenceTime: JSON.stringify(new Date().toISOString()),
  };
  // Always sent: the BFF JSON.parses StreetAddressObj unconditionally (create-event-helper.js:325).
  fields.StreetAddressObj = JSON.stringify(data.address);
  if (data.EventSubSubType !== undefined) fields.EventSubSubType = String(data.EventSubSubType);
  if (data.Comment) fields.Comment = JSON.stringify(data.Comment);

  const { body, contentType } = multipart(fields);
  return bffRequest<{ success?: boolean; EventID?: string | number }>("POST", "events", body, {
    "Content-Type": contentType,
  }).then((res) => {
    const id = res.body.EventID;
    expect(id, "seeded EventID").to.exist;
    cleanup.track("event", String(id));
    const seeded: EventModel = {
      EventID: String(id),
      EventType: data.EventType,
      EventSubType: data.EventSubType,
      Severity: data.Severity,
      Priority: data.Priority,
      Description: data.Description,
    };
    return seeded;
  });
}

export function getEvent(id: string): Cypress.Chainable<EventModel> {
  return bffRequest<EventModel>("GET", `events/${id}`).its("body");
}

/** Closing reasons of the environment (event-reference-data.service.ts:361). */
export function getClosingReasons(): Cypress.Chainable<ClosingReason[]> {
  return bffRequest<ClosingReason[] | { data: ClosingReason[] }>("GET", "events/info/closing-reasons").then((res) =>
    Array.isArray(res.body) ? res.body : res.body.data,
  );
}

/**
 * Takes the event in progress (PUT events/:id/handle {EventGUID}, BFF events.js) unless it already
 * is. Upstream closes with ownerId = current user (BFF externalApi/index.js closeEvent), and a fresh
 * event with no owner is refused with 500. Never fails: close reports the outcome.
 */
function handleBeforeClose(id: string): Cypress.Chainable<null> {
  return bffRequest<EventModel>("GET", `events/${id}`, undefined, {}, false).then((res) => {
    const guid = res.body?.EventGUID;
    if (!guid || res.body.State === EventState.InProgress) return cy.wrap(null, { log: false });
    return bffRequest("PUT", `events/${id}/handle`, { EventGUID: guid }, {}, false).then(() => cy.wrap(null, { log: false }));
  });
}

/**
 * PUT events/:id/close with body {Id: <closing reason>} (BFF externalApi/index.js closeEvent reads
 * params.Id only), after handleBeforeClose(). The BFF answers 200 with {error} when upstream refuses,
 * so the body is checked too. Never throws: yields an error message, or null on success. Without
 * `reasonId` the first closing reason is used.
 */
export function tryCloseEvent(id: string, reasonId?: string | number): Cypress.Chainable<string | null> {
  const reason: Cypress.Chainable<string | number | undefined> =
    reasonId !== undefined
      ? cy.wrap<string | number | undefined>(reasonId, { log: false })
      : getClosingReasons().then((r) => cy.wrap<string | number | undefined>(r[0]?.Id, { log: false }));
  return reason.then((Id): Cypress.Chainable<string | null> => {
    if (Id === undefined) return cy.wrap<string | null>("no closing reason available", { log: false });
    handleBeforeClose(id);
    return bffRequest<{ error?: unknown }>("PUT", `events/${id}/close`, { Id }, {}, false).then((res) => {
      const failed = res.status >= 400 || Boolean(res.body && typeof res.body === "object" && "error" in res.body);
      return cy.wrap<string | null>(failed ? `close -> ${res.status} ${JSON.stringify(res.body).slice(0, 200)}` : null, {
        log: false,
      });
    });
  });
}

/** There is no DELETE for events: closing is the only removal (BFF events.js:455-469). */
export function closeEvent(id: string, reasonId?: string | number): Cypress.Chainable<null> {
  return tryCloseEvent(id, reasonId).then((problem) => {
    expect(problem, `close event ${id}`).to.eq(null);
    return cy.wrap(null, { log: false });
  });
}

cleanup.register("event", (id) => tryCloseEvent(id));
