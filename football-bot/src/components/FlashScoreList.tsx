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
  status?: string
  homeScore?: number
  awayScore?: number
}

function hhmm(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function statusClass(status?: string) {
  if (!status || /NS|SCHEDULED|TBD/i.test(status)) return "fs-time"
  if (/FT|FINISHED/i.test(status)) return "fs-time ft"
  if (/HT|Half/i.test(status)) return "fs-time ht"
  if (/LIVE|IN_PLAY|1H|2H|ET/i.test(status)) return "fs-time live"
  return "fs-time"
}

function asTime(s?: string) {
  return s ? new Date(s).getTime() : 0
}

// tô đỏ nếu xs >= 60%, xanh nếu 55–60%
function probClass(p: number) {
  if (p >= 0.6) return "badge hot"
  if (p >= 0.55) return "badge good"
  return "badge"
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
    <button onClick={onToggle} className="fs-league">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="dot" />
        <span className="font-semibold" style={{ fontSize: 14 }}>{name || "Giải khác"}</span>
      </div>
      <span className="fs-muted">{collapsed ? "▼" : "▲"}</span>
    </button>
  )
}

function MatchRow({ m }: { m: MatchItem }) {
  // (demo) λ nhà/khách tạm thời, có thể thay bằng dữ liệu thực
  const tySo = duDoanTySo(1.5, 1.2)           // [{tySo, xacSuat}, ...]
  const ou = duDoanOverUnder(1.5, 1.2, 2.5)   // { over, under, luaChon, muc }

  const top1 = tySo[0]
  const top2 = tySo[1]
  const p1 = top1?.xacSuat ?? 0
  const p2 = top2?.xacSuat ?? 0

  // Over/Under prob: lấy max để hiển thị badge
  const pOU = Math.max(ou.over, ou.under)
  const ouLabel = `${ou.luaChon === "Chọn Over" ? "Over" : "Under"} ${ou.muc} (${(pOU*100).toFixed(0)}%)`

  const score =
    m.homeScore != null && m.awayScore != null ? `${m.homeScore}–${m.awayScore}` : "–"

  return (
    <div className="fs-row">
      <div>
        <span className={statusClass(m.status)}>{/LIVE|IN_PLAY|HT|FT/i.test(m.status||"") ? (m.status?.toUpperCase()) : hhmm(m.ngay)}</span>
      </div>

      <div>
        <div className="fs-team">
          <div className="name">{m.doiNha}</div>
          <div className="fs-score">{score}</div>
        </div>
        <div className="fs-team">
          <div className="name">{m.doiKhach}</div>
          <div className="fs-badges">
            {/* Hai tỷ số top + % */}
            {top1 && <span className={probClass(p1)}>{top1.tySo} {(p1*100).toFixed(0)}%</span>}
            {top2 && <span className={probClass(p2)}>{top2.tySo} {(p2*100).toFixed(0)}%</span>}
            {/* O/U */}
            <span className={probClass(pOU)}>{ouLabel}</span>
          </div>
        </div>
      </div>

      <div className="fs-muted" style={{ textAlign: "right" }}>
        {m.san || ""}
      </div>
    </div>
  )
}

export default function FlashScoreList({ dateISO }: { dateISO: string }) {
  const [data, setData] = React.useState<MatchItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const raw = await layTranDauTheoNgay(dateISO)
        if (!alive) return
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
        // Sắp xếp theo giờ thi đấu tăng dần
        arr.sort((a, b) => asTime(a.ngay) - asTime(b.ngay))
        setData(arr)
      } catch (e) {
        setError("Không tải được dữ liệu.")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
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

  if (loading) return <div style={{ padding: 16 }}>Đang tải dữ liệu…</div>
  if (error) return <div style={{ padding: 16, color: "#b91c1c" }}>{error}</div>
  if (!data.length) return <div style={{ padding: 16 }}>Không có trận cho ngày này.</div>

  return (
    <div className="fs-league-wrap">
      {groups.map(([league, items]) => {
        const isCollapsed = !!collapsed[league]
        return (
          <div key={league} className="fs-card" style={{ marginBottom: 12 }}>
            <div className="fs-league-header">
              <LeagueHeader
                name={league}
                collapsed={isCollapsed}
                onToggle={() => setCollapsed(s => ({ ...s, [league]: !s[league] }))}
              />
            </div>
            {!isCollapsed && (
              <div>
                {items.map(m => <MatchRow key={m.id} m={m} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
