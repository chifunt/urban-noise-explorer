import { loadData } from "./data.js";
import { renderDetail } from "./detail.js";
import { initMap, createMarkers, updateMapColors } from "./map.js";
import { renderRadial } from "./radial.js";
import { renderRidgeline } from "./ridgeline.js";
import { els, updateControlsUI } from "./ui.js";

const state = {
  map: null,
  sensors: [],
  details: [],
  detailsBySensor: new Map(),
  markersBySensor: new Map(),
  sampleDaysBySensor: new Map(),
  selectedSensorId: null,
};

function refreshMapAndDetail() {
  updateMapColors(state);
  if (state.selectedSensorId !== null) {
    renderDetail(state.selectedSensorId, state, renderRidgeline, renderRadial);
  }
}

state.map = initMap();

loadData()
  .then((data) => {
    state.sensors = data.sensors;
    state.details = data.details;
    state.detailsBySensor = data.detailsBySensor;
    state.sampleDaysBySensor = data.sampleDaysBySensor;

    createMarkers(state.map, state, (sensorId) => {
      renderDetail(sensorId, state, renderRidgeline, renderRadial);
    });

    updateControlsUI();
    updateMapColors(state);
  })
  .catch((err) => {
    if (els.detail) {
      els.detail.innerHTML =
        "<p class=\"muted\">Failed to load data. Make sure you are running a local server.</p>";
    }
    console.error(err);
  });

els.thresholdSel.addEventListener("change", () => {
  updateControlsUI();
  refreshMapAndDetail();
});
els.timeModeSel.addEventListener("change", () => {
  updateControlsUI();
  refreshMapAndDetail();
});
els.hourSlider.addEventListener("input", () => {
  updateControlsUI();
  if (els.timeModeSel.value === "hour") {
    refreshMapAndDetail();
  }
});
els.ridgeModeSel.addEventListener("change", () => {
  if (state.selectedSensorId !== null) {
    renderRidgeline(state.selectedSensorId, state);
  }
});
els.ridgeBinInput.addEventListener("change", () => {
  if (state.selectedSensorId !== null) {
    renderRidgeline(state.selectedSensorId, state);
  }
});
els.compareToggle.addEventListener("change", () => {
  if (state.selectedSensorId !== null) {
    renderDetail(state.selectedSensorId, state, renderRidgeline, renderRadial);
  }
});
