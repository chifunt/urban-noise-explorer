export function categoryFromDb(db) {
  if (db < 40) return "quiet";
  if (db < 55) return "moderate";
  if (db < 70) return "loud";
  if (db < 85) return "very_loud";
  return "extreme";
}

export function categoryFromPct(pct) {
  if (pct < 20) return "quiet";
  if (pct < 40) return "moderate";
  if (pct < 60) return "loud";
  if (pct < 80) return "very_loud";
  return "extreme";
}

export function filterRecords(records, tf) {
  if (!records) return [];
  if (tf.mode === "all") return records;
  if (tf.mode === "day" || tf.mode === "night") {
    return records.filter((r) => tf.hours.has(r.hour));
  }
  if (tf.mode === "hour") {
    return records.filter((r) => r.hour === tf.hour);
  }
  return records;
}

export function computeExceedPct(records, threshold) {
  if (!records || records.length === 0) return null;
  const n = records.length;
  let ex = 0;
  for (const r of records) if (r.decibel_level >= threshold) ex++;
  return (ex / n) * 100;
}

export function getLowRiskSensorId(sensors, excludeId) {
  if (!sensors || sensors.length === 0) return null;
  const sorted = [...sensors].sort((a, b) => {
    if (a.avg_db !== b.avg_db) return a.avg_db - b.avg_db;
    return a.sensor_id - b.sensor_id;
  });
  for (const s of sorted) {
    if (s.sensor_id !== excludeId) return s.sensor_id;
  }
  return sorted[0].sensor_id;
}
