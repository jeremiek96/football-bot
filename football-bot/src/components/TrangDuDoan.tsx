import React from "react"
import { layTranDauTheoNgay } from "../services/api"
import { duDoanTySo, duDoanOverUnder, duDoanKeoGoc } from "../services/duDoan"

function TrangDuDoan() {
  const [tranDau, setTranDau] = React.useState<any[]>([])

  React.useEffect(() => {
    (async () => {
      const homNay = new Date().toISOString().slice(0, 10)
      const data = await layTranDauTheoNgay(homNay)
      setTranDau(data)
    })()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Dự đoán hôm nay</h2>
      {tranDau.map((td) => {
        const tySo = duDoanTySo(1.6, 1.2)
        const ou = duDoanOverUnder(1.6, 1.2, 2.5)
        const goc = duDoanKeoGoc()

        return (
          <div key={td.id} className="border rounded-xl p-4 my-3 shadow">
            <p className="font-semibold">{td.doiNha} vs {td.doiKhach}</p>
            <p>2 tỷ số khả năng cao: {tySo.map(t => `${t.tySo} (${(t.xacSuat*100).toFixed(1)}%)`).join(", ")}</p>
            <p>Kèo Over/Under {ou.muc}: {ou.luaChon} (O {ou.over.toFixed(2)}, U {ou.under.toFixed(2)})</p>
            <p>Kèo góc: {goc}</p>
          </div>
        )
      })}
    </div>
  )
}

export default TrangDuDoan   // 👈 thêm dòng này
