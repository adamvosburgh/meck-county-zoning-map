/**
 * Map initialization and management
 */

import maplibregl from 'maplibre-gl';
import { addParcelLayer, updateParcels } from './layers/parcels.js';
import { addBuildingsLayer, updateBuildings } from './layers/buildings.js';
import { fetchZoningForParcel, displayZoningTooltip, hideZoningTooltip } from './layers/zoning.js';
import { debounce } from './utils/debounce.js';

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
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
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
  const handleParcelHoverFn = (pid, lngLat) => handleParcelHover(pid, lngLat, tooltipEl, map);

  // Debounced layer update to prevent excessive API calls
  const debouncedUpdateLayers = debounce(() => {
    console.log('Updating layers (debounced)');
    updateParcels(map);
    updateBuildings(map);
  }, 500);

  // Wait for style to load before adding sources and layers
  const onStyleLoad = () => {
    console.log('Style loaded, adding sources and layers');
    try {
      addParcelLayer(map, handleParcelHoverFn);
      addBuildingsLayer(map);

      // Initial update of layers
      debouncedUpdateLayers();
    } catch (error) {
      console.error('Error adding layers:', error);
    }
  };

  if (map.isStyleLoaded()) {
    console.log('Map style already loaded, adding layers immediately');
    onStyleLoad();
  } else {
    console.log('Waiting for style to load');
    map.once('style.load', onStyleLoad);
  }

  // Update layers on every map move/zoom (debounced to prevent excessive API calls)
  map.on('move', debouncedUpdateLayers);
  map.on('moveend', debouncedUpdateLayers);

  // Hide tooltip when mouse leaves map
  map.getContainer().addEventListener('mouseleave', () => {
    hideZoningTooltip(tooltipEl);
  });
}

/**
 * Handle parcel hover to fetch and display zoning info
 * @param {string} pid - Parcel ID
 * @param {Object} lngLat - { lng, lat }
 * @param {Object} parcelProperties - Parcel properties from the feature
 * @param {HTMLElement} tooltipEl - Tooltip element
 * @param {Object} map - Map instance
 */
async function handleParcelHover(pid, lngLat, parcelProperties, tooltipEl, map) {
  // Display parcel info immediately while fetching zoning
  displayParcelTooltip(pid, parcelProperties, lngLat, tooltipEl, map);
}

/**
 * Display parcel information in tooltip
 * @param {string} pid - Parcel ID
 * @param {Object} parcelProperties - Parcel properties
 * @param {Object} lngLat - { lng, lat }
 * @param {HTMLElement} tooltipEl - Tooltip element
 * @param {Object} map - Map instance
 */
function displayParcelTooltip(pid, parcelProperties, lngLat, tooltipEl, map) {
  if (!tooltipEl) return;

  const html = `
    <div class="tooltip-row">
      <span class="tooltip-label">Parcel ID:</span>
      <span class="tooltip-value">${pid || 'N/A'}</span>
    </div>
  `;

  tooltipEl.innerHTML = html;

  // Position tooltip near cursor
  if (map) {
    const point = map.project(lngLat);
    tooltipEl.style.left = (point.x + 10) + 'px';
    tooltipEl.style.top = (point.y - 10) + 'px';
  }

  tooltipEl.style.display = 'block';
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
