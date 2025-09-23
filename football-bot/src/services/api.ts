export async function layTranDauTheoNgay(ngayISO: string) {
  try {
    const res = await fetch(`/api/matches?date=${ngayISO}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store' // tránh 304 từ CDN/trình duyệt
    })

    // Nếu (lỡ) nhận 304/không có body → trả rỗng an toàn
    if (!res.ok) return []

    let data: any = null
    try {
      data = await res.json()
    } catch {
      return []
    }

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
    return []
  }
}
