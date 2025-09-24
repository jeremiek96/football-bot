// api/proxy.js
export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Surrogate-Control', 'no-store');

    const provider = String(req.query.provider || '');
    const date = String(req.query.date || '');

    if (!provider) {
      res.setHeader('x-upstream-status', '-1');
      return res.status(400).json({ error: 'missing provider', errorCode: 'CONFIG_MISSING' });
    }

    let url = '';
    const headers = { accept: 'application/json' };

    if (provider === 'football-data') {
      const token = process.env.FD_TOKEN || '';
      if (!token) { res.setHeader('x-upstream-status', '-1'); return res.status(500).json({ error: 'FD_TOKEN missing', errorCode: 'CONFIG_MISSING' }); }
      url = `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`;
      headers['X-Auth-Token'] = token;
    } else if (provider === 'api-football') {
      const key = process.env.RAPIDAPI_KEY || '';
      if (!key) { res.setHeader('x-upstream-status', '-1'); return res.status(500).json({ error: 'RAPIDAPI_KEY missing', errorCode: 'CONFIG_MISSING' }); }
      url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${date}`;
      headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
      headers['X-RapidAPI-Key'] = key;
    } else if (provider === 'sportmonks') {
      const key = process.env.SPORTMONKS_TOKEN || '';
      if (!key) { res.setHeader('x-upstream-status', '-1'); return res.status(500).json({ error: 'SPORTMONKS_TOKEN missing', errorCode: 'CONFIG_MISSING' }); }
      url = `https://api.sportmonks.com/v3/football/fixtures/date/${date}?api_token=${encodeURIComponent(key)}`;
    } else if (provider === 'thesportsdb') {
      const key = process.env.THESPORTSDB_KEY || '';
      if (!key) { res.setHeader('x-upstream-status', '-1'); return res.status(500).json({ error: 'THESPORTSDB_KEY missing', errorCode: 'CONFIG_MISSING' }); }
      url = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${date}&s=Soccer`;
    } else if (provider === 'openligadb') {
      const season = new Date(date || new Date().toISOString()).getFullYear();
      const league = 'bl1';
      url = `https://api.openligadb.de/getmatchdata/${league}/${season}`;
    } else if (provider === 'scorebat') {
      url = `https://www.scorebat.com/video-api/v3/`;
    } else {
      res.setHeader('x-upstream-status', '-1');
      return res.status(400).json({ error: 'unknown provider', errorCode: 'CONFIG_MISSING' });
    }

    const upstream = await fetch(url, { headers, cache: 'no-store' });
    const status = upstream.status;
    res.setHeader('x-upstream-status', String(status));

    if (status === 304 || status === 204) {
      return res.status(200).json({ matches: [], note: 'normalized from 304/204' });
    }

    const text = await upstream.text();
    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch {
      return res.status(200).send(text || '');
    }
  } catch (e) {
    res.setHeader('x-upstream-status', '0');
    return res.status(200).json({ matches: [], error: e?.message || String(e) });
  }
}
