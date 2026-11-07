/// <reference types="cypress" />
import { openWorkspace } from "@common";
import type { Done } from "@common";
import { EventsTable } from "./pages/EventsTable";
import { EventDetails } from "./pages/EventDetails";
import { eventsAliases, interceptEvents } from "./api";
import { table } from "./selectors";
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
