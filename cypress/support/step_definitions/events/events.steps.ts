import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { eventsTableShouldBeLoaded } from "@events";

Then("the events table is shown", () => {
  eventsTableShouldBeLoaded();
});
