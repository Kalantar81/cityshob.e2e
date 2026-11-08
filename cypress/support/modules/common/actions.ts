/// <reference types="cypress" />
import { LoginPage } from "./pages/LoginPage";
import { Navigation } from "./pages/Navigation";
import { WidgetWizard } from "./pages/WidgetWizard";
import { WidgetArea, emptyAreaSelector, widgetAreaSelector } from "./pages/WidgetArea";
import { confirmDialog } from "./pages/Ui";
import * as selectors from "./selectors";
import {
  APP_STORAGE_KEY,
  AUTH_SESSION_KEY,
  aliases,
  createWorkspace,
  deleteWorkspace,
  interceptCommon,
  findAccessToken,
  getAccessToken,
  getAuthTokens,
  readAppState,
  tokenAliveStatus,
  waitForLayoutPersisted,
} from "./api";
import type { AuthTokens } from "./api";
import { cleanup } from "./cleanup";
import { WIDGETS } from "./types";
import type { Credentials, Done, Layout, WidgetConfig, WidgetHandle, WidgetSize, WidgetType, Workspace } from "./types";

const done = (): Done => cy.wrap(null, { log: false });
const environment = (): string => Cypress.expose("environment") as string;

cleanup.register("workspace", deleteWorkspace);

// ---------------------------------------------------------------- auth

/**
 * Reads credentials for `role` in the current environment.
 * Keys: <env>_<role>_email|password|org first, then <role>_email|password|org.
 */
export function getCredentials(role: string): Cypress.Chainable<Credentials> {
  const env_ = environment();
  const fields = ["email", "password", "org"] as const;
  const keys = fields.map((f) => `${role}_${f}`);
  const envKeys = fields.map((f) => `${env_}_${role}_${f}`);

  return cy.env<Record<string, string | undefined>>([...envKeys, ...keys], { log: false }).then((env) => {
    const pick = (i: number): string | undefined => env[envKeys[i]] || env[keys[i]] || undefined;
    const email = pick(0);
    const password = pick(1);
    if (!email || !password) {
      throw new Error(
        `No credentials for role "${role}" in "${env_}". Set ${envKeys[0]} / ${envKeys[1]} ` +
          `(or ${keys[0]} / ${keys[1]}) in cypress.env.json or as CYPRESS_* env vars ` +
          `(see cypress.env.example.json).`,
      );
    }
    const creds: Credentials = { email, password, org: pick(2) };
    return creds;
  });
}

/** Logs in through the real form once per role+environment and caches it with cy.session(). */
export function login(role: string): Done {
  return getCredentials(role).then(({ email, password, org }) => {
    cy.session(
      ["login", role, Cypress.expose("environment")],
      () => {
        interceptCommon();
        LoginPage.visit();
        LoginPage.submit(email, password);
        // Assert status only: the body carries tokens, keep it out of the log.
        cy.wait(`@${aliases.login}`, { log: false }).then(({ response }) => {
          expect(response?.statusCode, "POST auth/token status").to.eq(200);
        });
        if (org) {
          cy.location("pathname").should("eq", "/auth/organizations");
          LoginPage.chooseOrganization(org);
        } else {
          // Every user passes /auth/organizations; single-org users are signed in automatically.
          cy.location("pathname").should((path) => {
            expect(path, `left /auth (stuck on the organization picker? set ${environment()}_${role}_org)`).not.to.match(
              /^\/auth/,
            );
          });
        }
        Navigation.shouldBeReady();
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          validateSession();
        },
      },
    );
    return done();
  });
}


/**
 * Session is valid while the BFF still accepts the stored token (one session per user). A logout
 * revokes every token of the user, so a cached session restored after it fails here and cy.session
 * runs the login again. Fails fast (no retry on the status) so that recreation is not delayed.
 */
export function validateSession(): Done {
  return getAccessToken()
    .then((token) => tokenAliveStatus(token))
    .then((status) => {
      expect(status, "HEAD auth/token/alive status of the cached session").to.eq(200);
      return cy.wrap(null, { log: false });
    });
}

/**
 * Logs out via the sidebar (WC auth.service.ts:425-538) and waits for the BFF to confirm it (204,
 * bff users.js:190-204; the webclient swallows a failed logout call). Tracked test data is removed
 * first, because the BFF revokes the token on logout and API cleanup would no longer be possible.
 * Browser state is left as the app leaves it, so logout tests check the app and not Cypress; the
 * next test starts clean (test isolation) and validateSession() re-creates the revoked cached session.
 */
export function logout(): Done {
  cleanup.runAll();
  interceptCommon();
  Navigation.clickLogout();
  // Assert status only: the request carries the Bearer token, keep it out of the log.
  cy.wait(`@${aliases.logout}`, { log: false }).then(({ response }) => {
    expect(response?.statusCode, "POST users/logout status").to.eq(204);
  });
  cy.location("pathname").should("eq", "/auth/login");
  return done();
}

/**
 * Logged in = the app shell is rendered (not on /auth, navbar avatar present) and the stored access
 * token is still accepted by the BFF. Never fails: yields false when any part is missing.
 */
export function isLoggedIn(): Cypress.Chainable<boolean> {
  return cy.document({ log: false }).then((doc) => {
    const onAuthPage = doc.location.pathname.startsWith("/auth");
    const shellShown = doc.querySelector(selectors.nav.avatar) !== null;
    if (onAuthPage || !shellShown) return cy.wrap(false, { log: false });
    return findAccessToken().then((token) =>
      token ? tokenAliveStatus(token).then((status) => status === 200) : cy.wrap(false, { log: false }),
    );
  });
}

/** Alias recording whether the last ensureLoggedIn() had to log in. */
const LOGIN_PERFORMED = "loginPerformed";

/** Logs in as `role` and opens the main page only when not logged in already; otherwise does nothing. */
export function ensureLoggedIn(role: string): Done {
  isLoggedIn().then((loggedIn) => {
    if (loggedIn) {
      cy.log("already logged in: skipping login");
    } else {
      cy.log(`not logged in: logging in as ${role}`);
      login(role);
      openDashboard();
    }
    cy.wrap(!loggedIn, { log: false }).as(LOGIN_PERFORMED, { type: "static" });
  });
  return done();
}

/** The last ensureLoggedIn() found a live session and did not log in again. */
export function expectNoNewLogin(): Done {
  cy.get<boolean>(`@${LOGIN_PERFORMED}`, { log: false }).then((performed) => {
    expect(performed, "ensureLoggedIn() logged in again").to.eq(false);
  });
  return done();
}

/** Tokens remembered by rememberAuthTokens() (alias, log off: they are credentials). */
const REMEMBERED_TOKENS = "rememberedAuthTokens";

/**
 * Remembers the current session's access + refresh token for checks after logout. The access token
 * must be live now, so a later 401 can only come from the logout.
 */
export function rememberAuthTokens(): Done {
  getAuthTokens().then((tokens) => {
    tokenAliveStatus(tokens.access_token).then((status) => {
      expect(status, "HEAD auth/token/alive status before logout").to.eq(200);
    });
    cy.wrap(tokens, { log: false }).as(REMEMBERED_TOKENS, { type: "static" });
  });
  return done();
}

function rememberedTokens(): Cypress.Chainable<AuthTokens> {
  return cy.get<AuthTokens>(`@${REMEMBERED_TOKENS}`, { log: false });
}

/** Login page shown and the authenticated shell is not (guard IsAuthenticatedGuard, private-zone.guard.ts:14-16). */
export function expectLoginPage(): Done {
  cy.location("pathname").should("eq", "/auth/login");
  cy.get(selectors.login.email).should("be.visible");
  cy.get(selectors.nav.sidebar).should("not.exist");
  cy.get(selectors.nav.avatar).should("not.exist");
  return done();
}

/** The access token remembered before logout is no longer accepted by the BFF (revoked: 401). */
export function expectTokenRejected(): Done {
  rememberedTokens()
    .then(({ access_token }) => tokenAliveStatus(access_token))
    .then((status) => {
      expect(status, "HEAD auth/token/alive status of the token used before logout").to.eq(401);
    });
  return done();
}

/**
 * No session token is left in the browser: the app's AUTH_TOKEN entry is gone (WC auth.service.ts:688-690)
 * and neither remembered token appears in any localStorage, sessionStorage or cookie value.
 * The app keeps the city_shob key itself and its non-auth entries, which is not checked here.
 */
export function expectNoAuthDataInBrowser(): Done {
  rememberedTokens().then((tokens) => {
    readAppState().then((state) => {
      // Boolean only: on failure the state object (with tokens) must not reach the log.
      const present = Object.prototype.hasOwnProperty.call(state ?? {}, AUTH_SESSION_KEY);
      expect(present, `${AUTH_SESSION_KEY} in localStorage "${APP_STORAGE_KEY}"`).to.eq(false);
    });
    const where: string[] = [];
    const decode = (text: string): string => {
      try {
        return decodeURIComponent(text);
      } catch {
        return text; // a stray "%" is not URI-encoded data
      }
    };
    const scan = (store: string, entries: Record<string, unknown>): void => {
      Object.entries(entries).forEach(([key, value]) => {
        const raw = typeof value === "string" ? value : JSON.stringify(value);
        const texts = [raw, decode(raw)];
        (Object.keys(tokens) as Array<keyof AuthTokens>).forEach((name) => {
          if (texts.some((t) => t.includes(tokens[name]))) where.push(`${name} in ${store} "${key}"`);
        });
      });
    };
    cy.getAllLocalStorage({ log: false }).then((all) => Object.values(all).forEach((e) => scan("localStorage", e)));
    cy.getAllSessionStorage({ log: false }).then((all) => Object.values(all).forEach((e) => scan("sessionStorage", e)));
    cy.getAllCookies({ log: false }).then((cookies) => cookies.forEach((c) => scan("cookie", { [c.name]: c.value })));
    // Only locations are reported, never the token values.
    cy.then(() => expect(where, "auth tokens left in the browser").to.be.empty);
  });
  return done();
}

// ---------------------------------------------------------------- navigation

/** Opens `path` by URL without waiting for the app shell (it may redirect, e.g. to the login page). */
export function openProtectedPage(path: string): Done {
  cy.visit(path);
  return done();
}

/**
 * Browser Back. Records where the history step lands (popstate) and fails unless it left /auth, so
 * a following login-page check proves a redirect away from that page and not a no-op Back.
 */
export function goBack(): Done {
  const landed: string[] = [];
  cy.window({ log: false }).then((win) => {
    win.addEventListener("popstate", () => landed.push(win.location.pathname), { once: true });
  });
  cy.go("back");
  cy.then(() => {
    expect(landed, "popstate fired on Back").to.have.length(1);
    expect(landed[0], "Back left the /auth pages").not.to.match(/^\/auth/);
  });
  return done();
}

export function waitForAppReady(): Done {
  return Navigation.shouldBeReady().then(() => cy.wrap(null, { log: false }));
}

export function openDashboard(): Done {
  cy.visit("/dashboard");
  return waitForAppReady();
}

/** Opens a workspace from the sidebar by name (data-testid sidebar-workspace-<name>). */
export function openWorkspace(name: string): Done {
  cy.visit("/");
  waitForAppReady();
  interceptCommon();
  Navigation.clickWorkspace(name);
  cy.wait(`@${aliases.workspaceLayout}`);
  return waitForAppReady();
}

export function openWorkspaceById(id: string): Done {
  interceptCommon();
  cy.visit(`/workspaces/${id}`);
  cy.wait(`@${aliases.workspaceLayout}`);
  return waitForAppReady();
}

// ---------------------------------------------------------------- workspaces & widgets

/**
 * Layout without areas (the app's own DEFAULT_LAYOUT, app_config.ts:490-496). Do not seed empty
 * areas: the workspace document's areas are read as area.widget.id (layout-container.component.ts:370),
 * and an area without a widget crashes the page.
 */
export const EMPTY_LAYOUT: Layout = { gridStackOptions: { margin: 5 }, areas: [] };

/**
 * Layout with one large area holding a widget of `type`, in the shape the UI itself saves
 * (captured from PUT users/workspaces/:id/layout).
 */
export function widgetLayout(type: WidgetType): Layout {
  const areaId = `e2e${Date.now().toString(36)}`;
  const { name, icon } = WIDGETS[type];
  return {
    gridStackOptions: { margin: 5 },
    areas: [
      {
        id: areaId,
        gridStackWidget: { x: 0, y: 0, w: 12, h: 5 },
        widget: { id: type, name, icon, settings: {}, fields: [], areaId, preferredSize: "lg" },
      },
    ],
  };
}

/**
 * Throwaway workspace that already holds a widget, opened and ready. POST users/workspaces stores
 * the layout immediately, unlike PUT layout which the BFF debounces by 3s (layouts.js:33-46); use
 * this for module tests that need a widget but do not test widget creation itself.
 */
export function openTempWorkspaceWith(type: WidgetType): Cypress.Chainable<Workspace> {
  return createTempWorkspace(undefined, widgetLayout(type)).then((ws) => {
    openWorkspaceById(ws.id);
    findWidget(type).should("be.visible");
    return cy.wrap(ws, { log: false });
  });
}

/** Creates a throwaway workspace via the BFF and tracks it for cleanup. Does not open it. */
export function createTempWorkspace(name = `e2e-${Date.now()}`, layout: Layout = EMPTY_LAYOUT): Cypress.Chainable<Workspace> {
  return createWorkspace(name, layout).then((ws) => {
    cleanup.track("workspace", ws.id);
    return ws;
  });
}

/**
 * Adds a widget through the UI and waits for the layout save (PUT users/workspaces/:id/layout).
 * Uses an empty area's own button when one exists, otherwise the layout context menu, where the
 * wizard also asks for the area size.
 */
export function createWidget<T extends WidgetType>(type: T, config: WidgetConfig[T], size: WidgetSize = "lg"): Cypress.Chainable<WidgetHandle> {
  interceptCommon();
  // The workspace is rendered (waitForAppReady), so the empty-area check is stable here. The size
  // radio exists only on the context-menu path (no target area, widget-wizard.component.html:24-49).
  cy.get("body").then(($body) => {
    const viaEmptyArea = $body.find(emptyAreaSelector).length > 0;
    if (viaEmptyArea) WidgetArea.clickAddWidget(emptyAreaSelector);
    else WidgetArea.addWidgetFromContextMenu();
    WidgetWizard.root().should("be.visible");
    WidgetWizard.chooseType(type);
    cy.get(".p-dropdown-panel").should("not.exist");
    WidgetWizard.selectedType(type).should("exist");
    if (!viaEmptyArea) WidgetWizard.chooseSize(size);
  });
  Object.entries(config).forEach(([field, value]) => {
    WidgetWizard.fill(field, String(value));
  });
  WidgetWizard.submit();
  cy.wait(`@${aliases.saveLayout}`, { timeout: 20000 }).then((saved) => waitForLayoutPersisted(saved));
  const area = widgetAreaSelector(type);
  cy.get(area).should("be.visible");
  return cy.wrap<WidgetHandle>({ type, area }, { log: false });
}

export function findWidget(type: WidgetType): Cypress.Chainable<JQuery<HTMLElement>> {
  return WidgetArea.get(widgetAreaSelector(type));
}

/** Edit is only offered in edit mode (menu item class only-edit-mode). */
export function editWidget<T extends WidgetType>(type: T, config: Partial<WidgetConfig[T]>): Done {
  interceptCommon();
  WidgetArea.toggleEditMode();
  WidgetArea.openMenu(widgetAreaSelector(type));
  WidgetArea.clickMenuItem("edit");
  WidgetWizard.root().should("be.visible");
  Object.entries(config).forEach(([field, value]) => {
    WidgetWizard.fill(field, String(value));
  });
  WidgetWizard.submit();
  cy.wait(`@${aliases.saveLayout}`, { timeout: 20000 }).then((saved) => waitForLayoutPersisted(saved));
  WidgetArea.toggleEditMode();
  return done();
}

export function deleteWidget(type: WidgetType): Done {
  interceptCommon();
  WidgetArea.openMenu(widgetAreaSelector(type));
  WidgetArea.clickMenuItem("deleteWidget");
  confirmDialog.accept();
  confirmDialog.shouldBeClosed();
  cy.wait(`@${aliases.saveLayout}`, { timeout: 20000 }).then((saved) => waitForLayoutPersisted(saved));
  cy.get(widgetAreaSelector(type)).should("not.exist");
  return done();
}
