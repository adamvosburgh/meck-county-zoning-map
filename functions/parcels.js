/**
 * Proxy function for Mecklenburg County Parcels API
 * Deploy to: Cloudflare Pages Functions or Netlify Functions
 */

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const bbox = url.searchParams.get('bbox');

  if (!bbox) {
    return new Response('Missing bbox parameter', { status: 400 });
  }

  try {
    const geometry = JSON.parse(bbox);

    const upstreamUrl = new URL(
      'https://gis.charlottenc.gov/arcgis/rest/services/CountyData/Parcels/MapServer/0/query'
    );

    upstreamUrl.searchParams.set('where', '1=1');
    upstreamUrl.searchParams.set('geometry', JSON.stringify(geometry));
    upstreamUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
    upstreamUrl.searchParams.set('inSR', '4326');
    upstreamUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    upstreamUrl.searchParams.set('outFields', '*');
    upstreamUrl.searchParams.set('outSR', '4326');
    upstreamUrl.searchParams.set('f', 'geojson');

    const response = await fetch(upstreamUrl.toString());
    const data = await response.text();

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Parcels proxy error:', error);
    return new Response('Upstream error', { status: 502 });
  }
}
