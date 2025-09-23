// src/components/SettingsNguon.tsx
import React from 'react'
import {
  PROVIDERS,
  getSelectedProvider,
  setSelectedProvider,
  getProviderToken,
  setProviderToken
} from '../services/providers'

export default function SettingsNguon({
  onClose,
  onChanged
}: {
  onClose: () => void
  onChanged?: () => void
}) {
  const [prov, setProv] = React.useState(getSelectedProvider())
  const cfg = React.useMemo(() => PROVIDERS.find(p => p.id === prov), [prov])

  // Token chỉ lưu local khi provider không dùng proxy
  const [token, setToken] = React.useState(
    cfg?.useProxy ? '' : getProviderToken(prov)
  )

  React.useEffect(() => {
    const nextCfg = PROVIDERS.find(p => p.id === prov)
    setToken(nextCfg?.useProxy ? '' : getProviderToken(prov))
  }, [prov])

  function save() {
    setSelectedProvider(prov)
    // chỉ lưu token nếu provider này cần key và không dùng proxy
    if (!cfg?.useProxy && cfg?.needsKey) {
      setProviderToken(token, prov)
    }
    onChanged?.()
    onClose()
  }

  // Quyết định có hiển thị ô nhập key hay không
  const showKeyField = !!(cfg && !cfg.useProxy && cfg.needsKey)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Chọn nguồn dữ liệu</h2>

        {/* Dropdown chọn provider */}
        <label className="block text-sm mb-1">Nguồn</label>
        <select
          value={prov}
          onChange={e => setProv(e.target.value as any)}
          className="w-full border rounded-lg p-2 mb-3"
        >
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {cfg?.notes && (
          <p className="text-xs text-gray-500 mb-3">Ghi chú: {cfg.notes}</p>
        )}

        {/* Ô nhập API Key chỉ khi gọi trực tiếp */}
        {showKeyField && (
          <>
            <label className="block text-sm mb-1">
              API Key {cfg?.keyLabel ? `(${cfg.keyLabel})` : ''}
            </label>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Dán API Key (local)"
              className="w-full border rounded-lg p-2 mb-3"
            />
            <p className="text-xs text-gray-500">
              Trường hợp gọi trực tiếp từ trình duyệt mới cần key.
              Với proxy server (ENV), key đã nằm ở server.
            </p>
          </>
        )}

        {/* Buttons */}
        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border"
          >
            Hủy
          </button>
          <button
            onClick={save}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
