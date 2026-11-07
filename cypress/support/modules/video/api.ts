/// <reference types="cypress" />
import { bffRequest } from "@common";
import type { Camera, VmsEntry } from "./types";

export const videoAliases = {
  prepareVms: "prepareVms",
  streamToken: "vmsToken",
} as const;

/** GET prepare-vms builds the tree; POST vmss/token opens a stream (cameras.service.ts:1002, :1226). */
export function interceptVideo(): Cypress.Chainable<null> {
  cy.intercept("GET", "**/api/v1/prepare-vms*").as(videoAliases.prepareVms);
  cy.intercept("POST", "**/api/v1/vmss/token").as(videoAliases.streamToken);
  return cy.wrap(null, { log: false });
}

/** All cameras of all VMSs visible to the current user (BFF controllers/vms.js:92-102). */
export function listCameras(): Cypress.Chainable<Camera[]> {
  return bffRequest<VmsEntry[]>("GET", "prepare-vms").then((res) =>
    res.body.flatMap((vms) => vms.cameras.map((c): Camera => ({ ...c, VmsID: vms.vmsId }))),
  );
}
