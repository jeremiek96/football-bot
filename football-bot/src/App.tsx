import './App.css'
import React from 'react'
import SettingsNguon from './components/SettingsNguon'
import FlashScoreList from './components/FlashScoreList'
import { getSelectedProvider } from './services/providers'

function todayVNISO() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function App() {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState(todayVNISO())
  const [reloadKey, setReloadKey] = React.useState(0)
  const provider = getSelectedProvider()

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="p-4 sm:p-6 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Livescore kiểu Flashscore</h1>
            <p className="text-xs text-gray-500">Nguồn: <b>{provider}</b></p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded-lg p-2"/>
            <button onClick={()=>setOpen(true)} className="px-3 py-2 rounded-lg border">Chọn nguồn</button>
            <button onClick={()=>setReloadKey(k=>k+1)} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Tải lại</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <FlashScoreList key={provider + date + reloadKey} dateISO={date} />
      </main>

      {open && <SettingsNguon onClose={()=>setOpen(false)} onChanged={()=>setReloadKey(k=>k+1)} />}
    </div>
  )
}
