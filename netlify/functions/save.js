// netlify/functions/save.js
// Cloud sync for Aryan Trading Journal using Netlify Blobs.
// GET  -> returns {accounts, trades, news}
// POST -> saves {accounts, trades, news} (optionally protected by AJ_SECRET)

export default async (request, context) => {
  // A named blob “store” for your app
  const store = context.blobs?.store("aryan-journal") // you can rename if you like
  const SECRET = process.env.AJ_SECRET || ""          // optional write protection

  // Small helper to send JSON
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    })

  try {
    if (request.method === "GET") {
      const raw = await store.get("data")               // string or null
      const data = raw ? JSON.parse(raw) : { accounts: [], trades: [], news: [] }
      return json(data)
    }

    if (request.method === "POST") {
      if (SECRET && request.headers.get("x-aj-key") !== SECRET) {
        return json({ ok: false, error: "Unauthorized" }, 401)
      }
      const body = await request.json().catch(() => null)
      if (!body || typeof body !== "object") {
        return json({ ok: false, error: "Bad JSON" }, 400)
      }
      // Very light validation: ensure the three arrays exist
      const payload = {
        accounts: Array.isArray(body.accounts) ? body.accounts : [],
        trades: Array.isArray(body.trades) ? body.trades : [],
        news: Array.isArray(body.news) ? body.news : [],
      }
      await store.set("data", JSON.stringify(payload))
      return json({ ok: true })
    }

    return json({ ok: false, error: "Method not allowed" }, 405)
  } catch (err) {
    console.error("save function error:", err)
    return json({ ok: false, error: "Server error" }, 500)
  }
}
