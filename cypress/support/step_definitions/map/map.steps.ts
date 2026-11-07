import { Then } from "@badeball/cypress-cucumber-preprocessor";
import { waitForMapLoaded } from "@map";

Then("the map is loaded", () => {
  waitForMapLoaded();
});
