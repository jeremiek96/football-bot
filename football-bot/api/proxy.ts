// api/proxy.ts
export default async function handler(req: any, res: any) {
  try {
    // chặn cache ở mọi tầng
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
    res.setHeader('CDN-Cache-Control', 'no-store')
    res.setHeader('Surrogate-Control', 'no-store')

    const provider = String(req.query.provider || '')
    const date = String(req.query.date || '')
    const debug = String(req.query.debug || '') === '1'
    if (!provider) return res.status(400).json({ error: 'missing provider' })

    let url = ''; const headers: Record<string,string> = { accept: 'application/json' }

    if (provider === 'football-data') {
      const token = process.env.FD_TOKEN || ''
      if (!token) return res.status(500).json({ error: 'FD_TOKEN missing' })
      url = `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`
      headers['X-Auth-Token'] = token
    } else if (provider === 'api-football') {
      const key = process.env.RAPIDAPI_KEY || ''
      if (!key) return res.status(500).json({ error: 'RAPIDAPI_KEY missing' })
      url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${date}`
      headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com'
      headers['X-RapidAPI-Key'] = key
    } else if (provider === 'sportmonks') {
      const key = process.env.SPORTMONKS_TOKEN || ''
      if (!key) return res.status(500).json({ error: 'SPORTMONKS_TOKEN missing' })
      url = `https://api.sportmonks.com/v3/football/fixtures/date/${date}?api_token=${encodeURIComponent(key)}`
    } else if (provider === 'thesportsdb') {
      const key = process.env.THESPORTSDB_KEY || ''
      if (!key) return res.status(500).json({ error: 'THESPORTSDB_KEY missing' })
      url = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${date}&s=Soccer`
    } else if (provider === 'openligadb') {
      const season = new Date(date || new Date().toISOString()).getFullYear()
      const league = 'bl1'
      url = `https://api.openligadb.de/getmatchdata/${league}/${season}`
    } else if (provider === 'scorebat') {
      url = `https://www.scorebat.com/video-api/v3/`
    } else {
      return res.status(400).json({ error: 'unknown provider' })
    }

    const upstream = await fetch(url, {
      headers,
      cache: 'no-store' as RequestCache,
      // @ts-ignore
      next: { revalidate: 0 }
    })

    const status = upstream.status
    // nếu upstream trả 304/204 → ép 200 + JSON rỗng để client không crash
    if (status === 304 || status === 204) {
      return res.status(200).json({ matches: [], note: 'normalized from 304/204', _src: url })
    }

    const text = await upstream.text()
    let json: any = null
    try { json = JSON.parse(text) } catch { /* text */ }

    if (debug) {
      return res.status(200).json({
        _debug: { provider, url, upstreamStatus: status, len: text.length },
        ...(json ?? { raw: text })
      })
    }

    // luôn trả 200 để tránh 304 phía sau
    return res.status(200).send(json ?? (text || ''))
  } catch (e: any) {
    return res.status(200).json({ matches: [], error: e?.message || String(e) })
  }
}
