// api/proxy.ts
export default async function handler(req: any, res: any) {
  try {
    // Tắt cache để tránh 304
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store')

    const provider = String(req.query.provider || '')
    const date = String(req.query.date || '') // dạng YYYY-MM-DD

    if (!provider) return res.status(400).json({ error: 'missing provider' })

    let url = ''
    const headers: Record<string, string> = { accept: 'application/json' }

    // Map từng provider sang URL + header tương ứng
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

    const upstream = await fetch(url, { headers, cache: 'no-store' })

    const text = await upstream.text() // tránh crash khi body trống
    const status = upstream.status

    // Trả lại đúng status, cố gắng parse JSON nếu có
    try {
      const json = JSON.parse(text)
      return res.status(status).json(json)
    } catch {
      return res.status(status).send(text)
    }
  } catch (e: any) {
    return res.status(200).json({ matches: [], error: e?.message || String(e) })
  }
}
