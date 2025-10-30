/**
 * Parcel layer handling
 */

let currentlyHoveredId = null;

/**
 * Add parcel source and layer to map
 * @param {Object} map - MapLibre GL map instance
 * @param {Function} onZoningFetch - Callback for zoning data
 */
export function addParcelLayer(map, onZoningFetch) {
  // Add source with a valid but minimal feature to ensure it's properly initialized
  map.addSource('parcels', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { PID: 'placeholder' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-80.8, 35.2], [-80.8, 35.3], [-80.7, 35.3], [-80.7, 35.2], [-80.8, 35.2]
          ]]
        }
      }]
    }
  });

  // Add fill layer for interactivity (must be before outline for proper rendering)
  map.addLayer({
    id: 'parcels-fill',
    type: 'fill',
    source: 'parcels',
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': 0.1  // Slightly visible so we can see the parcels
    }
  });

  // Add parcel outline layer on top
  map.addLayer({
    id: 'parcels',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': '#999999',
      'line-width': 1.5,
      'line-opacity': 0.8
    }
  });

  // Setup hover interactions
  map.on('mousemove', 'parcels-fill', (e) => {
    if (e.features.length === 0) return;

    const feature = e.features[0];
    const featureId = feature.properties.PID;

    // Update hover state
    if (currentlyHoveredId !== featureId) {
      currentlyHoveredId = featureId;
      map.getCanvas().style.cursor = 'pointer';

      // Fetch zoning info and show tooltip
      if (onZoningFetch) {
        onZoningFetch(featureId, e.lngLat, feature.properties);
      }
    }
  });

  map.on('mouseleave', 'parcels-fill', () => {
    currentlyHoveredId = null;
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Update parcel data based on map view
 * @param {Object} map - MapLibre GL map instance
 */
export async function updateParcels(map) {
  const zoom = map.getZoom();
  console.log('updateParcels called, zoom:', zoom);

  if (zoom < 16) {
    // Clear parcels if zoomed out
    console.log('Zoom too low, clearing parcels');
    map.getSource('parcels').setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  try {
    // Fetch parcels within current viewport using bbox
    const bounds = map.getBounds();
    const bbox = {
      xmin: bounds.getWest(),
      ymin: bounds.getSouth(),
      xmax: bounds.getEast(),
      ymax: bounds.getNorth()
    };

    console.log('Fetching parcels from API with bbox:', bbox);

    const params = new URLSearchParams({
      where: '1=1',
      geometry: JSON.stringify(bbox),
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'PID',
      f: 'json',
      returnGeometry: 'true'
    });

    const url = `https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query?${params}`;
    console.log('Parcel API URL (bbox):', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response received:', {
      hasFeatures: !!data.features,
      featuresCount: data.features?.length,
      hasError: !!data.error,
      exceededTransferLimit: data.exceededTransferLimit
    });

    if (data.error) {
      console.error('API error:', data.error);
      return;
    }

    // Convert ArcGIS JSON to GeoJSON and transform from Web Mercator to WGS84
    const geojson = arcgisToGeoJSON(data);
    console.log('Converted to GeoJSON, features:', geojson.features.length);

    if (geojson.features.length > 0) {
      console.log('Sample feature:', JSON.stringify(geojson.features[0], null, 2).substring(0, 200));
    }

    const parcelSource = map.getSource('parcels');
    console.log('Parcel source exists:', !!parcelSource);

    if (!parcelSource) {
      console.error('Parcel source not found! Sources:', Object.keys(map.getStyle().sources || {}));
      return;
    }

    // Validate GeoJSON before setting - log the full first feature
    const firstFeature = geojson.features[0];
    console.log('GeoJSON validation:', {
      type: geojson.type,
      features: geojson.features.length,
      firstFeatureType: firstFeature?.geometry.type,
      firstFeatureCoords: firstFeature?.geometry.coordinates.length,
      firstCoordPair: JSON.stringify(firstFeature?.geometry.coordinates[0]?.[0])
    });
    console.log('FULL FIRST FEATURE:', JSON.stringify(firstFeature));

    try {
      parcelSource.setData(geojson);
      console.log('Parcel data set on map - SUCCESS');
    } catch (err) {
      console.error('ERROR setting parcel data:', err);
    }

    // Debug: Check if layers are actually rendering features
    setTimeout(() => {
      try {
        const sourceFeatures = map.querySourceFeatures('parcels');
        console.log('Features from SOURCE:', sourceFeatures.length);

        const renderedFeatures = map.queryRenderedFeatures({ layers: ['parcels', 'parcels-fill'] });
        console.log('Features RENDERED:', renderedFeatures.length);

        if (sourceFeatures.length > 0) {
          const f = sourceFeatures[0];
          console.log('First SOURCE feature:', {
            id: f.id,
            pid: f.properties?.PID,
            geomType: f.geometry?.type,
            coordsStructure: Array.isArray(f.geometry?.coordinates) ? `Array[${f.geometry.coordinates.length}]` : 'Not array'
          });
        }

        // Also check if layers exist
        const parcelLines = map.getLayer('parcels');
        const parcelFill = map.getLayer('parcels-fill');
        console.log('Layers exist - parcels line:', !!parcelLines, 'parcels-fill:', !!parcelFill);

        // Check style
        const style = map.getStyle();
        console.log('Style sources:', Object.keys(style.sources || {}));
        console.log('Style layers:', style.layers?.map(l => l.id).filter(id => id.includes('parcel')));
      } catch (e) {
        console.error('Error querying features:', e);
      }
    }, 200);
  } catch (error) {
    console.error('Error fetching parcels:', error);
  }
}

/**
 * Convert ArcGIS JSON response to GeoJSON
 * Handles Web Mercator (EPSG:3857) to WGS84 (EPSG:4326) conversion
 */
function arcgisToGeoJSON(arcgisData) {
  const features = [];

  if (!arcgisData.features || !Array.isArray(arcgisData.features)) {
    console.warn('No features array in ArcGIS data');
    return { type: 'FeatureCollection', features: [] };
  }

  console.log('Processing', arcgisData.features.length, 'features');

  arcgisData.features.forEach((feature, idx) => {
    try {
      if (!feature.geometry) {
        console.warn(`Feature ${idx} has no geometry`);
        return;
      }

      const { geometry, attributes } = feature;

      if (!geometry.rings || !Array.isArray(geometry.rings)) {
        console.warn(`Feature ${idx} geometry has no rings or rings is not an array`);
        return;
      }

      // Convert rings from Web Mercator to WGS84
      const coordinates = geometry.rings.map(ring => {
        return ring.map(([x, y]) => {
          // Web Mercator to WGS84 conversion
          const lon = (x / 20037508.34) * 180;
          const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 2 - Math.PI / 2) * (180 / Math.PI);
          return [lon, lat];
        });
      });

      features.push({
        type: 'Feature',
        properties: attributes || { PID: `feature_${idx}` },
        geometry: {
          type: 'Polygon',
          coordinates: coordinates
        }
      });
    } catch (error) {
      console.error(`Error processing feature ${idx}:`, error);
    }
  });

  console.log('Successfully converted', features.length, 'features to GeoJSON');

  return {
    type: 'FeatureCollection',
    features
  };
}
