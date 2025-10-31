/**
 * Map initialization and management
 */

import maplibregl from 'maplibre-gl';
import { addParcelLayer, updateParcels } from './layers/parcels.js';
import { addBuildingsLayer, updateBuildings } from './layers/buildings.js';
import { debounce } from './utils/debounce.js';

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
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          maxzoom: 19,
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
    minZoom: 10,
    maxZoom: 19
  });

  return map;
}

/**
 * Setup all layers on the map
 * @param {Object} map - MapLibre GL map instance
 */
export function setupLayers(map) {
  const debouncedUpdateLayers = debounce(() => {
    updateParcels(map);
    updateBuildings(map);
  }, 500);

  const onStyleLoad = () => {
    try {
      console.log('=== STYLE LOADED, ADDING LAYERS ===');
      addParcelLayer(map, window.handleParcelClick);
      console.log('=== PARCEL LAYER ADDED ===');
      addBuildingsLayer(map);
      console.log('=== BUILDINGS LAYER ADDED ===');

      // Only attach event handlers AFTER sources are added
      map.on('move', debouncedUpdateLayers);
      map.on('moveend', debouncedUpdateLayers);
      console.log('=== EVENT HANDLERS ATTACHED ===');
    } catch (error) {
      console.error('Error adding layers:', error);
    }
  };

  console.log('=== CHECKING STYLE LOADED ===', map.isStyleLoaded());

  // Listen for errors
  map.on('error', (e) => {
    console.error('=== MAP ERROR ===', e);
  });

  if (map.isStyleLoaded()) {
    console.log('=== STYLE ALREADY LOADED, CALLING onStyleLoad ===');
    onStyleLoad();
  } else {
    console.log('=== WAITING FOR STYLE LOAD EVENT ===');
    map.once('style.load', () => {
      console.log('=== STYLE.LOAD EVENT FIRED ===');
      onStyleLoad();
    });

    // Fallback: check again after map is loaded
    map.on('load', () => {
      console.log('=== MAP LOAD EVENT FIRED ===');
      if (!map.getSource('parcels')) {
        console.log('=== PARCELS SOURCE NOT FOUND, CALLING onStyleLoad ===');
        onStyleLoad();
      }
    });
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
