// src/services/api.ts
// Gọi tất cả nguồn qua /api/proxy để tránh CORS/304, và phân loại lỗi rõ ràng.

import { getSelectedProvider } from './providers'
import type { ProviderId } from './providers'

// ===== Types =====
export type MatchItem = {
  id: string
  ngay?: string        // ISO datetime
  doiNha: string
  doiKhach: string
  giai?: string
  san?: string
  status?: string      // NS/LIVE/HT/FT...
  homeScore?: number
  awayScore?: number
}

export type ApiCode =
  | 'OK'
  | 'NO_DATA'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'PARSE_ERROR'
  | 'UNKNOWN';

export type ApiResult = {
  data: MatchItem[];
  code: ApiCode;
  message?: string;
  upstreamStatus?: number;
  provider?: ProviderId;
}

// ===== Utils =====
const toNum = (x: any) => {
  const n = Number(x); return Number.isFinite(n) ? n : undefined
}
const nameOf = (x: any, fb = 'Đội') => (String(x ?? '').trim() || fb)
const noCache = (url: string) => `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`

// ===== Normalizers theo provider =====

// football-data.org (& fifadata-like: {matches:[]})
function normalizeFootballData(json: any): MatchItem[] {
  const arr = Array.isArray(json?.matches) ? json.matches : []
  return arr.map((m: any, i: number) => ({
    id: String(m.id ?? m.matchId ?? i),
    ngay: m.utcDate ?? m.dateUtc ?? m.utc_date,
    doiNha: nameOf(m.homeTeam?.name),
    doiKhach: nameOf(m.awayTeam?.name),
    giai: m.competition?.name,
    san: m.venue,
    status: m.status,
    homeScore: toNum(m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? m.score?.regular?.home ?? m.homeScore),
    awayScore: toNum(m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? m.score?.regular?.away ?? m.awayScore),
  }))
}

// API-Football (RapidAPI)
function normalizeAPIFootball(json: any): MatchItem[] {
  const arr = Array.isArray(json?.response) ? json.response : []
  return arr.map((r: any, i: number) => ({
    id: String(r.fixture?.id ?? i),
    ngay: r.fixture?.date,
    doiNha: nameOf(r.teams?.home?.name),
    doiKhach: nameOf(r.teams?.away?.name),
    giai: r.league?.name,
    san: r.fixture?.venue?.name,
    status: r.fixture?.status?.short, // NS, 1H, HT, 2H, ET, FT...
    homeScore: toNum(r.goals?.home),
    awayScore: toNum(r.goals?.away),
  }))
}

// SportMonks
function normalizeSportMonks(json: any): MatchItem[] {
  const arr = Array.isArray(json?.data) ? json.data : []
  return arr.map((r: any, i: number) => {
    const home = r.participants?.find?.((p: any) => p?.meta?.location === 'home')?.name ?? r.home_name
    const away = r.participants?.find?.((p: any) => p?.meta?.location === 'away')?.name ?? r.away_name
    const scoreHome =
      r.scores?.find?.((s: any) => s.description === 'CURRENT' && s.participant === 'home')?.score ?? r.home_score
    const scoreAway =
      r.scores?.find?.((s: any) => s.description === 'CURRENT' && s.participant === 'away')?.score ?? r.away_score

    return {
      id: String(r.id ?? i),
      ngay: r.starting_at?.utc ?? r.starting_at?.date_time ?? r.starting_at,
      doiNha: nameOf(home),
      doiKhach: nameOf(away),
      giai: r.league?.name ?? r.competition_name,
      san: r.venue?.name,
      status: r.state?.state ?? r.status,
      homeScore: toNum(scoreHome),
      awayScore: toNum(scoreAway),
    }
  })
}

// TheSportsDB
function normalizeTheSportsDB(json: any): MatchItem[] {
  const arr = Array.isArray(json?.events) ? json.events : []
  return arr.map((e: any, i: number) => ({
    id: String(e.idEvent ?? i),
    ngay: e.strTimestamp ?? e.dateEvent ?? e.dateEventLocal,
    doiNha: nameOf(e.strHomeTeam),
    doiKhach: nameOf(e.strAwayTeam),
    giai: e.strLeague,
    san: e.strVenue,
    status: e.strStatus ?? e.strStatusShort,
    homeScore: toNum(e.intHomeScore ?? e.intHomeGoals),
    awayScore: toNum(e.intAwayScore ?? e.intAwayGoals),
  }))
}

// OpenLigaDB (lọc theo date ISO UTC)
function normalizeOpenLigaDB(json: any, dateISO: string): MatchItem[] {
  const arr = Array.isArray(json) ? json : []
  const filtered = arr.filter((m: any) => {
    const iso = m.MatchDateTimeUTC || ''
    if (!iso) return false
    const d = new Date(iso)
    const s = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
    return s === dateISO
  })
  return filtered.map((m: any, i: number) => {
    const res = Array.isArray(m.MatchResults) ? m.MatchResults : []
    const ft = res.find((x: any) => x.ResultTypeID === 2) || res[res.length - 1] || {}
    return {
      id: String(m.MatchID ?? i),
      ngay: m.MatchDateTimeUTC,
      doiNha: nameOf(m.Team1?.TeamName ?? m.Team1?.ShortName),
      doiKhach: nameOf(m.Team2?.TeamName ?? m.Team2?.ShortName),
      giai: m.LeagueName ?? m.LeagueId,
      san: m.Location?.LocationCity ?? m.Location?.LocationStadium,
      status: m.MatchIsFinished ? 'FT' : 'SCHEDULED',
      homeScore: toNum(ft?.PointsTeam1),
      awayScore: toNum(ft?.PointsTeam2),
    }
  })
}

// Scorebat (video API) → map tạm thành “trận” theo ngày
function normalizeScorebat(json: any, dateISO: string): MatchItem[] {
  const arr = Array.isArray(json?.response) ? json.response : []
  const filtered = arr.filter((x: any) => (x?.date || '').slice(0, 10) === dateISO)
  return filtered.map((v: any, i: number) => {
    const [home, away] = String(v?.title || '').split(' - ')
    return {
      id: String(v?.title ?? i),
      ngay: v?.date,
      doiNha: nameOf(home),
      doiKhach: nameOf(away),
      giai: v?.competition,
      san: '',
      status: 'SCHEDULED',
    }
  })
}

// ===== Fetch qua proxy + phân loại lỗi =====
async function viaProxy(provider: ProviderId, dateISO: string) {
  const url = noCache(`/api/proxy?provider=${encodeURIComponent(provider)}&date=${encodeURIComponent(dateISO)}`)
  try {
    const res = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } })
    const upstream = Number(res.headers.get('x-upstream-status') || '0')
    const text = await res.text()
    let json: any = null
    try { json = JSON.parse(text) } catch { json = text }
    return { ok: res.ok, upstream, json }
  } catch (e: any) {
    return { ok: false, upstream: 0, json: { error: e?.message || String(e) } }
  }
}

function classify(upstream: number, json: any): { code: ApiCode; message?: string } {
  if (upstream === 0) return { code: 'NETWORK_ERROR', message: 'Không kết nối được tới API (mạng/host).' }
  if (upstream === 401 || upstream === 403) return { code: 'AUTH_ERROR', message: 'API từ chối truy cập (key sai/thiếu).' }
  if (upstream === 429) return { code: 'RATE_LIMITED', message: 'API giới hạn tần suất (429). Thử lại sau.' }
  if (upstream >= 500) return { code: 'HTTP_ERROR', message: `API lỗi (HTTP ${upstream}).` }
  if (upstream >= 400) return { code: 'HTTP_ERROR', message: `API trả lỗi (HTTP ${upstream}).` }
  if (json && typeof json === 'object' && ('error' in json) &&
      !Array.isArray(json.matches) && !Array.isArray(json.response) &&
      !Array.isArray(json.data) && !Array.isArray(json.events)) {
    return { code: 'HTTP_ERROR', message: String(json.error || 'API báo lỗi.') }
  }
  return { code: 'OK' }
}

// ===== Public API =====
export async function layTranDauTheoNgay(dateISO: string): Promise<ApiResult> {
  const provider = getSelectedProvider()
  const { ok, upstream, json } = await viaProxy(provider, dateISO)

  if (!ok && upstream === 0) {
    return { data: [], code: 'NETWORK_ERROR', message: 'Không kết nối được tới API.', upstreamStatus: upstream, provider }
  }

  const { code, message } = classify(upstream, json)
  if (code !== 'OK') {
    return { data: [], code, message, upstreamStatus: upstream, provider }
  }

  let data: MatchItem[] = []
  switch (provider) {
    case 'football-data': data = normalizeFootballData(json); break
    case 'api-football':  data = normalizeAPIFootball(json); break
    case 'sportmonks':    data = normalizeSportMonks(json); break
    case 'thesportsdb':   data = normalizeTheSportsDB(json); break
    case 'openligadb':    data = normalizeOpenLigaDB(json, dateISO); break
    case 'scorebat':      data = normalizeScorebat(json, dateISO); break
    case 'fifadata':      if (Array.isArray(json?.matches)) data = normalizeFootballData(json); break
  }

  if (!data.length) {
    return { data: [], code: 'NO_DATA', message: 'Kết nối OK nhưng không có dữ liệu cho ngày này.', upstreamStatus: upstream, provider }
  }

  return { data, code: 'OK', upstreamStatus: upstream, provider }
}
