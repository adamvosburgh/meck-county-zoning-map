# Mecklenburg County Zoning Webmap

An interactive MapLibre GL JS web application visualizing Mecklenburg County parcels, zoning information, buildings, and streets using live data from open APIs.

## Data Sources

| Data | Source | URL |
|------|--------|-----|
| Parcels | Mecklenburg County | [ArcGIS Feature Service](https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0) |
| Zoning | City of Charlotte | [ArcGIS Feature Server](https://data.charlottenc.gov/datasets/charlotte::parcel-zoning-lookup/FeatureServer/0) |
| Buildings | OpenStreetMap | [Overpass API](https://overpass-api.de/api/interpreter) |
| Streets | OpenStreetMap | [Overpass API](https://overpass-api.de/api/interpreter) |
| Address Search | Charlotte/OSM | MasterAddress GeocodeServer / Nominatim |
| Basemap Tiles | OpenStreetMap | [Tile Server](https://tile.openstreetmap.org) |

## Project Structure

```
meck-county-zoning-map/
├── public/
│   ├── index.html          # Main HTML file
│   └── style.css           # Styling
├── src/
│   ├── main.js             # Application entry point
│   ├── map.js              # Map initialization and management
│   ├── layers/
│   │   ├── parcels.js      # Parcel layer logic
│   │   ├── zoning.js       # Zoning tooltip logic
│   │   ├── buildings.js    # Buildings layer logic
│   │   └── streets.js      # Streets layer logic
│   └── utils/
│       ├── overpass.js     # Overpass API utilities
│       ├── geocode.js      # Geocoding utilities
│       └── proxyFetch.js   # Proxy layer utilities (optional)
├── functions/              # Optional serverless proxy functions
│   ├── parcels.js
│   ├── zoning.js
│   └── overpass.js
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions deployment
├── package.json
├── vite.config.js
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+ (20 recommended)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/adamvosburgh/meck-county-zoning-map.git
cd meck-county-zoning-map
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`

## Development

### Build for production:
```bash
npm run build
```

Output files will be in the `dist/` directory.

### Preview production build:
```bash
npm run preview
```

## Deployment

### GitHub Pages

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on push to `main`.

1. Ensure GitHub Pages is enabled in repository settings
2. Push changes to `main` branch
3. Workflow will automatically build and deploy

### Optional: Serverless Proxy Layer

For CORS handling, caching, and rate limiting, deploy the `functions/` directory to:

#### Cloudflare Pages
```bash
npm run proxy:dev  # Local development
wrangler pages deploy  # Production deploy
```

#### Netlify
Copy `functions/` to `netlify/functions/` and connect repository to Netlify.

## Usage

1. **Map Navigation**: Pan and zoom to explore Mecklenburg County
2. **Address Search**: Enter an address in the top-left search box to jump to a location
3. **Parcel Information**: Hover over parcels (when zoomed in enough) to see:
   - Parcel ID
   - Street Address
   - Zoning Code
   - Zoning Description

## API Integrations

All APIs are public and require no authentication. Rate limits:
- Mecklenburg County GIS: 1000 requests/10 minutes
- City of Charlotte FeatureServer: Generally unrestricted
- Overpass API: Public instance with usage policy
- Nominatim: 1 request/second

## Performance Notes

- Parcel data fetches only when zoomed to level 14 or higher
- Buildings layer loads at zoom 15+
- Streets layer loads at zoom 12+
- Overpass queries are optimized with bounding boxes
- Zoom-based layer loading prevents large data transfers at overview zoom levels

## Future Enhancements

- [ ] Zoning color symbology and legend
- [ ] Click-to-highlight parcels with detailed popup
- [ ] URL hash state preservation for sharing
- [ ] Vector tile pre-rendering for better performance
- [ ] Service Worker for offline caching
- [ ] Export parcel data (GeoJSON/CSV)
- [ ] Advanced filtering and search

## Attribution

- Data © 2025 City of Charlotte & Mecklenburg County GIS
- Basemap © OpenStreetMap contributors
- Building footprints & streets via OpenStreetMap / Overpass API
- Zoning data per Unified Development Ordinance (UDO)

## License

MIT
