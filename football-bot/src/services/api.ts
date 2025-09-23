export async function layTranDauTheoNgay(ngayISO: string) {
  try {
    const res = await fetch(`/api/matches?date=${ngayISO}`)
    const data = await res.json()
    const matches = Array.isArray(data?.matches) ? data.matches : []
    return matches.map((m: any) => ({
      id: m.matchId ?? `${m.homeTeam?.name}-${m.awayTeam?.name}-${m.dateUtc ?? ''}`,
      ngay: m.dateUtc ?? '',
      doiNha: m.homeTeam?.name ?? 'Đội nhà',
      doiKhach: m.awayTeam?.name ?? 'Đội khách',
      giai: m.competition?.name ?? '',
      san: m.venue ?? ''
    }))
  } catch {
    // Trả rỗng để UI vẫn render
    return []
  }
}
