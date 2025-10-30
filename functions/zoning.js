/**
 * Proxy function for Parcel Zoning Lookup API
 * Deploy to: Cloudflare Pages Functions or Netlify Functions
 */

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const pid = url.searchParams.get('pid');

  if (!pid) {
    return new Response('Missing pid parameter', { status: 400 });
  }

  try {
    const upstreamUrl = new URL(
      'https://data.charlottenc.gov/datasets/charlotte::parcel-zoning-lookup/FeatureServer/0/query'
    );

    upstreamUrl.searchParams.set('where', `PID='${pid}'`);
    upstreamUrl.searchParams.set('outFields', 'PID,SITE_ADDRESS,ZONING,ZONING_DESC');
    upstreamUrl.searchParams.set('f', 'json');

    const response = await fetch(upstreamUrl.toString());
    const data = await response.text();

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Zoning proxy error:', error);
    return new Response('Upstream error', { status: 502 });
  }
}
