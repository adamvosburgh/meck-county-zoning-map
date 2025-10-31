/**
 * Address geocoding utilities
 * Primary: Nominatim (OpenStreetMap) with Mecklenburg County restriction
 * Fallback: Charlotte MasterAddress GeocodeServer
 */

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const CHARLOTTE_GEOCODER = 'https://gis.charlottenc.gov/arcgis/rest/services/LOC/MasterAddress/GeocodeServer/findAddressCandidates';

/**
 * Geocode an address using Nominatim with Charlotte fallback
 * @param {string} address - Address string to geocode
 * @returns {Promise<Object>} { latitude, longitude, label } or null if not found
 */
export async function geocodeAddress(address) {
  try {
    // Try Nominatim first (better fuzzy matching)
    const nominatimResult = await geocodeNominatim(address);
    if (nominatimResult) {
      return nominatimResult;
    }

    // Fallback to Charlotte MasterAddress
    console.log('Nominatim found no results, trying Charlotte geocoder...');
    return await geocodeCharlotte(address);
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
    outSR: '4326', // Request WGS84 lat/lng coordinates
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
 * Parse address string into components for structured Nominatim query
 * @param {string} address
 * @returns {Object} Address components
 */
function parseAddress(address) {
  const parts = {};

  // Extract house number and street
  const streetMatch = address.match(/^(\d+)\s+(.+?)(?:,|$)/i);
  if (streetMatch) {
    parts.street = `${streetMatch[1]} ${streetMatch[2].trim()}`;
  } else {
    parts.street = address.split(',')[0].trim();
  }

  // Extract city (default to Charlotte if not specified)
  if (address.match(/charlotte/i)) {
    parts.city = 'Charlotte';
  } else {
    parts.city = 'Charlotte'; // Default to Charlotte
  }

  // Extract state and zip
  if (address.match(/\bNC\b/i)) {
    parts.state = 'North Carolina';
  }

  const zipMatch = address.match(/\b(28\d{3})\b/);
  if (zipMatch) {
    parts.postalcode = zipMatch[1];
  }

  return parts;
}

/**
 * Geocode using Nominatim (OpenStreetMap) with structured query
 * @param {string} address
 * @returns {Promise<Object|null>}
 */
async function geocodeNominatim(address) {
  const addressParts = parseAddress(address);

  const params = new URLSearchParams({
    format: 'json',
    limit: 1,
    // Restrict to Mecklenburg County bounds
    viewbox: '-81.0,35.0,-80.5,35.5',
    bounded: '1',
    // Always add county and state for context
    county: 'Mecklenburg County',
    state: 'North Carolina',
    country: 'United States',
    ...addressParts
  });

  try {
    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`, {
      headers: {
        'User-Agent': 'MecklenburgZoningMap/1.0'
      }
    });
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
