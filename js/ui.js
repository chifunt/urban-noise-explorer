export const els = {
  thresholdSel: document.getElementById("threshold"),
  thresholdPill: document.getElementById("thresholdPill"),
  timeModeSel: document.getElementById("timeMode"),
  timePill: document.getElementById("timePill"),
  hourRow: document.getElementById("hourRow"),
  hourSlider: document.getElementById("hourSlider"),
  hourLabel: document.getElementById("hourLabel"),
  ridgeModeSel: document.getElementById("ridgeMode"),
  ridgeBinInput: document.getElementById("ridgeBin"),
  compareToggle: document.getElementById("compareToggle"),
  compareNote: document.getElementById("compareNote"),
  mapLegendThreshold: document.getElementById("mapLegendThreshold"),
  ridgeLegendThreshold: document.getElementById("ridgeLegendThreshold"),
  ridgeline: document.getElementById("ridgeline"),
  ridgelineMeta: document.getElementById("ridgelineMeta"),
  radial: document.getElementById("radial"),
  radialLegend: document.getElementById("radialLegend"),
  radialMeta: document.getElementById("radialMeta"),
  detail: document.getElementById("detail"),
};

export function currentThreshold() {
  if (!els.thresholdSel) return 55;
  const threshold = Number(els.thresholdSel.value);
  return Number.isFinite(threshold) ? threshold : 55;
}

export function currentTimeFilter() {
  const mode = els.timeModeSel ? els.timeModeSel.value : "all";
  if (mode === "all") return { mode };
  if (mode === "day") {
    return {
      mode,
      hours: new Set([
        7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      ]),
    };
  }
  if (mode === "night") {
    return { mode, hours: new Set([22, 23, 0, 1, 2, 3, 4, 5, 6]) };
  }
  if (mode === "hour") {
    const hour = els.hourSlider ? Number(els.hourSlider.value) : 22;
    return { mode, hour: Number.isFinite(hour) ? hour : 22 };
  }
  return { mode: "all" };
}

export function describeTimeFilter(tf) {
  if (tf.mode === "all") return "All hours";
  if (tf.mode === "day") return "Day (07-21)";
  if (tf.mode === "night") return "Night (22-06)";
  if (tf.mode === "hour") {
    return `Hour ${String(tf.hour).padStart(2, "0")}:00`;
  }
  return "All hours";
}

export function updateControlsUI() {
  const threshold = currentThreshold();
  if (els.thresholdPill) {
    els.thresholdPill.textContent = `${threshold} dB`;
  }
  if (els.mapLegendThreshold) {
    els.mapLegendThreshold.textContent = String(threshold);
  }
  if (els.ridgeLegendThreshold) {
    els.ridgeLegendThreshold.textContent = String(threshold);
  }
  const tf = currentTimeFilter();
  if (els.timePill) {
    els.timePill.textContent = describeTimeFilter(tf);
  }
  if (els.hourRow) {
    els.hourRow.style.display = tf.mode === "hour" ? "block" : "none";
  }
  if (els.hourLabel) {
    els.hourLabel.textContent = els.hourSlider ? els.hourSlider.value : "22";
  }
}

export function currentRidgeBin() {
  if (!els.ridgeBinInput) return 4;
  const raw = Number(els.ridgeBinInput.value);
  const val = Number.isFinite(raw) ? Math.round(raw) : 4;
  const clamped = Math.min(12, Math.max(1, val));
  if (els.ridgeBinInput.value !== String(clamped)) {
    els.ridgeBinInput.value = clamped;
  }
  return clamped;
}
