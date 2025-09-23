// src/App.tsx
import './App.css'
import TrangDuDoan from './components/TrangDuDoan'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="p-6 shadow-sm bg-white">
        <h1 className="text-2xl font-bold">Theo dõi & Dự đoán bóng đá</h1>
        <p className="text-sm text-gray-500">Nguồn: Fifadata (qua serverless)</p>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <TrangDuDoan />
      </main>
    </div>
  )
}
