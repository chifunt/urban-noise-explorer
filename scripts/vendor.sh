#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "${ROOT}/js/vendor/leaflet" "${ROOT}/js/vendor/d3" "${ROOT}/css/vendor/leaflet/images"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" \
  -o "${ROOT}/js/vendor/leaflet/leaflet.js"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" \
  -o "${ROOT}/css/vendor/leaflet/leaflet.css"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" \
  -o "${ROOT}/css/vendor/leaflet/images/marker-icon.png"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png" \
  -o "${ROOT}/css/vendor/leaflet/images/marker-icon-2x.png"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" \
  -o "${ROOT}/css/vendor/leaflet/images/marker-shadow.png"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/images/layers.png" \
  -o "${ROOT}/css/vendor/leaflet/images/layers.png"

curl -sSL "https://unpkg.com/leaflet@1.9.4/dist/images/layers-2x.png" \
  -o "${ROOT}/css/vendor/leaflet/images/layers-2x.png"

curl -sSL "https://d3js.org/d3.v7.min.js" \
  -o "${ROOT}/js/vendor/d3/d3.v7.min.js"

echo "Vendor assets downloaded."
