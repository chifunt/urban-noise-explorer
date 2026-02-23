import {
  categoryFromPct,
  computeExceedPct,
  filterRecords,
  getLowRiskSensorIdByContext,
} from "./utils.js";
import { currentThreshold, currentTimeFilter, els } from "./ui.js";

function updateCompareNote(sensorId, state, threshold, tf) {
  if (!els.compareNote) return;
  const compareId = getLowRiskSensorIdByContext({
    sensors: state.sensors,
    detailsBySensor: state.detailsBySensor,
    timeFilter: tf,
    threshold,
    excludeId: sensorId,
  });
  if (!compareId) {
    els.compareNote.textContent = "No comparison sensor available.";
    return;
  }
  const compareSensor = state.sensors.find((s) => s.sensor_id === compareId);
  const avg = compareSensor ? compareSensor.avg_db.toFixed(1) : "n/a";
  const compareRecs = filterRecords(state.detailsBySensor.get(compareId) || [], tf);
  const comparePct = computeExceedPct(compareRecs, threshold);
  const pctLabel = comparePct === null ? "n/a" : `${comparePct.toFixed(0)}%`;
  els.compareNote.textContent =
    `Low-risk sensor in current filter: ${compareId} ` +
    `(>=${threshold} dB: ${pctLabel}, avg ${avg} dB).`;
}

export function renderDetail(sensorId, state, renderRidgeline, renderRadial) {
  state.selectedSensorId = sensorId;
  const s = state.sensors.find((x) => x.sensor_id === sensorId);
  if (!s) return;

  const threshold = currentThreshold();
  const tf = currentTimeFilter();
  const recsAll = state.detailsBySensor.get(sensorId) || [];
  const recs = filterRecords(recsAll, tf);

  const pct = computeExceedPct(recs, threshold);
  const cat = pct === null ? "no data" : categoryFromPct(pct).replace("_", " ");

  const avgdb = (s.avg_db ?? 0).toFixed(1);
  const complaints = s.complaints ?? 0;
  const totalSamples = recsAll.length;
  const filteredSamples = recs.length;
  const weekendCount = recsAll.filter((r) => r.is_weekend === 1).length;
  const weekdayCount = totalSamples - weekendCount;
  const weekdayPct = totalSamples
    ? Math.round((weekdayCount / totalSamples) * 100)
    : 0;
  const weekendPct = totalSamples
    ? Math.round((weekendCount / totalSamples) * 100)
    : 0;

  els.detail.innerHTML =
    `<h4 style="margin: 0 0 6px;">Sensor ${sensorId}</h4>
     <div class="kpi">
       <div class="card">
         <div class="label">Noise risk</div>
         <div class="value">${cat}</div>
       </div>
       <div class="card">
         <div class="label">Above ${threshold} dB</div>
         <div class="value">${pct === null ? "-" : pct.toFixed(0) + "%"}</div>
       </div>
       <div class="card">
         <div class="label">Avg dB (all)</div>
         <div class="value">${avgdb}</div>
       </div>
       <div class="card">
         <div class="label">Complaints (all)</div>
         <div class="value">${complaints}</div>
       </div>
     </div>
     <div class="samplemeta">
       <div>Samples: ${totalSamples} total, ${filteredSamples} in filter.</div>
       <div>Weekday/weekend balance: ${weekdayCount} / ${weekendCount} (${weekdayPct}% / ${weekendPct}%).</div>
     </div>
     <p class="muted" style="margin-top:12px;">
       Map colors respond to the filters above. Ridgeline and radial summaries show the selected sensor's temporal patterns.
     </p>`;

  updateCompareNote(sensorId, state, threshold, tf);
  renderRidgeline(sensorId, state);
  renderRadial(sensorId, state);
}
