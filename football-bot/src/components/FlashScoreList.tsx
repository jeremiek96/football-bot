// src/components/FlashScoreList.tsx
import React from "react"
import { layTranDauTheoNgay } from "../services/api"
import type { MatchItem } from "../services/api"  // ✅ type-only import

type Props = {
  dateISO: string
}

const FlashScoreList: React.FC<Props> = ({ dateISO }) => {
  const [data, setData] = React.useState<MatchItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await layTranDauTheoNgay(dateISO)
      if (!alive) return
      if (error) setError(error)
      setData(data)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [dateISO])

  if (loading) return <div className="p-6">Đang tải dữ liệu…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data.length) return <div className="p-6">Không có trận cho ngày này.</div>

  return (
    <div className="space-y-3">
      {data.map(m => (
        <div key={m.id} className="border rounded-xl p-4 bg-white shadow">
          <div className="font-semibold">
            {m.doiNha} vs {m.doiKhach}
          </div>
          <div className="text-xs text-gray-500">
            {m.giai} • {m.ngay && new Date(m.ngay).toLocaleString()} {m.san && `• ${m.san}`}
          </div>
        </div>
      ))}
    </div>
  )
}

export default FlashScoreList
