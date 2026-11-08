/// <reference types="cypress" />
import { LoginPage } from "./pages/LoginPage";
import { Navigation } from "./pages/Navigation";
import { WidgetWizard } from "./pages/WidgetWizard";
import { WidgetArea, emptyAreaSelector, widgetAreaSelector } from "./pages/WidgetArea";
import { confirmDialog } from "./pages/Ui";
<<<<<<< Updated upstream
import { aliases, createWorkspace, deleteWorkspace, interceptCommon, apiUrl, getAccessToken, waitForLayoutPersisted } from "./api";
=======
import * as selectors from "./selectors";
import {
  APP_STORAGE_KEY,
  AUTH_SESSION_KEY,
  aliases,
  createWorkspace,
  deleteWorkspace,
  interceptCommon,
  listWorkspaces,
  findAccessToken,
  getAccessToken,
  getAuthTokens,
  readAppState,
  tokenAliveStatus,
  waitForLayoutPersisted,
} from "./api";
import type { AuthTokens } from "./api";
>>>>>>> Stashed changes
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


/** Session is valid while the BFF still accepts the stored token (one session per user). */
export function validateSession(): Done {
  return getAccessToken()
    .then((token) =>
      cy
        .request({ method: "HEAD", url: apiUrl("auth/token/alive"), headers: { Authorization: `Bearer ${token}` }, log: false })
        .its("status")
        .should("eq", 200),
    )
    .then(() => cy.wrap(null, { log: false }));
}

/**
 * Logs out via the sidebar (auth.service.ts:425-538). Tracked test data is removed first, because
 * the BFF revokes the token on logout and API cleanup would no longer be possible. Only the current
 * session is cleared; cached sessions of other roles stay.
 */
export function logout(): Done {
  cleanup.runAll();
  interceptCommon();
  Navigation.clickLogout();
  cy.wait(`@${aliases.logout}`);
  cy.location("pathname").should("eq", "/auth/login");
  return cy.then(() => Cypress.session.clearCurrentSessionData()).then(() => cy.wrap(null, { log: false }));
}

/** Everything login.feature does, as one step: log in as `role`, open the main page, app ready. */
export function loginAndOpenMainPage(role: string): Done {
  login(role);
  openDashboard();
  return waitForAppReady();
}

/**
 * Everything logout.feature checks, as one step: logout lands on the login page, the token used
 * before logout is revoked, no auth token is left in the browser, browser Back and a protected page
 * opened directly both end on the login page. logout() runs the tracked cleanup first.
 */
export function logoutAndVerifySessionClosed(): Done {
  rememberAuthTokens();
  logout();
  expectLoginPage();
  expectTokenRejected();
  expectNoAuthDataInBrowser();
  goBack();
  expectLoginPage();
  openProtectedPage("/dashboard");
  expectLoginPage();
  return done();
}

// ---------------------------------------------------------------- navigation

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

/** Temp workspace names: `e2e-<epoch ms>` or `e2e-<word>-<epoch ms>` (e.g. e2e-events-...). */
const TEMP_WORKSPACE_NAME = /^e2e-(?:[a-z]+-)?(\d{13})$/;
/** Older than any single test: a younger one may belong to a run still in progress. */
const STALE_TEMP_WORKSPACE_MS = 10 * 60 * 1000;

/**
 * Deletes temp workspaces left by earlier runs that failed before their cleanup could run (e.g. the
 * session was revoked mid-test, so the API delete had no token). Only names made by
 * createTempWorkspace() and older than STALE_TEMP_WORKSPACE_MS are touched. Never fails the test.
 */
export function sweepStaleTempWorkspaces(): Done {
  listWorkspaces().then((workspaces) => {
    const now = Date.now();
    workspaces
      .filter((ws) => {
        const created = Number(TEMP_WORKSPACE_NAME.exec(ws.name)?.[1]);
        return created > 0 && now - created > STALE_TEMP_WORKSPACE_MS;
      })
      .forEach((ws) => {
        cy.log(`sweep stale temp workspace ${ws.name}`);
        deleteWorkspace(ws.id).then((problem) => {
          if (problem) cy.log(`sweep ${ws.name}: ${problem}`);
        });
      });
  });
  return done();
}

/**
 * Creates a throwaway workspace via the BFF and tracks it for cleanup. Does not open it. Leftovers
 * of earlier failed runs are swept first.
 */
export function createTempWorkspace(name = `e2e-${Date.now()}`, layout: Layout = EMPTY_LAYOUT): Cypress.Chainable<Workspace> {
  sweepStaleTempWorkspaces();
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
