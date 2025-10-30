# 🗺️ Mecklenburg County Zoning Webmap — Project Prompt

## Overview

Create a **MapLibre GL JS** web application visualizing **Mecklenburg County parcels, zoning, buildings, and streets**, using live data from open APIs.

The application should:
- Initialize on a view of **Mecklenburg County, NC**
- Load **parcel polygons** and **zoning info** dynamically from APIs only when zoomed in beyond a defined threshold  
- Display **building footprints** and **street centerlines** from **OSM (Overpass API)**, also gated by zoom level  
- Show **parcel tooltips** with zoning info on hover  
- Include **address search** using the **City of Charlotte Master Address geocoder**, with **Nominatim fallback**
- Use **OSM raster tiles** as basemap plus labels and admin lines
- Include **data source attributions** in footer (City of Charlotte, Mecklenburg County, OSM, UDO)
- Be designed as a **static client-side app** deployable via **GitHub Pages and GitHub Actions**
- Optionally include a **serverless proxy layer** (Cloudflare Pages Functions or Netlify Functions) for API caching, rate limiting, and CORS handling.

---

## Core APIs

| Data | Source | URL / Notes |
|------|---------|-------------|
| **Parcels** | Mecklenburg County | `https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query` |
| **Zoning (parcel lookup)** | City of Charlotte | `https://data.charlottenc.gov/datasets/charlotte::parcel-zoning-lookup/FeatureServer/0/query` |
| **Buildings (context)** | OpenStreetMap / Overpass | Example endpoint: `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(way["building"](bbox);relation["building"](bbox););out body;>;out skel qt;` |
| **Streets (context)** | OpenStreetMap / Overpass | Example endpoint: `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(way["highway"](bbox););out body;>;out skel qt;` |
| **Address search** | City of Charlotte MasterAddress GeocodeServer | `https://maps.charlottenc.gov/arcgis/rest/services/LOC/MasterAddress/GeocodeServer/findAddressCandidates` |
| **Address search fallback** | Nominatim (OSM) | `https://nominatim.openstreetmap.org/search?format=json&q=...` |

---

## Application Behavior

### Map
- Center: `35.2269, -80.8433`  
- Zoom start: `11`  
- Min zoom to load parcels/buildings: `14`
- Style: neutral gray/white tone  
- Basemap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### Layers & Loading
| Layer | Load Trigger | Data Source | Visualization |
|--------|---------------|--------------|----------------|
| Parcels | zoom ≥ 14 | County Feature Service | Thin gray outlines |
| Zoning info | fetched on parcel hover | Parcel Zoning Lookup | Tooltip |
| Buildings | zoom ≥ 15 | OSM Overpass | Light gray fill |
| Streets | zoom ≥ 12 | OSM Overpass | Thin darker lines |
| Labels, admin boundaries | zoom-aware | OSM raster (basemap) | default |

### Tooltip
Show:
- Parcel ID (`PID`)
- Address (`SITE_ADDRESS`)
- Zoning Code (`ZONING`)
- Owner (if present)

### Address Search
- Input box in top-left corner
- On submit → call Charlotte MasterAddress Geocoder  
  - If no match → fallback to Nominatim
- Map pans/zooms to the first candidate

---

## Technical Implementation

### Project Structure
meck-zoning-map/
├── public/
│ ├── index.html
│ ├── style.css
│ ├── favicon.ico
├── src/
│ ├── main.js
│ ├── map.js
│ ├── layers/
│ │ ├── parcels.js
│ │ ├── zoning.js
│ │ ├── buildings.js
│ │ ├── streets.js
│ ├── utils/
│ │ ├── overpass.js
│ │ ├── geocode.js
│ │ ├── proxyFetch.js
├── functions/ # optional proxy layer (Cloudflare/Netlify)
│ ├── parcels.js
│ ├── zoning.js
│ ├── overpass.js
│ ├── geocode.js
├── package.json
├── .github/
│ └── workflows/deploy.yml
└── README.md

csharp
Copy code

### Libraries
- `maplibre-gl` (core map)
- `@turf/turf` (geometry helpers)
- `axios` or `fetch` for API calls
- `debounce` for map move throttling
- optional: `vite` for bundling

### Example Fetch Pattern
```js
const parcelUrl = 'https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query';
const params = new URLSearchParams({
  where: '1=1',
  geometry: JSON.stringify(bboxGeoJSON),
  geometryType: 'esriGeometryEnvelope',
  inSR: 4326,
  spatialRel: 'esriSpatialRelIntersects',
  outFields: 'PID,SITE_ADDRESS',
  outSR: 4326,
  f: 'geojson'
});
const res = await fetch(`${parcelUrl}?${params}`);
const geojson = await res.json();
map.getSource('parcels').setData(geojson);
Hover / Tooltip Behavior
On mousemove, query rendered features in the “parcels” layer.

On hover, fetch zoning for that PID using the Parcel Zoning Lookup API (or proxy endpoint).

Display a small popup with zoning + address info.

Optional Serverless Proxy Layer
Purpose
Avoid CORS errors

Cache responses (e.g., Overpass or zoning lookups)

Prevent direct exposure of API URLs to users

Debounce identical queries across users

How it Works
Each function acts as an HTTP endpoint.
Example:
/api/parcels?bbox=... → fetches data from the County ArcGIS API, sets cache headers, returns JSON.

Example Proxy Function (functions/parcels.js)
js
Copy code
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const bbox = url.searchParams.get('bbox');
  const upstream = `https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query?where=1%3D1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=geojson`;
  const res = await fetch(upstream);
  const data = await res.text();
  return new Response(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
Deploy via:

Cloudflare Pages: place under /functions/

Netlify: same files under /netlify/functions/

Local Development
Use wrangler pages dev (Cloudflare) or netlify dev to emulate proxy endpoints locally.

Deployment via GitHub Pages
Build:

Use Vite or vanilla JS build script.

GitHub Actions Workflow (.github/workflows/deploy.yml):

yaml
Copy code
name: Deploy Map
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
Host optional proxy separately (Cloudflare Pages or Netlify).

Keys & Secrets
All APIs listed here are public — no keys required.
If you later switch to commercial tile or geocoding services (MapTiler, Mapbox, etc.):

Store API keys in GitHub repository secrets

Reference in workflow: ${{ secrets.MAPTILER_KEY }}

Inject at build time via import.meta.env or .env.production

Attribution Footer
Data © 2025 City of Charlotte & Mecklenburg County GIS.
Basemap © OpenStreetMap contributors.
Zoning data per Unified Development Ordinance (UDO).
Building footprints & streets via OpenStreetMap / Overpass API.

Optional Enhancements (Future)
Add click-to-highlight parcel with zoning popup

Add zoning legend / color symbology

Store last map state in URL hash for sharing

Vector tile pre-rendering for performance

Offline caching with service worker

Deliverables
Working index.html with interactive MapLibre map

Dynamic parcel + zoning fetch

Hover tooltips

Address search (Charlotte Geocoder + Nominatim fallback)

Optional proxy layer ready for Cloudflare/Netlify deployment

GitHub Actions workflow for auto-deploy

