import React from "react"
import { layTranDauTheoNgay } from "../services/api"
import { duDoanTySo, duDoanOverUnder, duDoanKeoGoc } from "../services/duDoan"

export default function TrangDuDoan() {
  const [tranDau, setTranDau] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    (async () => {
      try {
        const homNay = new Date().toISOString().slice(0, 10)
        const data = await layTranDauTheoNgay(homNay)
        setTranDau(data)
      } catch (e) {
        setError("Không tải được dữ liệu trận đấu.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-6">Đang tải dữ liệu…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (tranDau.length === 0) return <div className="p-6">Hôm nay chưa có trận nào phù hợp.</div>

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Dự đoán hôm nay</h2>
      {tranDau.map((td) => {
        const tySo = duDoanTySo(1.6, 1.2)
        const ou = duDoanOverUnder(1.6, 1.2, 2.5)
        const goc = duDoanKeoGoc()

        return (
          <div key={td.id} className="border rounded-xl p-4 my-3 shadow bg-white">
            <p className="font-semibold">{td.doiNha} vs {td.doiKhach}</p>
            <p className="text-sm text-gray-500">{td.giai} {td.ngay && `• ${new Date(td.ngay).toLocaleString()}`}</p>
            <p className="mt-2"><b>2 tỷ số cao:</b> {tySo.map(t => `${t.tySo} (${(t.xacSuat*100).toFixed(1)}%)`).join(", ")}</p>
            <p><b>Over/Under {ou.muc}:</b> {ou.luaChon} (O {ou.over.toFixed(2)}, U {ou.under.toFixed(2)})</p>
            <p><b>Kèo góc:</b> {goc}</p>
          </div>
        )
      })}
    </div>
  )
}
