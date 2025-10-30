/**
 * Proxy fetch utility
 * Routes requests through local proxy endpoints if available,
 * otherwise fetches directly from source APIs
 */

const USE_PROXY = import.meta.env.VITE_USE_PROXY === 'true';

/**
 * Fetch parcel data (with optional proxy)
 * @param {Object} params - URL search parameters
 * @returns {Promise<Object>} GeoJSON response
 */
export async function fetchParcels(params) {
  if (USE_PROXY) {
    return fetch(`/api/parcels?${new URLSearchParams(params)}`).then(r => r.json());
  }

  const url = new URL('https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return fetch(url).then(r => r.json());
}

/**
 * Fetch zoning data for a parcel (with optional proxy)
 * @param {Object} params - URL search parameters
 * @returns {Promise<Object>} GeoJSON response
 */
export async function fetchZoning(params) {
  if (USE_PROXY) {
    return fetch(`/api/zoning?${new URLSearchParams(params)}`).then(r => r.json());
  }

  const url = new URL('https://data.charlottenc.gov/datasets/charlotte::parcel-zoning-lookup/FeatureServer/0/query');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return fetch(url).then(r => r.json());
}

/**
 * Fetch from Overpass API (with optional proxy)
 * @param {string} query - Overpass QL query
 * @returns {Promise<Object>} OSM data
 */
export async function fetchOverpass(query) {
  if (USE_PROXY) {
    return fetch('/api/overpass', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(r => r.json());
  }

  return fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }).then(r => r.json());
}
