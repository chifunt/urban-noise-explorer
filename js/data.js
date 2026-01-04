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

export async function loadData() {
  const [mapData, detailData] = await Promise.all([
    fetch("sensors_map.json").then((r) => r.json()),
    fetch("sensors_detail.json").then((r) => r.json()),
  ]);

  const sensors = mapData.map((d) => ({
    sensor_id: Number(d.sensor_id),
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
    avg_db: Number(d.avg_db),
    complaints: Number(d.complaints),
  }));

  const details = detailData.map((d) => ({
    sensor_id: Number(d.sensor_id),
    hour: Number(d.hour),
    is_weekend: Number(d.is_weekend),
    decibel_level: Number(d.decibel_level),
    date: d.datetime ? d.datetime.split("T")[0] : null,
  }));

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
