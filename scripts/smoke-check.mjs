import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function loadJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function fail(message) {
  throw new Error(message);
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const root = process.cwd();
const mapPath = path.join(root, "sensors_map.json");
const detailPath = path.join(root, "sensors_detail.json");

const mapData = await loadJson(mapPath);
const detailData = await loadJson(detailPath);

if (!Array.isArray(mapData)) fail("sensors_map.json must be an array");
if (!Array.isArray(detailData)) fail("sensors_detail.json must be an array");
if (mapData.length === 0) fail("sensors_map.json is empty");
if (detailData.length === 0) fail("sensors_detail.json is empty");

const mapIds = new Set();
for (const [idx, row] of mapData.entries()) {
  const sensorId = asNumber(row.sensor_id);
  const lat = asNumber(row.latitude);
  const lon = asNumber(row.longitude);
  const avgDb = asNumber(row.avg_db);
  const complaints = asNumber(row.complaints);
  if (
    sensorId === null ||
    lat === null ||
    lon === null ||
    avgDb === null ||
    complaints === null
  ) {
    fail(`Invalid map row at index ${idx}`);
  }
  if (mapIds.has(sensorId)) {
    fail(`Duplicate sensor_id in map data: ${sensorId}`);
  }
  mapIds.add(sensorId);
}

const detailIds = new Set();
for (const [idx, row] of detailData.entries()) {
  const sensorId = asNumber(row.sensor_id);
  const hour = asNumber(row.hour);
  const weekend = asNumber(row.is_weekend);
  const db = asNumber(row.decibel_level);
  if (sensorId === null || hour === null || weekend === null || db === null) {
    fail(`Invalid detail row at index ${idx}`);
  }
  if (hour < 0 || hour > 23) {
    fail(`Invalid hour at detail index ${idx}: ${hour}`);
  }
  if (weekend !== 0 && weekend !== 1) {
    fail(`Invalid is_weekend at detail index ${idx}: ${weekend}`);
  }
  detailIds.add(sensorId);
}

for (const id of detailIds) {
  if (!mapIds.has(id)) {
    fail(`Detail sensor_id missing from map data: ${id}`);
  }
}

console.log(
  `Smoke checks passed. sensors=${mapData.length} detail_rows=${detailData.length}`,
);
