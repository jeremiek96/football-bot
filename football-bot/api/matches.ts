export default async function handler(req: any, res: any) {
  try {
    const date = (req?.query?.date as string) || new Date().toISOString().slice(0, 10)
    const url = `https://www.fifadata.com/api/v1/matches?date=${encodeURIComponent(date)}`

    const upstream = await fetch(url, {
      headers: { accept: 'application/json' },
      // tránh 304 từ upstream (dù ta không gửi conditional headers)
      cache: 'no-store',
      // @ts-ignore (Node fetch có revalidate trong 20+)
      next: { revalidate: 0 }
    })

    // Luôn set no-cache cho tầng CDN/trình duyệt
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('CDN-Cache-Control', 'no-store')
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store')

    if (!upstream.ok) {
      // vẫn trả 200 với mảng rỗng để client không crash
      return res.status(200).json({ matches: [] })
    }

    let data: any = null
    try {
      data = await upstream.json()
    } catch {
      // upstream 204/empty → fallback rỗng
      return res.status(200).json({ matches: [] })
    }

    const matches = Array.isArray(data?.matches) ? data.matches : []
    return res.status(200).json({ matches })
  } catch {
    return res.status(200).json({ matches: [] })
  }
}
