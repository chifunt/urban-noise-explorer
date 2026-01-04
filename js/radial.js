import { colors } from "./config.js";
import { categoryFromDb } from "./utils.js";
import { els } from "./ui.js";

export function renderRadial(sensorId, state) {
  const container = els.radial;
  if (!container) return;
  container.innerHTML = "";

  const recs = state.detailsBySensor.get(sensorId) || [];
  if (recs.length === 0) {
    container.innerHTML = `<p class="muted">No records for this sensor.</p>`;
    if (els.radialLegend) els.radialLegend.textContent = "";
    if (els.radialMeta) els.radialMeta.textContent = "";
    return;
  }

  const weekday = recs.filter((r) => r.is_weekend === 0);
  const weekend = recs.filter((r) => r.is_weekend === 1);
  const hours = d3.range(0, 24);
  const sampleDays = state.sampleDaysBySensor.get(sensorId) || {};

  function statsByHour(records) {
    const byHour = d3.group(records, (d) => d.hour);
    const stats = new Map();
    hours.forEach((h) => {
      const vals = (byHour.get(h) || [])
        .map((d) => d.decibel_level)
        .sort((a, b) => a - b);
      if (vals.length === 0) {
        stats.set(h, null);
        return;
      }
      const q1 = d3.quantile(vals, 0.25);
      const q3 = d3.quantile(vals, 0.75);
      stats.set(h, {
        median: d3.median(vals),
        q1,
        q3,
        iqr: q1 !== undefined && q3 !== undefined ? q3 - q1 : 0,
      });
    });
    return stats;
  }

  const statsWeekday = statsByHour(weekday);
  const statsWeekend = statsByHour(weekend);

  const width = container.clientWidth || 420;
  const size = Math.min(360, width);
  const height = 240;

  const rOuter = 90;
  const rMid = 68;
  const rInner = 46;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${size} ${height}`);

  const cx = size / 2;
  const cy = height / 2 + 4;

  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

  const arc = d3.arc();
  const full = 2 * Math.PI;
  const step = full / 24;

  function ringSegment(h, r0, r1) {
    const a0 = h * step - Math.PI / 2;
    const a1 = (h + 1) * step - Math.PI / 2;
    return arc({
      innerRadius: r0,
      outerRadius: r1,
      startAngle: a0,
      endAngle: a1,
    });
  }

  function drawRing(statsMap, r0, r1, label, sampleDay, bandDirection) {
    const iqrMax =
      d3.max(
        Array.from(statsMap.values())
          .filter(Boolean)
          .map((d) => d.iqr || 0),
      ) || 0;
    const iqrScale = d3
      .scaleLinear()
      .domain([0, iqrMax || 1])
      .range([2, 10]);

    hours.forEach((h) => {
      const stats = statsMap.get(h);
      const v = stats ? stats.median : null;
      const cat = v === null ? null : categoryFromDb(v);
      const fill = cat ? colors[cat] : "#e5e7eb";

      if (stats && stats.iqr && iqrMax > 0) {
        const band = iqrScale(stats.iqr);
        const bandStart =
          bandDirection === "out" ? r1 : Math.max(12, r0 - band);
        const bandEnd = bandDirection === "out" ? r1 + band : r0;
        g.append("path")
          .attr("d", ringSegment(h, bandStart, bandEnd))
          .attr("fill", fill)
          .attr("fill-opacity", 0.16)
          .attr("stroke", "none");
      }

      const segment = g
        .append("path")
        .attr("d", ringSegment(h, r0, r1))
        .attr("fill", fill)
        .attr("fill-opacity", v === null ? 0.5 : 0.55)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

      const dateLabel = sampleDay ? sampleDay.date : "n/a";
      const count = sampleDay ? sampleDay.countsByHour.get(h) || 0 : 0;
      const countLabel = sampleDay ? `${count} samples` : "no day data";
      segment
        .append("title")
        .text(
          `${label} sample day ${dateLabel} - ${String(h).padStart(2, "0")}:00 - ${countLabel}`,
        );
    });
  }

  drawRing(statsWeekend, rMid, rOuter, "Weekend", sampleDays.weekend, "out");
  drawRing(statsWeekday, rInner, rMid - 2, "Weekday", sampleDays.weekday, "in");

  hours
    .filter((h) => h % 3 === 0)
    .forEach((h) => {
      const ang = h * step - Math.PI / 2;
      const x0 = Math.cos(ang) * (rOuter + 2);
      const y0 = Math.sin(ang) * (rOuter + 2);
      const x1 = Math.cos(ang) * (rOuter + 10);
      const y1 = Math.sin(ang) * (rOuter + 10);

      g.append("line")
        .attr("x1", x0)
        .attr("y1", y0)
        .attr("x2", x1)
        .attr("y2", y1)
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 1);

      const lx = Math.cos(ang) * (rOuter + 18);
      const ly = Math.sin(ang) * (rOuter + 18);

      g.append("text")
        .attr("x", lx)
        .attr("y", ly + 3)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", "#6b7280")
        .text(String(h).padStart(2, "0"));
    });

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", -2)
    .attr("font-size", 12)
    .attr("fill", "#111")
    .text("Daily cycle");

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 14)
    .attr("font-size", 10)
    .attr("fill", "#6b7280")
    .text("Median dB");

  if (els.radialLegend) {
    els.radialLegend.textContent =
      "Ring: inner weekday, outer weekend. Faint band shows IQR per hour.";
  }

  if (els.radialMeta) {
    const weekdayLabel = sampleDays.weekday
      ? `${sampleDays.weekday.date} (${sampleDays.weekday.total} samples)`
      : "n/a";
    const weekendLabel = sampleDays.weekend
      ? `${sampleDays.weekend.date} (${sampleDays.weekend.total} samples)`
      : "n/a";
    els.radialMeta.textContent =
      `Hover ring for raw hourly counts. Sample day weekday: ${weekdayLabel}. Sample day weekend: ${weekendLabel}.`;
  }
}
