/**
 * Main application entry point
 */

import { initializeMap, setupLayers, panToLocation } from './map.js';
import { geocodeAddress } from './utils/geocode.js';

/**
 * Initialize the application
 */
async function init() {
  // Initialize map
  const map = initializeMap();

  // Get DOM elements
  const tooltipEl = document.getElementById('tooltip');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // Setup layers
  setupLayers(map, tooltipEl);

  // Setup search functionality
  setupSearch(map, searchInput, searchBtn);

  // Setup layer toggles for debugging
  setupLayerToggles(map);

  console.log('Mecklenburg County Zoning Map initialized');
}

/**
 * Setup layer toggle controls
 * @param {Object} map - Map instance
 */
function setupLayerToggles(map) {
  const toggleBasemap = document.getElementById('toggle-basemap');
  const toggleParcels = document.getElementById('toggle-parcels');
  const toggleStreets = document.getElementById('toggle-streets');
  const toggleBuildings = document.getElementById('toggle-buildings');

  // Wait for map to be ready before setting up toggles
  const setupToggles = () => {
    toggleBasemap.addEventListener('change', (e) => {
      const visibility = e.target.checked ? 'visible' : 'none';
      if (map.getLayer('osm-tiles')) {
        map.setLayoutProperty('osm-tiles', 'visibility', visibility);
      }
    });

    toggleParcels.addEventListener('change', (e) => {
      const visibility = e.target.checked ? 'visible' : 'none';
      if (map.getLayer('parcels')) {
        map.setLayoutProperty('parcels', 'visibility', visibility);
      }
      if (map.getLayer('parcels-fill')) {
        map.setLayoutProperty('parcels-fill', 'visibility', visibility);
      }
    });

    toggleStreets.addEventListener('change', (e) => {
      const visibility = e.target.checked ? 'visible' : 'none';
      if (map.getLayer('streets')) {
        map.setLayoutProperty('streets', 'visibility', visibility);
      }
    });

    toggleBuildings.addEventListener('change', (e) => {
      const visibility = e.target.checked ? 'visible' : 'none';
      if (map.getLayer('buildings')) {
        map.setLayoutProperty('buildings', 'visibility', visibility);
      }
      if (map.getLayer('buildings-outline')) {
        map.setLayoutProperty('buildings-outline', 'visibility', visibility);
      }
    });
  };

  if (map.isStyleLoaded()) {
    setupToggles();
  } else {
    map.once('style.load', setupToggles);
  }
}

/**
 * Setup address search functionality
 * @param {Object} map - Map instance
 * @param {HTMLElement} searchInput - Search input element
 * @param {HTMLElement} searchBtn - Search button element
 */
function setupSearch(map, searchInput, searchBtn) {
  const performSearch = async () => {
    const address = searchInput.value.trim();
    if (!address) return;

    try {
      const result = await geocodeAddress(address);

      if (result) {
        panToLocation(map, result.latitude, result.longitude, 16);
        console.log(`Geocoded to: ${result.label} (${result.source})`);
      } else {
        alert('Address not found. Please try another search.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching address. Please try again.');
    }
  };

  // Search on button click
  searchBtn.addEventListener('click', performSearch);

  // Search on Enter key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Clear search on input focus
  searchInput.addEventListener('focus', () => {
    searchInput.value = '';
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
