import { ridgeThreshold } from "./config.js";
import { currentRidgeBin, els } from "./ui.js";
import { getLowRiskSensorId } from "./utils.js";

export function renderRidgeline(sensorId, state) {
  const container = els.ridgeline;
  if (!container) return;
  container.innerHTML = "";

  const recs = state.detailsBySensor.get(sensorId) || [];
  const compareEnabled = els.compareToggle && els.compareToggle.checked;
  const compareId = compareEnabled
    ? getLowRiskSensorId(state.sensors, sensorId)
    : null;
  const compareRecs = compareId ? state.detailsBySensor.get(compareId) || [] : [];
  const ridgeHourBin = currentRidgeBin();
  const ridgeMode = els.ridgeModeSel ? els.ridgeModeSel.value : "weekday";
  if (recs.length === 0) {
    container.innerHTML = `<p class="muted">No records for this sensor.</p>`;
    if (els.ridgelineMeta) els.ridgelineMeta.textContent = "";
    return;
  }

  const weekday = recs.filter((r) => r.is_weekend === 0);
  const weekend = recs.filter((r) => r.is_weekend === 1);
  const compareWeekday = compareRecs.filter((r) => r.is_weekend === 0);
  const compareWeekend = compareRecs.filter((r) => r.is_weekend === 1);
  const primaryRecords = ridgeMode === "weekend" ? weekend : weekday;
  const comparePrimary = compareRecs.length
    ? ridgeMode === "weekend"
      ? compareWeekend
      : compareWeekday
    : [];

  const width = container.clientWidth || 420;
  const height = 380;

  const margin = { top: 10, right: 54, bottom: 22, left: 38 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const panelPad = 18;
  const rowAreaH = Math.max(1, innerH - panelPad);
  const hourBins = d3.range(0, 24, ridgeHourBin);
  const rowH = rowAreaH / hourBins.length;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const allDb = compareRecs.length
    ? recs.concat(compareRecs).map((d) => d.decibel_level)
    : recs.map((d) => d.decibel_level);
  const xMin = Math.floor(d3.min(allDb) / 5) * 5;
  const xMax = Math.ceil(d3.max(allDb) / 5) * 5;

  const x = d3.scaleLinear().domain([xMin, xMax]).range([0, innerW]);

  const binGen = d3
    .bin()
    .domain(x.domain())
    .thresholds(d3.range(xMin, xMax + 1, 2));

  function buildHourBins(records) {
    const byBin = d3.group(records, (d) => Math.floor(d.hour / ridgeHourBin));
    const result = new Map();
    hourBins.forEach((start, idx) => {
      const vals = (byBin.get(idx) || []).map((d) => d.decibel_level);
      const bins = binGen(vals);
      let above = 0;
      for (const v of vals) if (v >= ridgeThreshold) above++;
      result.set(start, { bins, total: vals.length, above });
    });
    return result;
  }

  const binsPrimary = buildHourBins(primaryRecords);
  const binsCompare = comparePrimary.length ? buildHourBins(comparePrimary) : null;

  function maxBinCount(binsMap) {
    return (
      d3.max(
        Array.from(binsMap.values()).flatMap((b) => b.bins),
        (b) => b.length,
      ) || 1
    );
  }

  const maxCount = Math.max(
    maxBinCount(binsPrimary),
    binsCompare ? maxBinCount(binsCompare) : 0,
  );

  const yAmp = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([0, rowH * 0.85]);

  function rowFade(total) {
    if (total < 4) return 0.35;
    if (total < 8) return 0.6;
    return 1;
  }

  function drawPanel(title, binsMap, yOffset, compareBinsMap) {
    g.append("text")
      .attr("x", 0)
      .attr("y", yOffset + 10)
      .attr("fill", "#6b7280")
      .attr("font-size", 12)
      .text(title);

    g.append("text")
      .attr("x", innerW + 6)
      .attr("y", yOffset + 10)
      .attr("fill", "#6b7280")
      .attr("font-size", 10)
      .text(">=55 dB");

    const panelTop = yOffset + panelPad;
    const panelG = g.append("g").attr("transform", `translate(0, ${panelTop})`);

    const area = d3
      .area()
      .x((d) => x((d.x0 + d.x1) / 2))
      .y0(rowH)
      .y1((d) => rowH - yAmp(d.length))
      .curve(d3.curveCatmullRom);

    const areaAbove = d3
      .area()
      .defined((d) => (d.x0 + d.x1) / 2 >= ridgeThreshold)
      .x((d) => x((d.x0 + d.x1) / 2))
      .y0(rowH)
      .y1((d) => rowH - yAmp(d.length))
      .curve(d3.curveCatmullRom);

    hourBins.forEach((start) => {
      const binIndex = start / ridgeHourBin;
      const row = panelG
        .append("g")
        .attr("transform", `translate(0, ${binIndex * rowH})`);
      const rowData = binsMap.get(start) || {
        bins: [],
        total: 0,
        above: 0,
      };
      const bins = rowData.bins;
      const rowOpacity = rowFade(rowData.total);
      row.attr("opacity", rowOpacity);

      row
        .append("path")
        .datum(bins)
        .attr("d", area)
        .attr("fill", "#111827")
        .attr("fill-opacity", 0.18)
        .attr("stroke", "#111827")
        .attr("stroke-opacity", 0.35)
        .attr("stroke-width", 1);

      row
        .append("path")
        .datum(bins)
        .attr("d", areaAbove)
        .attr("fill", "#ef4444")
        .attr("fill-opacity", 0.45)
        .attr("stroke", "none");

      if (compareBinsMap) {
        const compareBins = compareBinsMap.get(start) || { bins: [] };
        row
          .append("path")
          .datum(compareBins.bins)
          .attr("d", area)
          .attr("fill", "none")
          .attr("stroke", "#0f172a")
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,2");
      }

      const rowLabel =
        ridgeHourBin === 1
          ? String(start).padStart(2, "0")
          : `${String(start).padStart(2, "0")}-${String(
              Math.min(23, start + ridgeHourBin - 1),
            ).padStart(2, "0")}`;
      const labelY = Math.max(8, rowH - 2);

      row
        .append("text")
        .attr("x", -8)
        .attr("y", labelY)
        .attr("text-anchor", "end")
        .attr("fill", "#6b7280")
        .attr("font-size", 10)
        .text(rowLabel);

      const pct =
        rowData.total > 0
          ? Math.round((rowData.above / rowData.total) * 100)
          : null;
      row
        .append("text")
        .attr("x", innerW + 6)
        .attr("y", labelY)
        .attr("text-anchor", "start")
        .attr("fill", "#6b7280")
        .attr("font-size", 10)
        .text(pct === null ? "-" : `${pct}%`);
    });

    return { panelTop, panelBottom: panelTop + rowAreaH };
  }

  const panelTitle = ridgeMode === "weekend" ? "Weekend" : "Weekday";
  const panel = drawPanel(panelTitle, binsPrimary, 0, binsCompare);

  const xThr = x(ridgeThreshold);
  g.append("line")
    .attr("x1", xThr)
    .attr("x2", xThr)
    .attr("y1", panel.panelTop)
    .attr("y2", panel.panelBottom)
    .attr("stroke", "#ef4444")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3");

  g.append("text")
    .attr("x", Math.min(innerW, xThr + 4))
    .attr("y", 10)
    .attr("fill", "#6b7280")
    .attr("font-size", 10)
    .text(`${ridgeThreshold} dB`);

  const xAxis = d3.axisBottom(x).ticks(5).tickSizeOuter(0);
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${panel.panelBottom})`)
    .call(xAxis);

  g.append("text")
    .attr("x", innerW)
    .attr("y", innerH + 20)
    .attr("text-anchor", "end")
    .attr("fill", "#6b7280")
    .attr("font-size", 10)
    .text("Decibel level");

  if (els.ridgelineMeta) {
    const binLabel =
      ridgeHourBin === 1
        ? "Hourly rows."
        : `Binned in ${ridgeHourBin}-hour blocks.`;
    if (compareEnabled && compareId && compareRecs.length) {
      const compareSensor = state.sensors.find((s) => s.sensor_id === compareId);
      const avg = compareSensor ? compareSensor.avg_db.toFixed(1) : "n/a";
      els.ridgelineMeta.textContent = `${binLabel} Comparison: Sensor ${compareId} (avg ${avg} dB) shown as dashed outline.`;
    } else if (compareEnabled) {
      els.ridgelineMeta.textContent = `${binLabel} Comparison unavailable.`;
    } else {
      els.ridgelineMeta.textContent = `${binLabel} Comparison off.`;
    }
  }
}
