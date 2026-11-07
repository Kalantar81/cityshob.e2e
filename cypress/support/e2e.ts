// Loaded before every spec.
import "./commands";
import { cleanup } from "@common";
// Modules register their cleanup removers on import (common: workspace, events: event).
import "@events";

afterEach(() => {
  cleanup.runAll();
});
