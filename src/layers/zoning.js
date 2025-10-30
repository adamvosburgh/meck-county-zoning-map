/**
 * Zoning layer and tooltip handling
 */

/**
 * Fetch zoning information for a parcel
 * @param {string} pid - Parcel ID
 * @returns {Promise<Object|null>} Zoning data or null
 */
export async function fetchZoningForParcel(pid) {
  try {
    const params = new URLSearchParams({
      where: `PID='${pid}'`,
      outFields: 'PID,SITE_ADDRESS,ZONING,ZONING_DESC',
      f: 'json'
    });

    const response = await fetch(
      `https://data.charlottenc.gov/datasets/charlotte::parcel-zoning-lookup/FeatureServer/0/query?${params}`
    );

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].attributes;
    }

    return null;
  } catch (error) {
    console.error('Error fetching zoning data:', error);
    return null;
  }
}

/**
 * Display zoning tooltip
 * @param {Object} zoningData - Zoning attributes
 * @param {Object} lngLat - { lng, lat } coordinates
 * @param {HTMLElement} tooltipEl - Tooltip DOM element
 */
export function displayZoningTooltip(zoningData, lngLat, tooltipEl, map) {
  if (!zoningData || !tooltipEl) return;

  const html = `
    <div class="tooltip-row">
      <span class="tooltip-label">Parcel ID:</span>
      <span class="tooltip-value">${zoningData.PID || 'N/A'}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Address:</span>
      <span class="tooltip-value">${zoningData.SITE_ADDRESS || 'N/A'}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Zoning:</span>
      <span class="tooltip-value">${zoningData.ZONING || 'N/A'}</span>
    </div>
    ${zoningData.ZONING_DESC ? `
    <div class="tooltip-row">
      <span class="tooltip-label">Description:</span>
      <span class="tooltip-value">${zoningData.ZONING_DESC}</span>
    </div>
    ` : ''}
  `;

  tooltipEl.innerHTML = html;

  // Position tooltip near cursor
  if (map) {
    const point = map.project(lngLat);
    tooltipEl.style.left = (point.x + 10) + 'px';
    tooltipEl.style.top = (point.y - 10) + 'px';
  }

  tooltipEl.style.display = 'block';
}

/**
 * Hide zoning tooltip
 * @param {HTMLElement} tooltipEl - Tooltip DOM element
 */
export function hideZoningTooltip(tooltipEl) {
  if (tooltipEl) {
    tooltipEl.style.display = 'none';
  }
}
