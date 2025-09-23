// src/components/TrangDuDoan.tsx
import React from "react"
import { layTranDauTheoNgay } from "../services/api"
import { duDoanTySo, duDoanOverUnder, duDoanKeoGoc } from "../services/duDoan"

export default function TrangDuDoan({ forcedDate }: { forcedDate?: string }) {
  const [tranDau, setTranDau] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const d = forcedDate || new Date().toISOString().slice(0, 10)
        const data = await layTranDauTheoNgay(d)
        setTranDau(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError('Không tải được dữ liệu trận đấu.')
      } finally {
        setLoading(false)
      }
    })()
  }, [forcedDate])

  if (loading) return <div className="p-6">Đang tải dữ liệu…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (tranDau.length === 0) return <div className="p-6">Chưa có trận cho ngày này.</div>

  return (
    <div className="p-2 grid gap-3">
      {tranDau.map((td) => {
        const tySo = duDoanTySo(1.6, 1.2)
        const ou = duDoanOverUnder(1.6, 1.2, 2.5)
        const goc = duDoanKeoGoc()
        return (
          <div key={td.id} className="border rounded-xl p-4 bg-white shadow">
            <div className="font-semibold">{td.doiNha} vs {td.doiKhach}</div>
            <div className="text-xs text-gray-500">
              {td.giai} {td.ngay && `• ${new Date(td.ngay).toLocaleString()}`} {td.san && `• ${td.san}`}
            </div>
            <div className="mt-2 text-sm">
              <div><b>2 tỷ số cao:</b> {tySo.map(t => `${t.tySo} (${(t.xacSuat*100).toFixed(1)}%)`).join(", ")}</div>
              <div><b>Over/Under {ou.muc}:</b> {ou.luaChon} (O {ou.over.toFixed(2)}, U {ou.under.toFixed(2)})</div>
              <div><b>Kèo góc:</b> {goc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
