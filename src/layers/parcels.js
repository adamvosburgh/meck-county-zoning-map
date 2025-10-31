/**
 * Parcel layer handling
 */

const MIN_PARCEL_ZOOM = 16;

/**
 * Add parcel source and layer to map
 * @param {Object} map - MapLibre GL map instance
 * @param {Function} onParcelClick - Callback for parcel click with full data
 */
export function addParcelLayer(map, onParcelClick) {
  map.addSource('parcels', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addLayer({
    id: 'parcels-fill',
    type: 'fill',
    source: 'parcels',
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': 0.1
    }
  });

  map.addLayer({
    id: 'parcels',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#0066ff',
        '#999999'
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        2.5,
        1.5
      ],
      'line-opacity': 0.8
    }
  });

  let hoveredStateId = null;

  map.on('mousemove', 'parcels-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    if (e.features.length > 0) {
      if (hoveredStateId !== null) {
        map.setFeatureState(
          { source: 'parcels', id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = e.features[0].id;
      map.setFeatureState(
        { source: 'parcels', id: hoveredStateId },
        { hover: true }
      );
    }
  });

  map.on('mouseleave', 'parcels-fill', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredStateId !== null) {
      map.setFeatureState(
        { source: 'parcels', id: hoveredStateId },
        { hover: false }
      );
    }
    hoveredStateId = null;
  });

  map.on('click', 'parcels-fill', async (e) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const pid = feature.properties.PID;

      if (pid && onParcelClick) {
        await onParcelClick(pid, feature.properties);
      }
    }
  });
}

/**
 * Update parcel data based on map view
 * @param {Object} map - MapLibre GL map instance
 */
export async function updateParcels(map) {
  const zoom = map.getZoom();
  if (zoom < MIN_PARCEL_ZOOM) {
    map.getSource('parcels').setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  try {
    const bounds = map.getBounds();
    const geometry = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ].join(',');

    const params = new URLSearchParams({
      where: '1=1',
      geometry,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      geometryPrecision: '6',
      outFields: '*',
      f: 'geojson'
    });

    const url = `https://gis.charlottenc.gov/arcgis/rest/services/CLT_Ex/CLTEx_PopUps/MapServer/3/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('Parcel API error:', data.error);
      return;
    }

    const geojson = normalizeGeoJSON(data);
    const parcelSource = map.getSource('parcels');

    if (!parcelSource) {
      console.error('Parcel source not found');
      return;
    }

    parcelSource.setData(geojson);
  } catch (error) {
    console.error('Error fetching parcels:', error);
  }
}

/**
 * Fetch detailed parcel and zoning lookup data for a specific PID
 * @param {string} pid - Parcel ID
 * @returns {Object} - Combined parcel and zoning data
 */
export async function fetchParcelDetails(pid) {
  try {
    const [lookupResponse, zoningResponse] = await Promise.all([
      fetch(`https://gis.charlottenc.gov/arcgis/rest/services/CLT_Ex/CLTEx_MoreInfo/MapServer/4/query?where=PID='${pid}'&outFields=*&f=json`),
      fetch(`https://gis.charlottenc.gov/arcgis/rest/services/ODP/Parcel_Zoning_Lookup/MapServer/0/query?where=PID='${pid}'&outFields=*&f=json`)
    ]);

    const [lookupData, zoningData] = await Promise.all([
      lookupResponse.json(),
      zoningResponse.json()
    ]);

    const lookup = lookupData.features?.[0]?.attributes || {};
    const zoning = zoningData.features?.[0]?.attributes || {};

    return { ...lookup, ...zoning };
  } catch (error) {
    console.error('Error fetching parcel details:', error);
    return {};
  }
}

/**
 * Normalize GeoJSON response
 */
function normalizeGeoJSON(data) {
  if (data.type === 'FeatureCollection') {
    return data;
  }

  if (!data.features || !Array.isArray(data.features)) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features = data.features.map((feature, idx) => {
    const geometry = feature.geometry;
    if (!geometry) return null;

    return {
      type: 'Feature',
      id: idx,
      properties: feature.properties || feature.attributes || {},
      geometry
    };
  }).filter(Boolean);

  return { type: 'FeatureCollection', features };
}
