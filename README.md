# Mecklenburg County Zoning Map

Interactive MapLibre GL app that displays Mecklenburg County parcels with detailed zoning information using open data services.

## Features
- **Parcel Layer**: Parcels appear from zoom level 16 using Charlotte CLTEx parcel service (GeoJSON)
- **Interactive Details**: Click any parcel to view comprehensive lookup data including zoning, owner, address, and tax information
- **Hover Effects**: Blue outline highlights parcels on hover with pointer cursor
- **Address Search**: Smart fuzzy geocoding using Nominatim (OpenStreetMap) with Charlotte MasterAddress fallback
  - Supports partial addresses: "1630 arlyn cir", "1630 Arlyn Circle Charlotte", etc.
  - Automatically restricted to Mecklenburg County
  - Places red marker on found addresses
- **Layer Toggles**: Show/hide basemap and parcel layers

## Data Sources
| Layer | Service | API Endpoint |
|-------|---------|--------------|
| Parcels (geometry) | CLT_Ex PopUps Layer 3 | [CLTEx_PopUps/MapServer/3](https://gis.charlottenc.gov/arcgis/rest/services/CLT_Ex/CLTEx_PopUps/MapServer/3/query?outFields=*&where=1%3D1&f=geojson) |
| Parcel Lookup (attributes) | CLT_Ex MoreInfo Layer 4 | [CLTEx_MoreInfo/MapServer/4](https://gis.charlottenc.gov/arcgis/rest/services/CLT_Ex/CLTEx_MoreInfo/MapServer/4/query?where=1%3D1&outFields=*&outSR=4326&f=json) |
| Parcel Zoning Lookup | ODP Parcel Zoning Lookup | [Parcel_Zoning_Lookup/MapServer/0](https://gis.charlottenc.gov/arcgis/rest/services/ODP/Parcel_Zoning_Lookup/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json) |
| Basemap tiles | Stadia Maps Alidade Smooth | `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png` |
| Address geocoding (primary) | Nominatim (OpenStreetMap) | [Nominatim Search API](https://nominatim.openstreetmap.org/search) with structured query |
| Address geocoding (fallback) | Charlotte MasterAddress | [GeocodeServer/findAddressCandidates](https://gis.charlottenc.gov/arcgis/rest/services/LOC/MasterAddress/GeocodeServer/findAddressCandidates) |
| Buildings (commented out) | OpenStreetMap Overpass API | [Overpass API](https://overpass-api.de/api/interpreter) - Code preserved for future development |

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
  main.js              # Application entry point, search, and UI setup
  map.js               # Map initialization and layer orchestration
  layers/
    parcels.js         # Parcel geometry, hover effects, and detail fetching
    buildings.js       # Building layer (commented out, preserved for future use)
  utils/
    geocode.js         # Address geocoding with Nominatim + Charlotte fallback
    overpass.js        # Overpass API helper (for buildings layer)
    debounce.js        # Debounce utility for map events
index.html             # Main HTML with search UI and layer toggles
public/style.css       # Styles for map, UI panels, and parcel details modal
.github/workflows/     # GitHub Actions deployment to Pages
```

## Deployment
- Static bundle produced by Vite (`dist/`).
- GitHub Actions workflow `.github/workflows/deploy.yml` publishes to GitHub Pages on pushes to `main`.

## Notes
- Parcels load dynamically starting at zoom level 16
- Building layer is commented out in code for performance; uncomment in `src/map.js` to enable
- Nominatim geocoding includes User-Agent header and respects usage policies
- All APIs are public but subject to rate limits and usage policies

## Buildings
The buildings layer (`src/layers/buildings.js`) is fully implemented but commented out for now.. To re-enable:
1. Uncomment `addBuildingsLayer(map)` in `src/map.js` line 68
2. Uncomment `updateBuildings(map)` in `src/map.js` line 60
3. Uncomment buildings toggle code in `src/main.js` lines 60-71
4. Add buildings toggle back to `index.html`

## Attribution
Data © City of Charlotte & Mecklenburg County GIS · Basemap © Stadia Maps © OpenStreetMap contributors · Geocoding via Nominatim · Zoning per Charlotte UDO · Map by Adam Vosburgh

## Usage 

Open Source with MIT License (free use with attribution)
