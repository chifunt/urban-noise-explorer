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

function bindUIEvent(el, eventName, handler) {
  if (!el) {
    console.warn(`Missing UI element for ${eventName} listener.`);
    return;
  }
  el.addEventListener(eventName, handler);
}

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

bindUIEvent(els.thresholdSel, "change", () => {
  updateControlsUI();
  refreshMapAndDetail();
});
bindUIEvent(els.timeModeSel, "change", () => {
  updateControlsUI();
  refreshMapAndDetail();
});
bindUIEvent(els.hourSlider, "input", () => {
  updateControlsUI();
  if (els.timeModeSel && els.timeModeSel.value === "hour") {
    refreshMapAndDetail();
  }
});
bindUIEvent(els.ridgeModeSel, "change", () => {
  if (state.selectedSensorId !== null) {
    renderRidgeline(state.selectedSensorId, state);
  }
});
bindUIEvent(els.ridgeBinInput, "change", () => {
  if (state.selectedSensorId !== null) {
    renderRidgeline(state.selectedSensorId, state);
  }
});
bindUIEvent(els.compareToggle, "change", () => {
  if (state.selectedSensorId !== null) {
    renderDetail(state.selectedSensorId, state, renderRidgeline, renderRadial);
  }
});
