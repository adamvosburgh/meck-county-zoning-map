/**
 * Map initialization and management
 */

import maplibregl from 'maplibre-gl';
import { addParcelLayer, updateParcels } from './layers/parcels.js';
import { addBuildingsLayer, updateBuildings } from './layers/buildings.js';
import { addStreetsLayer, updateStreets } from './layers/streets.js';
import { fetchZoningForParcel, displayZoningTooltip, hideZoningTooltip } from './layers/zoning.js';

// Map constants
const MECK_CENTER = [35.2269, -80.8433];
const DEFAULT_ZOOM = 11;
const MIN_PARCEL_ZOOM = 14;
const MIN_BUILDING_ZOOM = 15;
const MIN_STREET_ZOOM = 12;

/**
 * Initialize the map
 * @returns {Object} map instance
 */
export function initializeMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'osm-raster': {
          type: 'raster',
          tiles: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-raster'
        }
      ]
    },
    center: [-80.8433, 35.2269], // [longitude, latitude]
    zoom: DEFAULT_ZOOM,
    minZoom: 10
  });

  return map;
}

/**
 * Setup all layers on the map
 * @param {Object} map - MapLibre GL map instance
 * @param {HTMLElement} tooltipEl - Tooltip element
 */
export function setupLayers(map, tooltipEl) {
  // Add layer sources and styles
  addParcelLayer(map);
  addBuildingsLayer(map);
  addStreetsLayer(map);

  // Setup layer updates on map move/zoom
  const updateAllLayers = () => {
    updateStreets(map);
    updateParcels(map, (pid, lngLat) => handleParcelHover(pid, lngLat, tooltipEl, map));
    updateBuildings(map);
  };

  map.on('load', updateAllLayers);
  map.on('move', updateAllLayers);
  map.on('moveend', updateAllLayers);

  // Hide tooltip when mouse leaves map
  map.getContainer().addEventListener('mouseleave', () => {
    hideZoningTooltip(tooltipEl);
  });
}

/**
 * Handle parcel hover to fetch and display zoning info
 * @param {string} pid - Parcel ID
 * @param {Object} lngLat - { lng, lat }
 * @param {HTMLElement} tooltipEl - Tooltip element
 * @param {Object} map - Map instance
 */
async function handleParcelHover(pid, lngLat, tooltipEl, map) {
  const zoningData = await fetchZoningForParcel(pid);
  if (zoningData) {
    displayZoningTooltip(zoningData, lngLat, tooltipEl, map);
  } else {
    hideZoningTooltip(tooltipEl);
  }
}

/**
 * Pan and zoom map to location
 * @param {Object} map - Map instance
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} zoom - Optional zoom level (default 16)
 */
export function panToLocation(map, latitude, longitude, zoom = 16) {
  map.flyTo({
    center: [longitude, latitude],
    zoom: zoom,
    duration: 1000
  });
}

export { MIN_PARCEL_ZOOM, MIN_BUILDING_ZOOM, MIN_STREET_ZOOM };
