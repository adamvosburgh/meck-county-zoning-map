# Mecklenburg County Zoning Map

Interactive MapLibre GL app that highlights Mecklenburg County parcels, zoning context, buildings, and streets using open data services.

## Features
- Parcel outlines appear from zoom level 16 using the Charlotte CLTEx parcel service (GeoJSON response).
- Hover tooltips expose parcel IDs plus any returned address/owner attributes.
- Building footprints and street context load on-demand from Overpass.
- Address search calls the Charlotte Master Address geocoder with Nominatim fallback.

## Data Sources
| Layer | Service | API Endpoint |
|-------|---------|--------------|
| Parcels (geometry) | CLT_Ex PopUps Layer 3 | [CLTEx_PopUps/MapServer/3](https://gis.charlottenc.gov/arcgis/rest/services/CLT_Ex/CLTEx_PopUps/MapServer/3/query?outFields=*&where=1%3D1&f=geojson) |
| Parcel Lookup (attributes) | CLT_Ex MoreInfo Layer 4 | [CLTEx_MoreInfo/MapServer/4](https://gis.charlottenc.gov/arcgis/rest/services/CLT_Ex/CLTEx_MoreInfo/MapServer/4/query?where=1%3D1&outFields=*&outSR=4326&f=json) |
| Parcel Zoning Lookup | ODP Parcel Zoning Lookup | [Parcel_Zoning_Lookup/MapServer/0](https://gis.charlottenc.gov/arcgis/rest/services/ODP/Parcel_Zoning_Lookup/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json) |
| Buildings & streets | OpenStreetMap | [Overpass API](https://overpass-api.de/api/interpreter) |
| Basemap tiles | OpenStreetMap | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |
| Address search | Charlotte MasterAddress | GeocodeServer with Nominatim fallback |

## Quick Start
```bash
npm install
npm run dev   # http://localhost:3000
```

### Production Build
```bash
npm run build
npm run preview
```

## Project Layout
```
src/
  main.js        # entry point
  map.js         # map configuration
  layers/        # parcels, zoning, buildings, streets
  utils/         # geocode and overpass helpers
index.html
public/style.css
functions/       # optional proxy endpoints
```

## Deployment
- Static bundle produced by Vite (`dist/`).
- GitHub Actions workflow `.github/workflows/deploy.yml` publishes to GitHub Pages on pushes to `main`.

## Notes
- Map zoom is limited to 19 to stay within OSM tile coverage.
- All listed APIs are public; mind Overpass and Nominatim usage policies in production deployments.

## Attribution
Data © City of Charlotte & Mecklenburg County GIS · Basemap © OpenStreetMap contributors · Zoning per Charlotte UDO.
