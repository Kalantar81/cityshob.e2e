import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { addCameraToGrid, cameraTreeShouldBeLoaded, pickAvailableCamera, searchCamera, streamShouldPlay } from "@video";

Then("the camera tree is loaded", () => {
  cameraTreeShouldBeLoaded();
});

When("I add an available camera to the grid", () => {
  pickAvailableCamera().then((cam) => {
    searchCamera(cam.Name);
    addCameraToGrid({ unitId: cam.UnitId }).as("videoCell");
  });
});

Then("the stream is playing", () => {
  cy.get<number>("@videoCell").then((cell) => streamShouldPlay(cell));
});
