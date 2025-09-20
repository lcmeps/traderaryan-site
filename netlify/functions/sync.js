// netlify/functions/sync.js
import { getStore } from '@netlify/blobs';

const store = getStore('journal');        // blob store name (namespace)
const KEY   = 'aryan-data.json';          // single JSON doc

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-aj-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders });
  }

  // Optional shared secret: set AJ_SECRET in Netlify env and send same value via header 'x-aj-key'
  const secret = Deno.env.get('AJ_SECRET') || '';
  if (secret) {
    const client = req.headers.get('x-aj-key') || '';
    if (client !== secret) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }
  }

  try {
    if (req.method === 'GET') {
      const data = await store.get(KEY, { type: 'json' });
      return json({ ok: true, data: data || { accounts: [], trades: [], news: [] } });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const payload = {
        accounts: Array.isArray(body?.accounts) ? body.accounts : [],
        trades:   Array.isArray(body?.trades)   ? body.trades   : [],
        news:     Array.isArray(body?.news)     ? body.news     : [],
        savedAt:  new Date().toISOString(),
      };
      await store.set(KEY, JSON.stringify(payload), { contentType: 'application/json' });
      return json({ ok: true, savedAt: payload.savedAt });
    }

    return json({ ok: false, error: 'Method Not Allowed' }, 405);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
