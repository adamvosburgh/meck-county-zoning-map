/**
 * Streets layer handling
 */

import { fetchOverpassData } from '../utils/overpass.js';

/**
 * Add streets source and layer to map
 * @param {Object} map - MapLibre GL map instance
 */
export function addStreetsLayer(map) {
  map.addSource('streets', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addLayer({
    id: 'streets',
    type: 'line',
    source: 'streets',
    paint: {
      'line-color': '#555555',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 0.5,
        16, 1.5
      ],
      'line-opacity': 0.7
    }
  });
}

/**
 * Update streets data based on map view
 * @param {Object} map - MapLibre GL map instance
 */
export async function updateStreets(map) {
  const zoom = map.getZoom();
  if (zoom < 12) {
    // Clear streets if zoomed out
    map.getSource('streets').setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

  try {
    const geojson = await fetchOverpassData('highway', bbox);
    map.getSource('streets').setData(geojson);
  } catch (error) {
    console.error('Error fetching streets:', error);
  }
}
