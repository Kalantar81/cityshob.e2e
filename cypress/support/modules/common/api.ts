/// <reference types="cypress" />
import type { Interception } from "cypress/types/net-stubbing";
import type { HttpMethod, Layout, LayoutArea, Workspace } from "./types";

/** localStorage key holding the whole webclient state (local-storage.service.ts:9). */
export const APP_STORAGE_KEY = "city_shob";
/** Sub-key of APP_STORAGE_KEY holding the session tokens (webclient app_config.ts:467). */
export const AUTH_SESSION_KEY = "AUTH_TOKEN";

export const apiUrl = (path: string): string =>
  `${Cypress.expose("apiUrl") as string}/${path.replace(/^\//, "")}`;

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

type AppState = Record<string, unknown> & { [AUTH_SESSION_KEY]?: Partial<AuthTokens> };

/** Parsed APP_STORAGE_KEY of the app origin, or null when the key is absent. */
export function readAppState(): Cypress.Chainable<AppState | null> {
  return cy.getAllLocalStorage({ log: false }).then((all) => {
    const origin = new URL(Cypress.config("baseUrl") as string).origin;
    const raw = all[origin]?.[APP_STORAGE_KEY];
    return cy.wrap<AppState | null>(typeof raw === "string" ? (JSON.parse(raw) as AppState) : null, { log: false });
  });
}

/** Access token of the current session from the app's localStorage, or null when logged out. */
export function findAccessToken(): Cypress.Chainable<string | null> {
  return readAppState().then((state) => cy.wrap<string | null>(state?.[AUTH_SESSION_KEY]?.access_token ?? null, { log: false }));
}

/** Access + refresh token of the current session; fails when either is missing. */
export function getAuthTokens(): Cypress.Chainable<AuthTokens> {
  return readAppState().then((state) => {
    const { access_token, refresh_token } = state?.[AUTH_SESSION_KEY] ?? {};
    if (!access_token || !refresh_token) throw new Error(`No ${AUTH_SESSION_KEY} in localStorage "${APP_STORAGE_KEY}": log in first.`);
    return cy.wrap<AuthTokens>({ access_token, refresh_token }, { log: false });
  });
}

/**
 * Status of HEAD auth/token/alive for `token`. The BFF looks the token up in its token store
 * (bff auth/index.js:88-94): 200 while it is live, 401 once revoked or expired. Never fails on status.
 */
export function tokenAliveStatus(token: string): Cypress.Chainable<number> {
  return cy
    .request({
      method: "HEAD",
      url: apiUrl("auth/token/alive"),
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      log: false,
    })
    .then((res) => cy.wrap(res.status, { log: false }));
}

/** Access token of the current session; fails when there is none. */
export function getAccessToken(): Cypress.Chainable<string> {
  return findAccessToken().then((token) => {
    if (!token) throw new Error("No access token in localStorage: call cy.login(role) first.");
    return token;
  });
}

/** Authenticated request to the BFF (`apiUrl` from config/<env>.json). */
export function bffRequest<T>(
  method: HttpMethod,
  path: string,
  body?: object | string,
  headers: Record<string, string> = {},
  failOnStatusCode = true,
): Cypress.Chainable<Cypress.Response<T>> {
  return getAccessToken().then((token) =>
    cy.request<T>({
      method,
      url: apiUrl(path),
      body,
      headers: { Authorization: `Bearer ${token}`, ...headers },
      failOnStatusCode,
    }),
  );
}

/** Intercept aliases shared by the modules. Register before the action that triggers them. */
export const aliases = {
  login: "authToken",
  logout: "usersLogout",
  settings: "usersSettings",
  workspaceLayout: "workspaceLayout",
  saveLayout: "saveLayout",
} as const;

export function interceptCommon(): Cypress.Chainable<null> {
  cy.intercept({ method: "POST", url: "**/api/v1/auth/token" }, { log: false }).as(aliases.login);
  cy.intercept({ method: "POST", url: "**/api/v1/users/logout" }, { log: false }).as(aliases.logout);
  cy.intercept("GET", "**/api/v1/users/settings*").as(aliases.settings);
  cy.intercept("GET", "**/api/v1/users/workspaces/*/layout").as(aliases.workspaceLayout);
  cy.intercept("PUT", "**/api/v1/users/workspaces/*/layout").as(aliases.saveLayout);
  return cy.wrap(null, { log: false });
}

// ---------------------------------------------------------------- layout write settling
//
// The BFF debounces PUT layout by 3s and then upserts (controllers/layouts.js:16-46). Deleting a
// workspace before that write lands lets the upsert recreate an orphan layout, so the helpers that
// save a layout wait, inside their step, until GET layout returns what was PUT.
// Do this inside steps only: reading intercept aliases from afterEach, or a second intercept on
// PUT layout, breaks the cucumber preprocessor ("Included pickle stack is unsynchronized").

const fingerprint = (areas: unknown): string =>
  JSON.stringify(
    (Array.isArray(areas) ? (areas as Array<Partial<LayoutArea> | null>) : []).map((a) => [a?.id ?? null, a?.widget?.id ?? null]),
  );

const areasOf = (body: unknown): unknown => {
  try {
    const parsed: unknown = typeof body === "string" ? JSON.parse(body) : body;
    return parsed && typeof parsed === "object" ? (parsed as { areas?: unknown }).areas : undefined;
  } catch {
    return undefined;
  }
};

/** Re-requests GET layout until it matches or `deadline` (epoch ms) passes; bounded by time, not a sleep. */
function pollLayout(id: string, expected: string, token: string, deadline: number): Cypress.Chainable<boolean> {
  return cy
    .request<Layout>({
      url: apiUrl(`users/workspaces/${id}/layout`),
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      log: false,
    })
    .then((res) => {
      if (fingerprint(res.body?.areas) === expected) return cy.wrap(true, { log: false });
      if (Date.now() > deadline) return cy.wrap(false, { log: false });
      return pollLayout(id, expected, token, deadline);
    });
}

/** Waits until the BFF has persisted the layout of a PUT users/workspaces/:id/layout interception. */
export function waitForLayoutPersisted(saved: Interception<unknown, unknown>): Cypress.Chainable<null> {
  const id = /users\/workspaces\/([^/]+)\/layout/.exec(saved.request.url)?.[1];
  if (!id) return cy.wrap(null, { log: false });
  const expected = fingerprint(areasOf(saved.request.body));
  return getAccessToken()
    // The BFF debounce is 3s (layouts.js:7); allow 15s for a slow environment.
    .then((token) => pollLayout(id, expected, token, Date.now() + 15000))
    .then((settled) => {
      expect(settled, `layout of workspace ${id} persisted by the BFF`).to.eq(true);
      return cy.wrap(null, { log: false });
    });
}

/** POST users/workspaces with an initial layout, stored immediately (BFF controllers/workspaces.js:66-98). */
export function createWorkspace(name: string, layout: Layout): Cypress.Chainable<Workspace> {
  return bffRequest<Workspace>("POST", "users/workspaces", { name, icon: "pi pi-box", layout }).then((res) => {
    expect(res.status, "create workspace").to.be.oneOf([200, 201]);
    return res.body;
  });
}

/**
 * Deletes a workspace and its layout (BFF workspaces.js:158-170, layouts.js:181-189). Helpers that
 * save a layout already waited for the debounced write (waitForLayoutPersisted). Never throws:
 * yields an error message, or null on success.
 */
export function deleteWorkspace(id: string): Cypress.Chainable<string | null> {
  return findAccessToken().then((token) => {
    if (!token) return cy.wrap<string | null>("not logged in (log out after cleanup)", { log: false });
    const headers = { Authorization: `Bearer ${token}` };
    return cy.wrap(true, { log: false }).then(() =>
      cy
        .request({ method: "DELETE", url: apiUrl(`users/workspaces/${id}`), headers, failOnStatusCode: false })
        .then((ws) =>
          cy
            .request({ method: "DELETE", url: apiUrl(`users/workspaces/${id}/layout`), headers, failOnStatusCode: false })
            .then((layout) => {
              const problems = [
                [200, 204].includes(ws.status) ? "" : `DELETE workspace -> ${ws.status}`,
                [200, 204].includes(layout.status) ? "" : `DELETE layout -> ${layout.status}`,
              ].filter(Boolean);
              return cy.wrap<string | null>(problems.length ? problems.join("; ") : null, { log: false });
            }),
        ),
    );
  });
}
