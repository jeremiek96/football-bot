// API lấy dữ liệu từ Fifadata (ví dụ World Cup, Euro)
const BASE_URL = "https://www.fifadata.com/api/v1";

export async function layTranDauTheoNgay(ngayISO: string) {
  const url = `${BASE_URL}/matches?date=${ngayISO}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.matches.map((m: any) => ({
    id: m.matchId,
    ngay: m.dateUtc,
    doiNha: m.homeTeam?.name,
    doiKhach: m.awayTeam?.name,
    giai: m.competition?.name,
    san: m.venue,
  }));
}
