# K1 progress - cityshob.e2e modular infrastructure (common/map/video/events)
K1-Run-Id: 0a5d565c
K1-Model: claude-opus-5-5
K1-Flow: feature
K1-Branch: n/a (not a git repo; human said no git init)
K1-Baseline: n/a
K1-Pipeline: intake,refiner,planner,estimator,test-planner,architecture-simplifier,test-author,implementer,code-simplifier,gap-analyzer,code-reviewer,shipper
K1-DB-Change: no
K1-UI-Change: no
K1-Gate1: approved
K1-Build: npx tsc --noEmit exit 0; staging @smoke 4/5 (login, common, events, map pass; video: VXG SDK "Network error", same in Chrome); local @smoke 5/5 fail: no local creds + BFF :3000 down
K1-Loop-Backs: 6
K1-Judge: skipped
K1-Gate2: pending

## K1-Checkpoint
- prior run ef820f08 (base framework): done; live smoke PASSED on staging (user Anat). Envs local/project/dev3(URL TBD)/staging. ELECTRON_RUN_AS_NODE must be unset in VS Code terminals. Cypress16: tags via --expose, secrets via cy.env.
- intake: task given inline (no Jira). Discovery dispatched to 4 read-only analyze workers (common/widgets, map, video, events).
- discovery done -> .k1/discovery-0a5d565c.md (file:line map for all 4 modules). Key: app uses data-testid; widgets live in workspace layout (no widget API, 3s debounce) -> isolate via temp workspace POST users/workspaces + DELETE layout+workspace cleanup; map has no MapView hook (DOM-only ready signal, hook proposed, needs approval); video = vendor SDK <video> in .camera-{i}; events seed POST events multipart, no delete -> close; WS refreshEventTable gated by useEventsWS.
- Gate1 rendered; open Qs: map hook, event seed payload, local run target, temp workspace on staging user.
- Gate1 approved ('approve', Qs unanswered) -> defaults: no map hook (hook-gated fns fail clearly), seedEvent unverified, run smoke local then staging fallback, temp e2e- workspaces OK.
- implement: 4 modules + steps + sanity features + README. Loop-backs found live: (1) cleanup state split across support/spec bundles -> globalThis store (9 leaked e2e workspaces purged); (2) empty layout areas crash WC (layout-container.ts:370 area.widget.id) -> temp ws with areas:[] + layout context menu (.context-menu-fix) for UI add, POST-seeded widget layout for module tests; (3) UI in Hebrew -> widget type/menu by icon; (4) spinner check absent-element in Chrome. Video SDK shows "Network error" on staging from this PC (camera Hikvision PTZ 81) -> unverified, not a framework bug.
- review: 0 blocker / 6 major / 8 minor. Fixed: orphan-layout race (in-step waitForLayoutPersisted, time-bounded poll 15s), cleanup runs all removers + aggregates, closeEvent uses closing reason {Id} + checks {error} body, seedEvent address required, toggleLayer no double toggle, page-object assertions moved to actions; minors 1-4,6-8. Not fixed: realtime WS-proof (documented). Learned: support-level intercept / alias read in afterEach breaks cucumber pp 28 ("Included pickle stack is unsynchronized"). Gate2 pending (no git/MR).
- video diag: VXG token api=web.gk-office.sym.cloud-vms.com (resolves 192.168.35.182, reachable), cam=cam.gk-office.sym.cloud-vms.com:80/443 -> NO DNS on this PC => 'Network error'. Env/DNS issue, not framework.
