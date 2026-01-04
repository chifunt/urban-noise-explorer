import { colors } from "./config.js";
import { categoryFromPct, computeExceedPct, filterRecords } from "./utils.js";
import { currentThreshold, currentTimeFilter } from "./ui.js";

export function initMap() {
  const map = L.map("map").setView([40.7, -73.95], 12);
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  ).addTo(map);
  return map;
}

export function createMarkers(map, state, onSelect) {
  state.markersBySensor = new Map();
  state.sensors.forEach((d) => {
    const m = L.circleMarker([d.latitude, d.longitude], {
      radius: 5 + Math.min(10, d.complaints / 10),
      color: "#9ca3af",
      fillColor: "#9ca3af",
      fillOpacity: 0.4,
      weight: 1,
    }).addTo(map);

    m.bindTooltip(`Sensor ${d.sensor_id}`);

    m.on("click", () => {
      for (const mk of state.markersBySensor.values()) {
        mk.setStyle({ weight: 1 });
      }
      m.setStyle({ weight: 3 });
      onSelect(d.sensor_id);
    });

    state.markersBySensor.set(d.sensor_id, m);
  });
}

export function updateMapColors(state) {
  const threshold = currentThreshold();
  const tf = currentTimeFilter();

  state.sensors.forEach((s) => {
    const recs = filterRecords(state.detailsBySensor.get(s.sensor_id), tf);
    const pct = computeExceedPct(recs, threshold);
    const marker = state.markersBySensor.get(s.sensor_id);
    if (!marker) return;

    if (pct === null) {
      marker.setStyle({
        color: "#9ca3af",
        fillColor: "#9ca3af",
        fillOpacity: 0.4,
      });
      marker.setTooltipContent(`Sensor ${s.sensor_id}<br/>No data for filter`);
      return;
    }
    const cat = categoryFromPct(pct);
    const color = colors[cat] || "#9ca3af";
    marker.setStyle({ color, fillColor: color, fillOpacity: 0.8 });

    const avgdb = (s.avg_db ?? 0).toFixed(1);
    marker.setTooltipContent(
      `Sensor ${s.sensor_id}<br/>` +
        `Risk: ${cat.replace("_", " ")}<br/>` +
        `Above ${threshold} dB: ${pct.toFixed(0)}%<br/>` +
        `Avg dB (all): ${avgdb}`,
    );
  });
}
