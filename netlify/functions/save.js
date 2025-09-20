export default async (req) => {
  const { blobs } = await import('@netlify/blobs');
  const store = blobs();
  const KEY = 'journal-data.json';

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    await store.set(KEY, JSON.stringify(body), {
      contentType: 'application/json',
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = (await store.get(KEY, { type: 'json' })) || {
    accounts: [],
    trades: [],
    news: [],
  };

  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
