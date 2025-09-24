// src/components/FlashScoreList.tsx
import React from "react"
import { layTranDauTheoNgay } from "../services/api"
import type { MatchItem, ApiResult } from "../services/api"

type Props = { dateISO: string }

const FlashScoreList: React.FC<Props> = ({ dateISO }) => {
  const [data, setData] = React.useState<MatchItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [msg, setMsg] = React.useState<{code: ApiResult['code']; text: string} | null>(null)

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setMsg(null)
      const result = await layTranDauTheoNgay(dateISO)
      if (!alive) return

      if (result.code !== 'OK') {
        const friendly =
          result.code === 'NETWORK_ERROR' ? 'Không kết nối được tới API. Kiểm tra mạng/ENV/Proxy.'
        : result.code === 'AUTH_ERROR'    ? 'API từ chối truy cập (key sai/thiếu).'
        : result.code === 'RATE_LIMITED'  ? 'Bị giới hạn tần suất. Vui lòng thử lại sau.'
        : result.code === 'NO_DATA'       ? 'Kết nối OK nhưng không có trận cho ngày này.'
        : result.code === 'HTTP_ERROR'    ? `API lỗi (HTTP ${result.upstreamStatus ?? ''}).`
        : 'Có lỗi xảy ra.'
        setMsg({ code: result.code, text: result.message || friendly })
        setData([])
      } else {
        setData(result.data)
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [dateISO])

  if (loading) return <div className="p-6">Đang tải dữ liệu…</div>
  if (msg)     return <div className="p-6 text-red-600">{msg.text}</div>
  if (!data.length) return <div className="p-6">Không có trận cho ngày này.</div>

  return (
    <div className="space-y-3">
      {data.map(m => (
        <div key={m.id} className="border rounded-xl p-4 bg-white shadow">
          <div className="font-semibold">{m.doiNha} vs {m.doiKhach}</div>
          <div className="text-xs text-gray-500">
            {m.giai} • {m.ngay && new Date(m.ngay).toLocaleString()} {m.san && `• ${m.san}`}
          </div>
        </div>
      ))}
    </div>
  )
}

export default FlashScoreList
