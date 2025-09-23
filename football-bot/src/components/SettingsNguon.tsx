// src/components/SettingsNguon.tsx
import React from 'react'
import {
  PROVIDERS, getSelectedProvider, setSelectedProvider,
  getProviderToken, setProviderToken
} from '../services/providers'

export default function SettingsNguon({
  onClose, onChanged
}: { onClose: () => void; onChanged?: () => void }) {
  const [prov, setProv] = React.useState(getSelectedProvider())
  const [token, setToken] = React.useState(getProviderToken(prov))

  const cfg = React.useMemo(() => PROVIDERS.find(p => p.id === prov), [prov])

  function save() {
    setSelectedProvider(prov)
    if (cfg?.needsKey) setProviderToken(token, prov)
    onChanged?.()
    onClose()
  }

  React.useEffect(() => {
    setToken(getProviderToken(prov))
  }, [prov])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Chọn nguồn dữ liệu</h2>

        <label className="block text-sm mb-1">Nguồn</label>
        <select
          value={prov}
          onChange={e=>setProv(e.target.value as any)}
          className="w-full border rounded-lg p-2 mb-3"
        >
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {cfg?.notes && <p className="text-xs text-gray-500 mb-3">Ghi chú: {cfg.notes}</p>}

        {cfg?.needsKey && (
          <>
            <label className="block text-sm mb-1">API Key {cfg?.keyLabel ? `(${cfg.keyLabel})` : ''}</label>
            <input
              value={token}
              onChange={e=>setToken(e.target.value)}
              placeholder="Dán API Key vào đây"
              className="w-full border rounded-lg p-2 mb-3"
            />
            <p className="text-xs text-gray-500">Key sẽ lưu trong trình duyệt của bạn.</p>
          </>
        )}

        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">Hủy</button>
          <button onClick={save} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Lưu</button>
        </div>
      </div>
    </div>
  )
}
