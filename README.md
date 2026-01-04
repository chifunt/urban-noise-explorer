# Urban Noise Explorer

Interactive prototype for exploring urban noise sensor data with a map, ridgeline, and radial summaries.

## Quick start

Run a local server from the project root:

```
python3 -m http.server 8000
```

Open:

```
http://localhost:8000/
```

## Project structure

```
css/
  styles.css
  vendor/
js/
  config.js
  data.js
  detail.js
  main.js
  map.js
  radial.js
  ridgeline.js
  ui.js
  utils.js
  vendor/
sensors_map.json
sensors_detail.json
scripts/
  vendor.sh
```

## Vendor assets

To (re)download Leaflet and D3 into local vendor folders:

```
./scripts/vendor.sh
```

## Notes

- This is a static client-only prototype. No build step is required.
- Data files are loaded via fetch, so a local server is required.
