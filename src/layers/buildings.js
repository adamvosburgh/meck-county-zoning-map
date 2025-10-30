/**
 * Buildings layer handling
 */

import { fetchOverpassData } from '../utils/overpass.js';

/**
 * Add buildings source and layer to map
 * @param {Object} map - MapLibre GL map instance
 */
export function addBuildingsLayer(map) {
  map.addSource('buildings', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addLayer({
    id: 'buildings',
    type: 'fill',
    source: 'buildings',
    paint: {
      'fill-color': '#f0f0f0',
      'fill-opacity': 0.6
    }
  });

  map.addLayer({
    id: 'buildings-outline',
    type: 'line',
    source: 'buildings',
    paint: {
      'line-color': '#cccccc',
      'line-width': 0.5
    }
  });
}

/**
 * Update buildings data based on map view
 * @param {Object} map - MapLibre GL map instance
 */
export async function updateBuildings(map) {
  const zoom = map.getZoom();
  if (zoom < 16) {
    // Clear buildings if zoomed out
    console.log('Buildings zoom too low, clearing');
    map.getSource('buildings').setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

  try {
    const geojson = await fetchOverpassData('building', bbox);
    map.getSource('buildings').setData(geojson);
  } catch (error) {
    console.error('Error fetching buildings:', error);
  }
}
