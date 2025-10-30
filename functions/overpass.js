/**
 * Proxy function for Overpass API
 * Deploy to: Cloudflare Pages Functions or Netlify Functions
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export async function onRequestPost({ request }) {
  try {
    const body = await request.text();
    const query = new URLSearchParams(body).get('data');

    if (!query) {
      return new Response('Missing data parameter', { status: 400 });
    }

    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await response.text();

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Overpass proxy error:', error);
    return new Response('Upstream error', { status: 502 });
  }
}
