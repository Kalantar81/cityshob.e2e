/// <reference types="cypress" />
/**
 * Tracks resources created during a test and removes them in afterEach (see support/e2e.ts).
 * Each module registers a remover for its kind, so common does not depend on other modules.
 *
 * State lives on globalThis: Cypress bundles the support file and each spec separately, so a
 * module-level variable would exist twice and afterEach would never see what a step tracked.
 */

/** Removes one resource. Must not throw: yields an error message, or null on success. */
export type Remover = (id: string) => Cypress.Chainable<string | null>;

interface CleanupStore {
  removers: Map<string, Remover>;
  tracked: Array<{ kind: string; id: string }>;
}

const holder = globalThis as typeof globalThis & { __e2eCleanup?: CleanupStore };
const store: CleanupStore = (holder.__e2eCleanup ??= { removers: new Map(), tracked: [] });

export const cleanup = {
  register(kind: string, remover: Remover): void {
    store.removers.set(kind, remover);
  },

  track(kind: string, id: string): void {
    if (!store.removers.has(kind)) {
      throw new Error(`cleanup: no remover registered for "${kind}"`);
    }
    store.tracked.push({ kind, id });
  },

  /**
   * Runs every remover newest first, even when one fails, then fails once with all problems,
   * so a leak is reported but never stops the remaining removals.
   */
  runAll(): Cypress.Chainable<null> {
    const items = store.tracked.splice(0).reverse();
    const failures: string[] = [];
    items.forEach(({ kind, id }) => {
      cy.log(`cleanup ${kind} ${id}`);
      const remover = store.removers.get(kind);
      if (!remover) {
        failures.push(`${kind} ${id}: no remover`);
        return;
      }
      remover(id).then((problem) => {
        if (problem) failures.push(`${kind} ${id}: ${problem}`);
      });
    });
    return cy.then(() => {
      // The list goes into the message: chai prints a long array as "[ Array(n) ]".
      expect(failures, `cleanup failures: ${failures.join(" | ")}`).to.be.empty;
      return cy.wrap(null, { log: false });
    });
  },
};
