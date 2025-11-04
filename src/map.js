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
        'carto-light': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© CARTO © OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'basemap-tiles',
          type: 'raster',
          source: 'carto-light'
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
    // Buildings layer commented out for performance - uncomment to enable
    // updateBuildings(map);
  }, 500);

  const onStyleLoad = () => {
    try {
      addParcelLayer(map, window.handleParcelClick);

      // Buildings layer commented out for performance - uncomment to enable
      // addBuildingsLayer(map);

      // Only attach event handlers AFTER sources are added
      map.on('move', debouncedUpdateLayers);
      map.on('moveend', debouncedUpdateLayers);
    } catch (error) {
      console.error('Error adding layers:', error);
    }
  };

  if (map.isStyleLoaded()) {
    onStyleLoad();
  } else {
    map.once('style.load', onStyleLoad);

    // Fallback: check again after map is loaded
    map.on('load', () => {
      if (!map.getSource('parcels')) {
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
