import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import {
  eventsTableShouldBeLoaded,
  createEventWorkspace,
  openEventWorkspace,
  backToDashboard,
  openCreateEvent,
  chooseFirstEventType,
  chooseFirstPriority,
  chooseFirstSeverity,
  chooseFirstTraffic,
  chooseFirstStatus,
  chooseFirstDirection,
  chooseFirstRegion,
  setEventLocation,
  saveEvent,
  createdEventShouldBeInTable,
} from "@events";

Then("the events table is shown", () => {
  eventsTableShouldBeLoaded();
});

/** Temporary workspace with an Events table widget added through the UI (removed by cleanup). */
Given("I create an event workspace", () => {
  createEventWorkspace();
});

When("I open the event workspace", () => {
  openEventWorkspace();
});

When("I go back to the dashboard", () => {
  backToDashboard();
});

When("I start creating a manual event", () => {
  openCreateEvent();
});

When("I choose the first event type", () => {
  chooseFirstEventType();
});

When("I choose the first event priority", () => {
  chooseFirstPriority();
});

When("I choose the first event severity", () => {
  chooseFirstSeverity();
});

/** Required only where the trafficField flag is on (it is on staging). */
When("I choose the first traffic disruption level", () => {
  chooseFirstTraffic();
});

/** The next three are required only where their feature flags are on (they are on staging). */
When("I choose the first event status", () => {
  chooseFirstStatus();
});

When("I choose the first up-down road direction", () => {
  chooseFirstDirection();
});

When("I choose the first region", () => {
  chooseFirstRegion();
});

When("I set the event location to latitude {float} and longitude {float}", (lat: number, lng: number) => {
  setEventLocation(lat, lng);
});

When("I save the event", () => {
  saveEvent();
});

Then("the created event is shown in the events table", () => {
  createdEventShouldBeInTable();
});
