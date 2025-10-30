/**
 * Address geocoding utilities
 * Primary: Charlotte MasterAddress GeocodeServer
 * Fallback: Nominatim (OpenStreetMap)
 */

const CHARLOTTE_GEOCODER = 'https://maps.charlottenc.gov/arcgis/rest/services/LOC/MasterAddress/GeocodeServer/findAddressCandidates';
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

/**
 * Geocode an address using Charlotte's MasterAddress service with Nominatim fallback
 * @param {string} address - Address string to geocode
 * @returns {Promise<Object>} { latitude, longitude, label } or null if not found
 */
export async function geocodeAddress(address) {
  try {
    // Try Charlotte MasterAddress first
    const charlotteResult = await geocodeCharlotte(address);
    if (charlotteResult) {
      return charlotteResult;
    }

    // Fallback to Nominatim
    console.log('Charlotte geocoder found no results, trying Nominatim...');
    return await geocodeNominatim(address);
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode using Charlotte MasterAddress GeocodeServer
 * @param {string} address
 * @returns {Promise<Object|null>}
 */
async function geocodeCharlotte(address) {
  const params = new URLSearchParams({
    SingleLine: address,
    f: 'json'
  });

  try {
    const response = await fetch(`${CHARLOTTE_GEOCODER}?${params}`);
    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      return {
        latitude: candidate.location.y,
        longitude: candidate.location.x,
        label: candidate.address || address,
        source: 'Charlotte'
      };
    }
    return null;
  } catch (error) {
    console.error('Charlotte geocoder error:', error);
    return null;
  }
}

/**
 * Geocode using Nominatim (OpenStreetMap)
 * @param {string} address
 * @returns {Promise<Object|null>}
 */
async function geocodeNominatim(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: 1,
    viewbox: '-80.9,-35.3,-80.7,-35.1', // Mecklenburg County rough bounds
    bounded: 1
  });

  try {
    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        label: result.display_name || address,
        source: 'Nominatim'
      };
    }
    return null;
  } catch (error) {
    console.error('Nominatim geocoder error:', error);
    return null;
  }
}

/**
 * Reverse geocode (get address from coordinates)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string|null>} Address string or null
 */
export async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    format: 'json',
    lat: latitude,
    lon: longitude
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`
    );
    const data = await response.json();
    return data.address?.road || data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
