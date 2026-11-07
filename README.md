# cityshob-e2e

End-to-end tests for `cityshob.frontend.webclient` (Angular 18, PrimeNG 17, ArcGIS).
Stack: Cypress 16 (TypeScript) + Cucumber/Gherkin (`@badeball/cypress-cucumber-preprocessor`) + esbuild.

## Layout

```
config/<env>.json                         baseUrl, apiUrl, timeouts, flags per environment
cypress/e2e/features/<module>/*.feature   Gherkin features (one sanity feature per module today)
cypress/support/modules/<module>/         reusable test infrastructure (see "Modules")
cypress/support/step_definitions/<module>/*.steps.ts   generic reusable steps
cypress/fixtures/<module>/                test data per module
cypress/support/commands.ts               cy.login(role), cy.getByDataCy(id)
cypress/support/e2e.ts                    afterEach: cleanup of tracked test data
reports/                                  cucumber-report.json / .html (generated)
```

## Setup

```bash
npm ci
cp cypress.env.example.json cypress.env.json   # then fill in credentials
```

> **Running from a VS Code terminal?** VS Code sets `ELECTRON_RUN_AS_NODE=1`, which makes
> Cypress fail with `bad option: --smoke-test`. Unset it first:
> PowerShell `Remove-Item Env:ELECTRON_RUN_AS_NODE`, bash `unset ELECTRON_RUN_AS_NODE`.

## Credentials

Never commit credentials. They are read **only** from `cypress.env.json` (gitignored) or
`CYPRESS_*` environment variables, as flat keys per role:

| Key | Meaning |
|---|---|
| `<role>_email` | login user name |
| `<role>_password` | password |
| `<role>_org` | optional, organization name to pick for users with several organizations |
| `<env>_<role>_email` / `_password` / `_org` | same, for one environment only (e.g. `staging_admin_email`). Wins over the generic key |

Any role name works: add `staging_operator_email` / `staging_operator_password` and use
`Given I am logged in as "operator"`.

```bash
# bash
CYPRESS_admin_email=... CYPRESS_admin_password=... npm run e2e:smoke:project
```

```powershell
# PowerShell
$env:CYPRESS_admin_email='...'; $env:CYPRESS_admin_password='...'; npm run e2e:smoke:project
```

`cy.login(role)` logs in through the real login form once per role and environment, then caches
the session with `cy.session()`, re-validated with `HEAD {apiUrl}/auth/token/alive`. The BFF allows
one active session per user, so a login elsewhere invalidates the cache and Cypress logs in again.
Use a dedicated test user per role: a run kicks out anyone else signed in as that user.

## Running

### One click

- **VS Code:** `Ctrl+Shift+P` > **Tasks: Run Test Task** > `E2E: run all tests`, then pick the
  environment. Other tasks: `E2E: run smoke tests`, `E2E: open Cypress runner`,
  `E2E: open last HTML report` (`.vscode/tasks.json`). The **NPM Scripts** panel in the Explorer
  also has a play button next to every script.
- **Terminal:** `npm run e2e:all` (staging), `npm run e2e:all:local`, `npm run e2e:all:dev3`, or
  `node scripts/e2e.js [run|open] [env] [tags]`, e.g. `node scripts/e2e.js run staging @smoke`.

`scripts/e2e.js` removes `ELECTRON_RUN_AS_NODE` itself, so these work from a VS Code terminal
without the manual step below.

### Scripts

The environment is selected with `--env environment=<env>` (default `local`), which merges
`config/<env>.json` into the Cypress config.

| Script | What it does |
|---|---|
| `npm run cy:<env>` | all features, headless (same as `e2e:run:<env>`) |
| `npm run e2e:open:<env>` | interactive runner |
| `npm run e2e:run:<env>` | all features, headless |
| `npm run e2e:smoke:<env>` | only `@smoke` |

`<env>` is `local`, `project`, `dev3` or `staging`. To add one: add `config/<name>.json`, add
`<name>` to `ENVIRONMENTS` in `cypress.config.ts`, and add the scripts. `project` and `dev3` still
have `CHANGE-ME` URLs and stop with a clear error until they are set.

**Tags go through `--expose`, not `--env`** (Cypress 16 + preprocessor 28 read them from
`config.expose`):

```bash
npx cypress run --env environment=staging --expose "tags=@map and not @project-only"
```

Reports are written to `reports/`, screenshots of failures to `cypress/screenshots/`. Video is off.

## Tags

| Tag | Use |
|---|---|
| `@smoke` | fast critical-path checks, run on every change |
| `@regression` | full regression suite |
| `@common` `@map` `@video` `@events` | the module a feature exercises |
| `@local-only` | needs the local stack (for example, seeded data) |
| `@project-only` | needs the project/stage environment |

## Modules

Each module has the same shape and is imported by alias (`tsconfig.json` `paths`; esbuild reads
the same file):

```
cypress/support/modules/<module>/
  selectors.ts   every selector of the module (data-testid first; TODO(testid) marks CSS stand-ins)
  pages/         Page/Component Objects: locate and act, no hidden assertions
  actions.ts     business actions composed from pages, with the waits they need
  api.ts         cy.request helpers to the BFF + cy.intercept aliases
  types.ts       typed models
  index.ts       the public API: import only from here
```

```ts
import { login, openTempWorkspaceWith } from "@common";
import { waitForMapLoaded } from "@map";
```

Every helper returns a typed `Cypress.Chainable`. Action-only helpers yield `null` (`Done`).
There are no fixed waits: helpers wait on intercept aliases or on assertions.

### @common

| API | What it does |
|---|---|
| `login(role)`, `cy.login(role)` | UI login + `cy.session`, multi-org aware |
| `logout()` | runs cleanup first (the token is revoked on logout), sidebar logout, back on `/auth/login` |
| `getCredentials(role)`, `validateSession()` | credential lookup / token check |
| `waitForAppReady()`, `openDashboard()`, `openWorkspace(name)`, `openWorkspaceById(id)` | navigation |
| `createTempWorkspace(name?, layout?)` | `POST users/workspaces`, tracked for cleanup |
| `openTempWorkspaceWith(type)` | temp workspace that already holds a widget (no UI), opened |
| `createWidget(type, config, size?)` | add-widget UI: empty area button or layout context menu, wizard, save |
| `findWidget(type)`, `editWidget(type, config)`, `deleteWidget(type)` | widget by type |
| `WIDGETS`, `WidgetType` | registry: `browser`, `map`, `events_table`, `cameras` |
| `bffRequest(method, path, body?)` | authenticated BFF request (Bearer from the app's localStorage) |
| `cleanup.track(kind, id)` / `cleanup.register(kind, remover)` | test data removed in `afterEach`; every remover runs even if one fails |
| `toast`, `confirmDialog`, `spinners` | toastify toasts, global p-confirmDialog, spinners |
| `selectDropdownOption`, `getDialog`, `closeDialog`, `tableRows`, `tableShouldHaveRows` | PrimeNG |

Widgets are stored in the workspace layout; there is no widget API. The BFF writes PUT layout 3s late and then upserts, so `createWidget` / `editWidget` / `deleteWidget` wait until GET layout returns what they saved (`waitForLayoutPersisted`) before the step ends; otherwise deleting the workspace early would let the late write recreate an orphan layout. Saves the app makes on its own (for example the cameras widget storing its grid) are not awaited, so an orphan layout document can still be left in the database: the clean fix is on the BFF side (flush or drop the pending write in `deleteUserWorkspaceLayout`, `controllers/layouts.js:181-189`). Do not read intercept aliases in `afterEach` or add a second intercept on PUT layout: both break the cucumber preprocessor. Tests therefore run on a
throwaway `e2e-<timestamp>` workspace that cleanup deletes. Widget types are picked by their icon,
so tests work in any UI language (the staging test user runs in Hebrew).

### @map

| API | What it does |
|---|---|
| `waitForMapLoaded(id = "global")` | loading overlay gone, basemap enabled, layers panel loaded |
| `toggleLayer(name, on)`, `layerShouldBe(name, on)` | layers panel (`aria-checked`) |
| `searchLocation(text)` | types into the map search widget |
| `centerAt(point, zoom?)`, `clickAt(point)` | **need the e2e hook**, see below |
| `readPopup()` | feature popup title and text |
| `MAP_LAYERS` | layer ids: cameras `4`, TLS `5`, events-critical/high/medium-low |

**e2e hook (not in the webclient yet).** ArcGIS draws on a canvas and the MapView is not reachable
from a test. The proposed change is in `arcgis-map.component.ts:2644-2646`: after `mapReady`, set
`window.__e2e.mapViews[uniqid] = view`, clear it in `ngOnDestroy`, and gate it behind a new
`"e2eHooks": true` flag in `assets/config/<env>.json` (default `false`). Until then `centerAt` and
`clickAt` fail with "needs the webclient e2e hook", and `waitForMapLoaded` checks DOM signals only.

### @video

| API | What it does |
|---|---|
| `openCameras(workspaceName?)` | opens a cameras workspace with the saved grid cleared |
| `cameraTreeShouldBeLoaded()`, `searchCamera(text)`, `listCameras()`, `pickAvailableCamera(allowUnhealthy?)` | tree + `GET prepare-vms`; picks a WorkingProperly camera |
| `addCameraToGrid(ref)` | double-click in the tree, yields the cell index |
| `streamShouldPlay(cell)` | SDK `<video>`: `readyState >= 2`, not paused, `currentTime` advancing; fails with the player's own error |
| `streamShouldFail(cell)` | yields `no-access`, `camera-in-use`, `unavailable` or `sdk-error` |
| `fullscreen`, `removeFromGrid`, `setGridLayout`, `setPlaybackMode(cell, live/fast/custom)` | player controls |
| `ptzZoom`, `ptzGotoPreset` | app PTZ controls; not shown for VXG cameras (their SDK draws its own) |

### @events

| API | What it does |
|---|---|
| `openEventsTable(workspaceName?)`, `eventsTableShouldBeLoaded()` | events table widget |
| `search(text)`, `filterBy(field, value)`, `sortBy(column, dir)` | wait on `POST events/by-filters` |
| `rowShouldExist(id)`, `openDetails(id)` | row `event-row-<Id>`, details sidebar |
| `handle()`, `unhandle()` | the actions present in the details footer |
| `seedEvent(data)` | `POST events` (multipart), tracked; cleanup closes it (no DELETE exists) |
| `getEvent(id)`, `getClosingReasons()`, `closeEvent(id, reasonId?)` | API helpers; close checks the body for `{error}` (the BFF answers 200 on upstream failure) |
| `waitForRealtimeEvent(id)` | the row appears without reload (WS `refreshEventTable`; needs `useEventsWS` on) |

`seedEvent` needs valid reference-data ids (`EventType`, `EventSubType`, `Severity`, `Priority`) and
an `address` (the BFF parses `StreetAddressObj` unconditionally) per environment in `cypress/fixtures/events/seed.json`. They are not filled in yet. Closing and
assigning an event are not reachable from the UI today (the buttons are commented out), so only
the API offers them.

## Generic steps

| Step | Module |
|---|---|
| `Given I am logged in as {string}` | common |
| `Given I am on a temporary workspace` | common |
| `Given I am on a temporary workspace with a {string} widget` | common |
| `When I create a {string} widget` (config from `fixtures/common/widgets.json`) | common |
| `Then the {string} widget is shown` / `When I delete the {string} widget` | common |
| `When I log out` / `Then I see the login page` | common |
| `When I open the main page` / `Then I see the webclient main page` | common |
| `Then the map is loaded` | map |
| `Then the camera tree is loaded` / `When I add an available camera to the grid` / `Then the stream is playing` | video |
| `Then the events table is shown` | events |

## Adding a feature

1. Add `cypress/e2e/features/<module>/<name>.feature` with the module tag (`@map`, ...).
2. Reuse the generic steps; add new ones in `step_definitions/<module>/`. Steps call module
   actions and never hold raw selectors.
3. Create test data through `api.ts` helpers that call `cleanup.track(...)`, so `afterEach`
   removes it even when the test fails.

## Adding a module

1. Create `cypress/support/modules/<name>/` with `selectors.ts`, `pages/`, `actions.ts`, `api.ts`,
   `types.ts`, `index.ts`.
2. Add the alias to `tsconfig.json` `compilerOptions.paths` (`"@<name>": [".../index.ts"]`).
3. If it creates data, `cleanup.register("<kind>", remover)` in its `api.ts` and import the module
   in `cypress/support/e2e.ts` so the remover is registered before `afterEach` runs.
4. Add `step_definitions/<name>/`, `fixtures/<name>/`, a `@<name>` tag and one sanity feature.

## Selectors the webclient still needs

The app uses `data-testid` (no `data-cy` anywhere); `cy.getByDataCy` matches both. Every CSS
stand-in is marked `TODO(testid)` in the module's `selectors.ts`. Main gaps, proposed as `data-testid`:

| Webclient file | Element | Proposed |
|---|---|---|
| auth-login.component.html | user name / password / submit | `login-email` / `login-password` / `login-submit` |
| auth-organizations.component.html | org dropdown / submit | `org-select` / `org-submit` |
| sidebar.component.html:7 | sidebar root | `app-sidebar` |
| layout-container.component.html:19 / :63 / :68 | edit switch / context target / area | `layout-edit-toggle` / `layout-context-target` / `layout-area` (+`data-area-id`) |
| layout-container.component.ts:390-405 | context menu items | `layout-ctx-add-widget` (MenuItem `id`) |
| widget-wizard.component.html:1 / :61 / :70 | wizard / cancel / submit | `widget-wizard` / `widget-wizard-cancel` / `widget-wizard-submit` |
| widget-picker.component.html:1 | type dropdown (+ options) | `widget-type-dropdown`, `widget-type-<id>` |
| area-widget-menu.component.html:2, .ts:43-76 | menu button / items | `widget-menu-btn`, `widget-menu-edit` / `-delete` / `-delete-area` |
| area.component.html:5 | widget title | `widget-title` |
| system-core-footer.component.html:4 | p-confirmDialog | `confirm-dialog` |
| global-toast.service.ts:49 | toast | class `toast-<severity>` |
| arcgis-map.component.html:1 / :7 / :114 | map root / loading / view | `map-root` / `map-loading` / `map-view` |
| map-layers-panel.component.html:45 / :14 | layers toggle / row | `map-layers-toggle` / `map-layer-row` (+`data-layer-id`) |
| map-context-menu.component.html:21 | feature popup | `map-popup` |
| player.component.html:3 / :53 / :75 / :113 | player / live indicator / stage / fullscreen | `video-player-<i>` / `video-player-live-indicator` / `video-player-stage-<i>` / `btn-video-fullscreen` |
| player.component.html:149 / :171 / :192 | PTZ zoom out / in / presets | `btn-ptz-zoom-out` / `btn-ptz-zoom-in` / `btn-ptz-presets` |
| cameras-search-picker.component.html:16 | camera search | `camera-tree-search` |
| player-context-menu.component.ts:88-117 | live / fast / custom playback | `ctx-live` / `ctx-fast-playback` / `ctx-custom-playback` |
| events-table.component.html:3 / :70 / :149 | table / search / column header | `events-table` / `events-search-input` / `events-col-header-<key>` |
| event-details.component.html:1 / :60 | details panel / event id | `event-details-panel` / `event-details-id` |

The webclient also crashes on a workspace area without a widget (`layout-container.component.ts:370`
reads `area.widget.id`); the framework avoids creating such areas.
