// src/services/api.ts
// GỌI DỮ LIỆU QUA SERVERLESS PROXY: /api/proxy?provider=...&date=YYYY-MM-DD
// Chuẩn hoá về 1 shape dùng chung cho UI (FlashScoreList/TrangDuDoan)

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

// ------- UTIL -------

function safeNum(x: any): number | undefined {
  const n = Number(x)
  return Number.isFinite(n) ? n : undefined
}

function normTeamName(x: any): string {
  return String(x ?? '').trim() || 'Đội'
}

function normalizeFootballData(json: any): MatchItem[] {
  const arr = Array.isArray(json?.matches) ? json.matches : []
  return arr.map((m: any, i: number) => ({
    id: String(m.id ?? m.matchId ?? i),
    ngay: m.utcDate ?? m.dateUtc ?? m.utc_date,
    doiNha: normTeamName(m.homeTeam?.name),
    doiKhach: normTeamName(m.awayTeam?.name),
    giai: m.competition?.name,
    san: m.venue,
    status: m.status, // SCHEDULED/IN_PLAY/PAUSED/FINISHED...
    homeScore: safeNum(m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? m.score?.regular?.home ?? m.homeScore),
    awayScore: safeNum(m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? m.score?.regular?.away ?? m.awayScore),
  }))
}

function normalizeAPIFootball(json: any): MatchItem[] {
  const arr = Array.isArray(json?.response) ? json.response : []
  return arr.map((r: any, i: number) => ({
    id: String(r.fixture?.id ?? i),
    ngay: r.fixture?.date,
    doiNha: normTeamName(r.teams?.home?.name),
    doiKhach: normTeamName(r.teams?.away?.name),
    giai: r.league?.name,
    san: r.fixture?.venue?.name,
    status: r.fixture?.status?.short, // NS, 1H, HT, 2H, ET, FT...
    homeScore: safeNum(r.goals?.home),
    awayScore: safeNum(r.goals?.away),
  }))
}

function normalizeSportMonks(json: any): MatchItem[] {
  const arr = Array.isArray(json?.data) ? json.data : []
  return arr.map((r: any, i: number) => {
    const home =
      r.participants?.find((p: any) => p?.meta?.location === 'home')?.name ??
      r.home_name
    const away =
      r.participants?.find((p: any) => p?.meta?.location === 'away')?.name ??
      r.away_name
    const scoreHome =
      r.scores?.find?.((s: any) => s.description === 'CURRENT' && s.participant === 'home')?.score ??
      r.home_score
    const scoreAway =
      r.scores?.find?.((s: any) => s.description === 'CURRENT' && s.participant === 'away')?.score ??
      r.away_score

    return {
      id: String(r.id ?? i),
      ngay: r.starting_at?.utc ?? r.starting_at?.date_time ?? r.starting_at,
      doiNha: normTeamName(home),
      doiKhach: normTeamName(away),
      giai: r.league?.name ?? r.competition_name,
      san: r.venue?.name,
      status: r.state?.state ?? r.status, // tuỳ payload
      homeScore: safeNum(scoreHome),
      awayScore: safeNum(scoreAway),
    }
  })
}

function normalizeTheSportsDB(json: any): MatchItem[] {
  const arr = Array.isArray(json?.events) ? json.events : []
  return arr.map((e: any, i: number) => ({
    id: String(e.idEvent ?? i),
    ngay: e.strTimestamp ?? e.dateEvent ?? e.dateEventLocal,
    doiNha: normTeamName(e.strHomeTeam),
    doiKhach: normTeamName(e.strAwayTeam),
    giai: e.strLeague,
    san: e.strVenue,
    status: e.strStatus ?? e.strStatusShort,
    homeScore: safeNum(e.intHomeScore ?? e.intHomeGoals),
    awayScore: safeNum(e.intAwayScore ?? e.intAwayGoals),
  }))
}

function normalizeOpenLigaDB(json: any, dateISO: string): MatchItem[] {
  const arr = Array.isArray(json) ? json : []
  const filtered = arr.filter((m: any) =>
    (m.MatchDateTimeUTC || '').slice(0, 10) === dateISO
  )
  return filtered.map((m: any, i: number) => {
    // Kết quả: tìm fulltime nếu có
    const res = Array.isArray(m.MatchResults) ? m.MatchResults : []
    const ft = res.find((x: any) => x.ResultTypeID === 2 /*fulltime*/) || res[res.length - 1] || {}
    return {
      id: String(m.MatchID ?? i),
      ngay: m.MatchDateTimeUTC,
      doiNha: normTeamName(m.Team1?.TeamName ?? m.Team1?.ShortName),
      doiKhach: normTeamName(m.Team2?.TeamName ?? m.Team2?.ShortName),
      giai: m.LeagueName ?? m.LeagueId,
      san: m.Location?.LocationCity ?? m.Location?.LocationStadium,
      status: m.MatchIsFinished ? 'FT' : 'SCHEDULED',
      homeScore: safeNum(ft?.PointsTeam1),
      awayScore: safeNum(ft?.PointsTeam2),
    }
  })
}

function normalizeScorebat(json: any, dateISO: string): MatchItem[] {
  const arr = Array.isArray(json?.response) ? json.response : []
  const filtered = arr.filter((x: any) => (x?.date || '').slice(0, 10) === dateISO)
  return filtered.map((v: any, i: number) => {
    const [home, away] = String(v?.title || '').split(' - ')
    return {
      id: String(v?.title ?? i),
      ngay: v?.date,
      doiNha: normTeamName(home),
      doiKhach: normTeamName(away),
      giai: v?.competition,
      san: '',
      status: 'SCHEDULED',
    }
  })
}

// ------- FETCH VIA PROXY -------

async function viaProxy(provider: ProviderId, dateISO: string) {
  const res = await fetch(`/api/proxy?provider=${provider}&date=${dateISO}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' }
  })
  // Dùng text trước để tránh crash khi body rỗng
  const text = await res.text()
  try { return { status: res.status, json: JSON.parse(text) } }
  catch { return { status: res.status, json: text } }
}

// ------- PUBLIC API -------

export async function layTranDauTheoNgay(dateISO: string): Promise<MatchItem[]> {
  const provider = getSelectedProvider()
  try {
    const { status, json } = await viaProxy(provider, dateISO)

    // Map theo provider → normalize về MatchItem[]
    switch (provider) {
      case 'football-data':
        if (status === 200 && json) return normalizeFootballData(json)
        return []
      case 'api-football':
        if (status === 200 && json) return normalizeAPIFootball(json)
        return []
      case 'sportmonks':
        if (status === 200 && json) return normalizeSportMonks(json)
        return []
      case 'thesportsdb':
        if (status === 200 && json) return normalizeTheSportsDB(json)
        return []
      case 'openligadb':
        if (status === 200 && json) return normalizeOpenLigaDB(json, dateISO)
        return []
      case 'scorebat':
        if (status === 200 && json) return normalizeScorebat(json, dateISO)
        return []
      case 'fifadata':
        // Fifadata trả {matches:[...]} tương tự football-data (demo)
        if (status === 200 && Array.isArray(json?.matches)) {
          return normalizeFootballData(json)
        }
        return []
      default:
        return []
    }
  } catch (e) {
    console.warn('[fetch error]', provider, e)
    return []
  }
}
