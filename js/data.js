function computeSampleDay(records) {
  if (!records || records.length === 0) return null;
  const byDate = d3.group(records, (d) => d.date);
  let bestDate = null;
  let bestCount = -1;
  byDate.forEach((vals, date) => {
    if (!date) return;
    if (vals.length > bestCount) {
      bestCount = vals.length;
      bestDate = date;
    }
  });
  if (!bestDate) return null;
  const countsByHour = new Map();
  for (const r of byDate.get(bestDate) || []) {
    countsByHour.set(r.hour, (countsByHour.get(r.hour) || 0) + 1);
  }
  return { date: bestDate, total: bestCount, countsByHour };
}

function buildSampleDays(records) {
  return {
    weekday: computeSampleDay(records.filter((r) => r.is_weekend === 0)),
    weekend: computeSampleDay(records.filter((r) => r.is_weekend === 1)),
  };
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.json();
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSensor(row) {
  const sensor_id = toFiniteNumber(row.sensor_id);
  const latitude = toFiniteNumber(row.latitude);
  const longitude = toFiniteNumber(row.longitude);
  const avg_db = toFiniteNumber(row.avg_db);
  const complaints = toFiniteNumber(row.complaints);
  if (
    sensor_id === null ||
    latitude === null ||
    longitude === null ||
    avg_db === null ||
    complaints === null
  ) {
    return null;
  }
  return { sensor_id, latitude, longitude, avg_db, complaints };
}

function normalizeDetail(row) {
  const sensor_id = toFiniteNumber(row.sensor_id);
  const hour = toFiniteNumber(row.hour);
  const is_weekend = toFiniteNumber(row.is_weekend);
  const decibel_level = toFiniteNumber(row.decibel_level);
  if (
    sensor_id === null ||
    hour === null ||
    is_weekend === null ||
    decibel_level === null
  ) {
    return null;
  }
  const hourInt = Math.trunc(hour);
  const weekendInt = Math.trunc(is_weekend);
  if (hourInt < 0 || hourInt > 23) return null;
  if (weekendInt !== 0 && weekendInt !== 1) return null;
  return {
    sensor_id,
    hour: hourInt,
    is_weekend: weekendInt,
    decibel_level,
    date: row.datetime ? String(row.datetime).split("T")[0] : null,
  };
}

export async function loadData() {
  const [mapData, detailData] = await Promise.all([
    loadJson("sensors_map.json"),
    loadJson("sensors_detail.json"),
  ]);

  if (!Array.isArray(mapData)) {
    throw new Error("Invalid payload: sensors_map.json must be an array.");
  }
  if (!Array.isArray(detailData)) {
    throw new Error("Invalid payload: sensors_detail.json must be an array.");
  }

  const sensors = [];
  let invalidSensorRows = 0;
  for (const row of mapData) {
    const normalized = normalizeSensor(row);
    if (normalized) sensors.push(normalized);
    else invalidSensorRows++;
  }

  const details = [];
  let invalidDetailRows = 0;
  for (const row of detailData) {
    const normalized = normalizeDetail(row);
    if (normalized) details.push(normalized);
    else invalidDetailRows++;
  }

  if (invalidSensorRows > 0) {
    console.warn(`Dropped ${invalidSensorRows} invalid sensor rows.`);
  }
  if (invalidDetailRows > 0) {
    console.warn(`Dropped ${invalidDetailRows} invalid detail rows.`);
  }

  const detailsBySensor = d3.group(details, (d) => d.sensor_id);
  const sampleDaysBySensor = new Map();
  detailsBySensor.forEach((records, sensorId) => {
    sampleDaysBySensor.set(sensorId, buildSampleDays(records));
  });

  return {
    sensors,
    details,
    detailsBySensor,
    sampleDaysBySensor,
  };
}
