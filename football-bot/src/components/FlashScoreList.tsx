import React from "react"
import { layTranDauTheoNgay } from "../services/api"
import { duDoanTySo, duDoanOverUnder } from "../services/duDoan"

type MatchItem = {
  id: string
  ngay?: string
  doiNha: string
  doiKhach: string
  giai?: string
  san?: string
  // có thể bổ sung status/score nếu API trả
  status?: string
  homeScore?: number
  awayScore?: number
}

function toLocalHHmm(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function statusBadge(status?: string, iso?: string) {
  if (!status || status === "NS" || status === "SCHEDULED") {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
        {toLocalHHmm(iso)}
      </span>
    )
  }
  if (/FT|FINISHED|Full/i.test(status)) {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
        FT
      </span>
    )
  }
  if (/HT|Half/i.test(status)) {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700">
        HT
      </span>
    )
  }
  if (/LIVE|IN_PLAY|1H|2H|ET/i.test(status)) {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700 animate-pulse">
        LIVE
      </span>
    )
  }
  return (
    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
      {status}
    </span>
  )
}

function LeagueHeader({
  name,
  collapsed,
  onToggle,
}: {
  name: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-xl shadow-sm hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-4 rounded bg-blue-600" />
        <span className="font-semibold text-sm">{name || "Giải khác"}</span>
      </div>
      <span className="text-xs text-gray-500">{collapsed ? "▼" : "▲"}</span>
    </button>
  )
}

function MatchRow({ m }: { m: MatchItem }) {
  // Poisson gợi ý nhanh: 2 tỷ số top + O/U 2.5
  const tySo = duDoanTySo(1.5, 1.2) // có thể tinh λ từ form sau
  const ou = duDoanOverUnder(1.5, 1.2, 2.5)
  const score =
    m.homeScore != null && m.awayScore != null
      ? `${m.homeScore}–${m.awayScore}`
      : "–"

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 px-3 py-2 hover:bg-gray-50">
      <div className="flex items-center gap-2">
        {statusBadge(m.status, m.ngay)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate">{m.doiNha}</div>
          <div className="font-semibold tabular-nums">{score}</div>
        </div>
        <div className="flex items-center justify-between gap-2 text-gray-700">
          <div className="truncate">{m.doiKhach}</div>
          <div className="text-[11px] text-gray-500">
            {/* tip nhanh kiểu Flashscore mini-badge */}
            {tySo[0]?.tySo} • {ou.luaChon}
          </div>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500">
        <span className="px-2 py-0.5 rounded bg-gray-100">{tySo[0]?.tySo}</span>
        <span className="px-2 py-0.5 rounded bg-gray-100">{tySo[1]?.tySo}</span>
        <span className="px-2 py-0.5 rounded bg-gray-100">
          O/U {ou.muc}: {ou.luaChon === "Chọn Over" ? "Over" : "Under"}
        </span>
      </div>
    </div>
  )
}

export default function FlashScoreList({
  dateISO,
}: {
  dateISO: string
}) {
  const [data, setData] = React.useState<MatchItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const raw = await layTranDauTheoNgay(dateISO)
        if (!alive) return
        // chuẩn hoá tối thiểu
        const arr: MatchItem[] = (raw || []).map((r: any) => ({
          id: r.id,
          ngay: r.ngay,
          doiNha: r.doiNha,
          doiKhach: r.doiKhach,
          giai: r.giai || "Khác",
          san: r.san,
          status: r.status,
          homeScore: r.homeScore,
          awayScore: r.awayScore,
        }))

        // sort theo giờ
        arr.sort((a, b) => (new Date(a.ngay || 0).getTime() - new Date(b.ngay || 0).getTime()))

        setData(arr)
      } catch (e: any) {
        setError("Không tải được dữ liệu.")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [dateISO])

  // group theo giải
  const groups = React.useMemo(() => {
    const map = new Map<string, MatchItem[]>()
    for (const m of data) {
      const key = m.giai || "Khác"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries())
  }, [data])

  if (loading) return <div className="p-6">Đang tải dữ liệu…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data.length) return <div className="p-6">Không có trận cho ngày này.</div>

  return (
    <div className="space-y-3">
      {groups.map(([league, items]) => {
        const isCollapsed = !!collapsed[league]
        return (
          <div key={league} className="bg-white border rounded-2xl shadow-sm">
            <div className="p-2">
              <LeagueHeader
                name={league}
                collapsed={isCollapsed}
                onToggle={() =>
                  setCollapsed((s) => ({ ...s, [league]: !s[league] }))
                }
              />
            </div>
            {!isCollapsed && (
              <div className="divide-y">
                {items.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
