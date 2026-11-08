/// <reference types="cypress" />
import { cleanup, createTempWorkspace, createWidget, openDashboard, openWorkspace, openWorkspaceById, toast } from "@common";
import type { Done } from "@common";
import { EventsTable } from "./pages/EventsTable";
import { EventDetails } from "./pages/EventDetails";
import { EventCreate } from "./pages/EventCreate";
import { eventsAliases, interceptEvents } from "./api";
import { create, table } from "./selectors";
import type { EventColumn, SortDirection } from "./types";

const done = (): Done => cy.wrap(null, { log: false });

/** Table loaded: no loading overlay, and either rows or the empty message rendered. */
export function eventsTableShouldBeLoaded(): Done {
  EventsTable.root().should("be.visible");
  cy.get(table.loading, { timeout: 30000 }).should("not.exist");
  cy.get(`${table.anyRow}, ${table.empty}`, { timeout: 30000 }).should("exist");
  return done();
}

/** Waits for the list request carrying `search=<text>`; earlier refreshes are skipped. */
function waitForSearchRequest(text: string, attemptsLeft = 5): Done {
  return cy.wait(`@${eventsAliases.list}`).then((i) => {
    if (new URL(i.request.url).searchParams.get("search") === text) return done();
    if (attemptsLeft <= 0) throw new Error(`No events/by-filters request with search="${text}"`);
    return waitForSearchRequest(text, attemptsLeft - 1);
  });
}

/** Opens the events workspace from the sidebar (widget events_table). */
export function openEventsTable(workspaceName = "events"): Done {
  interceptEvents();
  openWorkspace(workspaceName);
  cy.wait(`@${eventsAliases.list}`, { timeout: 30000 });
  return eventsTableShouldBeLoaded();
}

/** Search box is debounced 500ms (events-table.component.ts:656): wait on the request, not a timer. */
export function search(text: string): Done {
  interceptEvents();
  EventsTable.typeSearch(text);
  waitForSearchRequest(text);
  return eventsTableShouldBeLoaded();
}

/** Text filter on a column field (table-filters / table-filter components). */
export function filterBy(field: string, value: string): Done {
  interceptEvents();
  EventsTable.openFilter(field);
  cy.get(table.filterPopup(field)).should("be.visible");
  EventsTable.typeFilterValue(value);
  EventsTable.applyFilter();
  cy.wait(`@${eventsAliases.list}`);
  return eventsTableShouldBeLoaded();
}

/** Clicks the column header until PrimeNG reports the wanted aria-sort. */
export function sortBy(column: EventColumn, dir: SortDirection): Done {
  const want = dir === "asc" ? "ascending" : "descending";
  interceptEvents();
  EventsTable.header(column).click();
  cy.wait(`@${eventsAliases.list}`);
  EventsTable.header(column).then(($th) => {
    if ($th.attr("aria-sort") !== want) {
      EventsTable.header(column).click();
      cy.wait(`@${eventsAliases.list}`);
    }
  });
  EventsTable.header(column).should("have.attr", "aria-sort", want);
  return done();
}

// ---------------------------------------------------------------- event workspace + create wizard

/** Aliases (static) shared between the steps of one scenario. */
const EVENT_WORKSPACE = "eventWorkspaceId";
const CREATED_EVENT = "createdEventId";

/**
 * Throwaway workspace (BFF, tracked for cleanup) with an Events table widget added through the UI,
 * opened and loaded. Dashboard (/dashboard) holds no widgets, so the widget lives in a workspace.
 */
export function createEventWorkspace(): Done {
  createTempWorkspace(`e2e-events-${Date.now()}`).then((ws) => {
    cy.wrap(ws.id, { log: false }).as(EVENT_WORKSPACE, { type: "static" });
    openWorkspaceById(ws.id);
  });
  createWidget("events_table", {});
  return eventsTableShouldBeLoaded();
}

/** Re-opens the workspace made by createEventWorkspace(). */
export function openEventWorkspace(): Done {
  return cy.get<string>(`@${EVENT_WORKSPACE}`, { log: false }).then((id) => openWorkspaceById(id));
}

export function backToDashboard(): Done {
  return openDashboard();
}

/** Navbar "create event" (navbar.component.html:114-122); needs the Events+Create permission. */
export function openCreateEvent(): Done {
  EventCreate.open();
  return done();
}

export function chooseFirstEventType(): Done {
  EventCreate.chooseFirstType();
  return done();
}

export function chooseFirstPriority(): Done {
  EventCreate.chooseFirstPriority();
  return done();
}

export function chooseFirstSeverity(): Done {
  EventCreate.chooseFirstSeverity();
  return done();
}

export function chooseFirstStatus(): Done {
  EventCreate.chooseFirstStatus();
  return done();
}

export function chooseFirstDirection(): Done {
  EventCreate.chooseFirstDirection();
  return done();
}

export function chooseFirstRegion(): Done {
  EventCreate.chooseFirstRegion();
  return done();
}

export function chooseFirstTraffic(): Done {
  EventCreate.chooseFirstTraffic();
  return done();
}

export function setEventLocation(lat: number, lng: number): Done {
  EventCreate.setLocation(lat, lng);
  return done();
}

/**
 * Saves the wizard and waits for POST events. The new EventID (response body, event-wizard.service.ts:
 * 1024-1031) is tracked for cleanup (closed: there is no DELETE) and remembered for later steps.
 * On success the app shows a success toast and closes the wizard (events-create.component.ts:894-895).
 */
export function saveEvent(): Done {
  interceptEvents();
  EventCreate.save();
  cy.wait(`@${eventsAliases.create}`, { timeout: 30000 }).then(({ response }) => {
    expect(response?.statusCode, "POST events status").to.be.lessThan(400);
    const body = (response?.body ?? {}) as { success?: boolean; EventID?: string | number };
    expect(body.success, "POST events success").not.to.eq(false);
    expect(body.EventID, "created EventID").to.exist;
    const id = String(body.EventID);
    cleanup.track("event", id);
    cy.wrap(id, { log: false }).as(CREATED_EVENT, { type: "static" });
  });
  toast.shouldShow("success");
  cy.get(create.modal).should("not.exist");
  return done();
}

/** The saved event reaches the table over WS (refreshEventTable) and is inserted as the first row. */
export function createdEventShouldBeInTable(timeout = 30000): Done {
  cy.get<string>(`@${CREATED_EVENT}`, { log: false }).then((id) => {
    cy.get(table.row(id), { timeout }).should("be.visible");
  });
  return done();
}

export function rowShouldExist(id: string, timeout = 10000): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(table.row(id), { timeout }).should("exist");
}

export function openDetails(id: string): Done {
  interceptEvents();
  EventsTable.clickRow(id);
  cy.wait(`@${eventsAliases.get}`);
  EventDetails.panel().should("be.visible");
  return done();
}

export function handle(): Done {
  interceptEvents();
  EventDetails.clickHandle();
  cy.wait(`@${eventsAliases.handle}`).its("response.statusCode").should("be.lessThan", 400);
  return done();
}

export function unhandle(): Done {
  interceptEvents();
  EventDetails.clickUnhandle();
  cy.wait(`@${eventsAliases.unhandle}`).its("response.statusCode").should("be.lessThan", 400);
  return done();
}

/**
 * Waits for an event pushed over the websocket (subject refreshEventTable, BFF
 * utils/events-ws-helper.js:357-362) to appear without reloading. The table applies WS
 * updates only when `useEventsWS` is on in the app config (events-table.component.ts:352-357).
 * The row could also come from a list refresh; to prove WS delivery, also assert that no
 * `@eventsByFilters` request fired after `interceptEvents()`.
 */
export function waitForRealtimeEvent(id: string, timeout = 60000): Done {
  cy.get(table.row(id), { timeout }).should(($row) => {
    expect($row.length, `event ${id} pushed to the table (is useEventsWS enabled?)`).to.eq(1);
  });
  return done();
}
