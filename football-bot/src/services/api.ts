// src/services/api.ts
import { getSelectedProvider, getProviderToken } from './providers';
import type { ProviderId } from './providers';


// Chuẩn hoá item trận đấu về shape chung UI dùng
function normalize(matches: any[]): any[] {
  return matches.map((m: any, i: number) => ({
    id: m.id ?? m.MatchID ?? m.matchId ?? m.idEvent ?? `m-${i}`,
    ngay: m.utcDate ?? m.MatchDateTimeUTC ?? m.dateUtc ?? m.DateTimeUTC ?? m.strTimestamp ?? m.date ?? '',
    doiNha: m.homeTeam?.name ?? m.Team1?.TeamName ?? m.HomeTeam ?? m.home ?? m.strHomeTeam ?? 'Đội nhà',
    doiKhach: m.awayTeam?.name ?? m.Team2?.TeamName ?? m.AwayTeam ?? m.away ?? m.strAwayTeam ?? 'Đội khách',
    giai: m.competition?.name ?? m.LeagueName ?? m.competition ?? m.strLeague ?? '',
    san: m.venue ?? m.Location ?? m.strVenue ?? '',
  }));
}

// OpenLigaDB (no key). Ví dụ lấy Bundesliga BL1 theo mùa hiện tại rồi lọc theo ngày.
async function fetchOpenLigaDB(dateISO: string) {
  const season = new Date().getFullYear();
  const league = 'bl1'; // bạn có thể mở rộng UI chọn giải
  const url = `https://api.openligadb.de/getmatchdata/${league}/${season}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  const list = (data || []).filter((m: any) => (m.MatchDateTimeUTC || '').slice(0,10) === dateISO);
  return normalize(list);
}

// Scorebat (no key) — chủ yếu highlights, lọc theo ngày
async function fetchScorebat(dateISO: string) {
  const res = await fetch('https://www.scorebat.com/video-api/v3/', { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  const list = json?.response || [];
  const filt = list.filter((x: any) => (x?.date || '').slice(0,10) === dateISO);
  return normalize(
    filt.map((v: any) => ({
      id: v?.title,
      utcDate: v?.date,
      homeTeam: { name: v?.title?.split(' - ')?.[0] || 'Home' },
      awayTeam: { name: v?.title?.split(' - ')?.[1] || 'Away' },
      competition: { name: v?.competition },
      venue: '',
    }))
  );
}

// FIFA Data (demo, no key)
async function fetchFifa(dateISO: string) {
  const url = `https://www.fifadata.com/api/v1/matches?date=${dateISO}`;
  const res = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.matches) ? normalize(json.matches) : [];
}

// football-data.org (needs key). Free tier hạn chế; có CORS, thử gọi trực tiếp.
async function fetchFootballData(dateISO: string) {
  const token = getProviderToken('football-data');
  if (!token) return [];
  const url = `https://api.football-data.org/v4/matches?dateFrom=${dateISO}&dateTo=${dateISO}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token }, cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return normalize(json?.matches || []);
}

// TheSportsDB (needs key) — sự kiện theo ngày
async function fetchTheSportsDB(dateISO: string) {
  const key = getProviderToken('thesportsdb');
  if (!key) return [];
  const url = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${dateISO}&s=Soccer`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  const events = json?.events || [];
  return normalize(events.map((e: any) => ({
    id: e.idEvent,
    utcDate: e.strTimestamp,
    homeTeam: { name: e.strHomeTeam },
    awayTeam: { name: e.strAwayTeam },
    competition: { name: e.strLeague },
    venue: e.strVenue,
  })));
}

// API-Football qua RapidAPI (needs key). Có nhiều params; ví dụ theo ngày.
async function fetchAPIFootball(dateISO: string) {
  const key = getProviderToken('api-football');
  if (!key) return [];
  const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${dateISO}`;
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      'X-RapidAPI-Key': key
    },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const json = await res.json();
  const list = json?.response || [];
  return normalize(list.map((r: any) => ({
    id: r.fixture?.id,
    utcDate: r.fixture?.date,
    homeTeam: { name: r.teams?.home?.name },
    awayTeam: { name: r.teams?.away?.name },
    competition: { name: r.league?.name },
    venue: r.fixture?.venue?.name
  })));
}

// SportMonks (needs key)
async function fetchSportMonks(dateISO: string) {
  const key = getProviderToken('sportmonks');
  if (!key) return [];
  const url = `https://api.sportmonks.com/v3/football/fixtures/date/${dateISO}?api_token=${encodeURIComponent(key)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  const list = json?.data || [];
  return normalize(list.map((r: any) => ({
    id: r.id,
    utcDate: r.starting_at ?? r.starting_at?.date_time ?? r.starting_at?.utc,
    homeTeam: { name: r.participants?.find((p:any)=>p.meta?.location==='home')?.name || r.home_name },
    awayTeam: { name: r.participants?.find((p:any)=>p.meta?.location==='away')?.name || r.away_name },
    competition: { name: r.league?.name || r.competition_name },
    venue: r.venue?.name
  })));
}

export async function layTranDauTheoNgay(ngayISO: string) {
  const provider: ProviderId = getSelectedProvider();
  try {
    switch (provider) {
      case 'openligadb':   return await fetchOpenLigaDB(ngayISO);
      case 'scorebat':     return await fetchScorebat(ngayISO);
      case 'fifadata':     return await fetchFifa(ngayISO);
      case 'football-data':return await fetchFootballData(ngayISO);
      case 'thesportsdb':  return await fetchTheSportsDB(ngayISO);
      case 'api-football': return await fetchAPIFootball(ngayISO);
      case 'sportmonks':   return await fetchSportMonks(ngayISO);
      default:             return [];
    }
  } catch (e) {
    console.warn('[fetch error]', provider, e);
    return [];
  }
}
