/**
 * Main application entry point
 */

import { initializeMap, setupLayers, panToLocation } from './map.js';
import { geocodeAddress } from './utils/geocode.js';

/**
 * Initialize the application
 */
async function init() {
  const map = initializeMap();

  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // Setup parcel details panel FIRST so handler is available
  await setupParcelDetailsPanel();

  // Then setup layers which will use the handler
  setupLayers(map);
  setupSearch(map, searchInput, searchBtn);
  setupLayerToggles(map);
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

/**
 * Setup parcel details panel
 */
async function setupParcelDetailsPanel() {
  const { fetchParcelDetails } = await import('./layers/parcels.js');

  // Create panel element
  const panel = document.createElement('div');
  panel.id = 'parcel-details-panel';
  panel.className = 'parcel-details-panel hidden';
  panel.innerHTML = `
    <div class="panel-header">
      <h3>Parcel Details</h3>
      <button class="close-btn">&times;</button>
    </div>
    <div class="panel-content"></div>
  `;
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector('.close-btn');
  const panelContent = panel.querySelector('.panel-content');

  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  // Expose handler globally for parcel layer
  window.handleParcelClick = async (pid, properties) => {
    panel.classList.remove('hidden');
    panelContent.innerHTML = '<div class="loading">Loading parcel details...</div>';

    const details = await fetchParcelDetails(pid);
    const allData = { ...properties, ...details };

    let html = '<div class="details-grid">';
    for (const [key, value] of Object.entries(allData)) {
      if (value !== null && value !== undefined && value !== '') {
        html += `
          <div class="detail-row">
            <span class="detail-label">${key}:</span>
            <span class="detail-value">${value}</span>
          </div>
        `;
      }
    }
    html += '</div>';

    panelContent.innerHTML = html;
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
