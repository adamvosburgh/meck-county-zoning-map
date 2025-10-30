/**
 * Parcel layer handling
 */

/**
 * Add parcel source and layer to map
 * @param {Object} map - MapLibre GL map instance
 */
export function addParcelLayer(map) {
  // Add empty source
  map.addSource('parcels', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  // Add parcel outline layer
  map.addLayer({
    id: 'parcels',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': '#999999',
      'line-width': 1,
      'line-opacity': 0.7
    }
  });

  // Add fill layer for hover effect
  map.addLayer({
    id: 'parcels-fill',
    type: 'fill',
    source: 'parcels',
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': 0
    }
  });

  // Layer for highlighted parcel
  map.addLayer({
    id: 'parcels-highlighted',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': '#4a90e2',
      'line-width': 2,
      'line-opacity': 1
    },
    filter: ['==', ['get', 'highlighted'], true]
  });
}

/**
 * Update parcel data based on map view
 * @param {Object} map - MapLibre GL map instance
 * @param {Function} onZoningFetch - Callback for zoning data
 */
export async function updateParcels(map, onZoningFetch) {
  const zoom = map.getZoom();
  if (zoom < 14) {
    // Clear parcels if zoomed out
    map.getSource('parcels').setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

  try {
    const params = new URLSearchParams({
      where: '1=1',
      geometry: JSON.stringify({
        xmin: bbox[0],
        ymin: bbox[1],
        xmax: bbox[2],
        ymax: bbox[3]
      }),
      geometryType: 'esriGeometryEnvelope',
      inSR: 4326,
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'PID,SITE_ADDRESS,OWNER_NAME',
      outSR: 4326,
      f: 'geojson'
    });

    const response = await fetch(
      `https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query?${params}`
    );

    const geojson = await response.json();
    map.getSource('parcels').setData(geojson);

    // Set up hover interactions
    setupParcelHover(map, onZoningFetch);
  } catch (error) {
    console.error('Error fetching parcels:', error);
  }
}

/**
 * Setup parcel hover interactions
 * @param {Object} map - MapLibre GL map instance
 * @param {Function} onZoningFetch - Callback for zoning data
 */
function setupParcelHover(map, onZoningFetch) {
  let hoveredFeature = null;

  map.off('mousemove', 'parcels-fill', onParcelHover);
  map.off('mouseleave', 'parcels-fill', onParcelLeave);

  map.on('mousemove', 'parcels-fill', onParcelHover);
  map.on('mouseleave', 'parcels-fill', onParcelLeave);

  function onParcelHover(e) {
    if (e.features.length === 0) return;

    const feature = e.features[0];

    // Clear previous highlight
    if (hoveredFeature) {
      hoveredFeature.properties.highlighted = false;
    }

    hoveredFeature = feature;
    hoveredFeature.properties.highlighted = true;

    // Fetch zoning info
    if (onZoningFetch && feature.properties.PID) {
      onZoningFetch(feature.properties.PID, e.lngLat);
    }
  }

  function onParcelLeave() {
    if (hoveredFeature) {
      hoveredFeature.properties.highlighted = false;
      hoveredFeature = null;
    }
  }
}
