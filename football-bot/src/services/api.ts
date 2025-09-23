// src/services/api.ts
// -> Gọi dữ liệu qua /api/proxy?provider=...&date=YYYY-MM-DD&_ts=... (chống 304 + CORS)
// -> Chuẩn hoá về 1 shape MatchItem cho UI FlashScoreList/TrangDuDoan

import { getSelectedProvider } from './providers'
import type { ProviderId } from './providers'

export type MatchItem = {
  id: string
  ngay?: string        // ISO datetime (UTC)
  doiNha: string
  doiKhach: string
  giai?: string
  san?: string
  status?: string      // NS / LIVE / HT / FT ...
  homeScore?: number
  awayScore?: number
}

// ----------------- utils chung -----------------

const toNum = (x: any) => {
  const n = Number(x)
  return Number.isFinite(n) ? n : undefined
}
const nameOf = (x: any, fallback = 'Đội') => (String(x ?? '').trim() || fallback)

const noCache = (url: string) => {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_ts=${Date.now()}`
}

const asTime = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
const sortByKickoff = (arr: MatchItem[]) => arr.sort((a, b) => asTime(a.ngay) - asTime(b.ngay))

// ----------------- normalizers theo provider -----------------

// football-data.org & (demo) fifadata-like
function normalizeFootballData(json: any): MatchItem[] {
  const arr = Array.isArray(json?.matches) ? json.matches : []
  return arr.map((m: any, i: number) => ({
    id: String(m.id ?? m.matchId ?? i),
    ngay: m.utcDate ?? m.dateUtc ?? m.utc_date,
    doiNha: nameOf(m.homeTeam?.name),
    doiKhach: nameOf(m.awayTeam?.name),
    giai: m.competition?.name,
    san: m.venue,
    status: m.status, // SCHEDULED/IN_PLAY/PAUSED/FINISHED...
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

// OpenLigaDB (lọc theo dateISO)
function normalizeOpenLigaDB(json: any, dateISO: string): MatchItem[] {
  const arr = Array.isArray(json) ? json : []
  const filtered = arr.filter((m: any) => (m.MatchDateTimeUTC || '').slice(0, 10) === dateISO)
  return filtered.map((m: any, i: number) => {
    const res = Array.isArray(m.MatchResults) ? m.MatchResults : []
    const ft = res.find((x: any) => x.ResultTypeID === 2 /*fulltime*/) || res[res.length - 1] || {}
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

// Scorebat (video api) — map tạm thành “trận” theo ngày
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

// ----------------- fetch helper qua proxy -----------------

async function viaProxy(provider: ProviderId, dateISO: string) {
  const url = noCache(`/api/proxy?provider=${encodeURIComponent(provider)}&date=${encodeURIComponent(dateISO)}`)
  const res = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } })
  const text = await res.text() // tránh crash nếu body rỗng
  let json: any = null
  try { json = JSON.parse(text) } catch { json = text }
  return { status: res.status, json }
}

// ----------------- public API -----------------

export async function layTranDauTheoNgay(dateISO: string): Promise<MatchItem[]> {
  const provider = getSelectedProvider()
  try {
    const { status, json } = await viaProxy(provider, dateISO)

    // Proxy đã ép 200 cho 304/204, nhưng ta vẫn kiểm tra status phòng edge cases
    if (status !== 200 || !json) return []

    switch (provider) {
      case 'football-data':
        return normalizeFootballData(json)
      case 'api-football':
        return normalizeAPIFootball(json)
      case 'sportmonks':
        return normalizeSportMonks(json)
      case 'thesportsdb':
        return normalizeTheSportsDB(json)
      case 'openligadb':
        return normalizeOpenLigaDB(json, dateISO)
      case 'scorebat':
        return normalizeScorebat(json, dateISO)
      case 'fifadata':
        // Fifadata (demo) trả kiểu {matches: [...]}, tái dùng normalizer football-data
        if (Array.isArray(json?.matches)) return normalizeFootballData(json)
        return []
      default:
        return []
    }
  } catch (e) {
    console.warn('[layTranDauTheoNgay][error]', provider, e)
    return []
  }
}

// (tuỳ dùng) helper khác có thể export thêm ở đây, ví dụ group theo giải, v.v.
