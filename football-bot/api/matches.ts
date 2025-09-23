// api/matches.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10)
    const url = `https://www.fifadata.com/api/v1/matches?date=${encodeURIComponent(date)}`

    const upstream = await fetch(url, { headers: { 'accept': 'application/json' } })

    // Nếu upstream không ok, trả về mảng rỗng để UI vẫn chạy
    if (!upstream.ok) {
      return res.status(200).json({ matches: [] })
    }

    const data = await upstream.json()
    // Chuẩn hoá phòng khi cấu trúc khác
    const matches = Array.isArray(data?.matches) ? data.matches : []

    res.status(200).json({ matches })
  } catch (e) {
    // Không throw ra ngoài để UI không crash
    res.status(200).json({ matches: [] })
  }
}
