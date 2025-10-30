/**
 * Fetch buildings or streets from Overpass API within a bounding box
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/**
 * Build an Overpass QL query for a feature type within a bbox
 * @param {string} featureType - 'building' or 'highway'
 * @param {Array} bbox - [minLon, minLat, maxLon, maxLat]
 * @returns {string} Overpass QL query
 */
function buildOverpassQuery(featureType, bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const key = featureType === 'building' ? 'building' : 'highway';

  return `[out:json][timeout:25];(way["${key}"](${minLat},${minLon},${maxLat},${maxLon});relation["${key}"](${minLat},${minLon},${maxLat},${maxLon}););out body;>;out skel qt;`;
}

/**
 * Fetch features from Overpass API
 * @param {string} featureType - 'building' or 'highway'
 * @param {Array} bbox - [minLon, minLat, maxLon, maxLat]
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function fetchOverpassData(featureType, bbox) {
  try {
    const query = buildOverpassQuery(featureType, bbox);
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return osmToGeoJSON(data);
  } catch (error) {
    console.error(`Error fetching ${featureType} data from Overpass:`, error);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Simple conversion of OSM data to GeoJSON
 * @param {Object} osmData - Data from Overpass API
 * @returns {Object} GeoJSON FeatureCollection
 */
function osmToGeoJSON(osmData) {
  const features = [];
  const nodes = new Map();

  // Index nodes by id
  if (osmData.elements) {
    osmData.elements.forEach(elem => {
      if (elem.type === 'node') {
        nodes.set(elem.id, elem);
      }
    });

    // Convert ways to features
    osmData.elements.forEach(elem => {
      if (elem.type === 'way' && elem.nodes && elem.nodes.length > 1) {
        const coordinates = elem.nodes
          .map(nodeId => {
            const node = nodes.get(nodeId);
            return node ? [node.lon, node.lat] : null;
          })
          .filter(coord => coord !== null);

        if (coordinates.length > 1) {
          const tags = elem.tags || {};

          // Determine geometry type - if it's a closed way (building, etc), use Polygon
          const isClosedWay = coordinates.length > 2 &&
            coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
            coordinates[0][1] === coordinates[coordinates.length - 1][1];

          const isBuildingOrArea = tags.building || tags.area === 'yes' || tags.amenity;

          const geometryType = (isClosedWay && isBuildingOrArea) ? 'Polygon' : 'LineString';
          const geomCoordinates = geometryType === 'Polygon' ? [coordinates] : coordinates;

          features.push({
            type: 'Feature',
            geometry: {
              type: geometryType,
              coordinates: geomCoordinates
            },
            properties: tags
          });
        }
      }
    });
  }

  return { type: 'FeatureCollection', features };
}
