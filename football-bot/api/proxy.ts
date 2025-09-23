// src/services/providers.ts
export type ProviderId =
  | 'openligadb'
  | 'scorebat'
  | 'fifadata'
  | 'football-data'
  | 'thesportsdb'
  | 'api-football'
  | 'sportmonks';

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  needsKey?: boolean;     // chỉ dùng khi gọi TRỰC TIẾP từ browser
  notes?: string;
  keyLabel?: string;
  useProxy?: boolean;     // ✅ thêm: nếu true, key lấy từ ENV server → UI không hỏi key
};

export const PROVIDERS: ProviderConfig[] = [
  // gọi trực tiếp (không cần key, CORS ok)
  { id: 'openligadb',  name: 'OpenLigaDB (no key)', notes: 'Gọi trực tiếp', useProxy: false, needsKey: false },
  { id: 'scorebat',    name: 'Scorebat (no key)',   notes: 'Gọi trực tiếp', useProxy: false, needsKey: false },

  // demo
  { id: 'fifadata',    name: 'FIFA Data (demo)',    notes: 'Gọi trực tiếp', useProxy: false, needsKey: false },

  // các provider đi QUA PROXY (key ở ENV server)
  { id: 'football-data', name: 'football-data.org',        useProxy: true,  needsKey: false, keyLabel: 'X-Auth-Token' },
  { id: 'thesportsdb',   name: 'TheSportsDB',              useProxy: true,  needsKey: false, keyLabel: 'API Key' },
  { id: 'api-football',  name: 'API-Football (RapidAPI)',  useProxy: true,  needsKey: false, keyLabel: 'X-RapidAPI-Key' },
  { id: 'sportmonks',    name: 'SportMonks',               useProxy: true,  needsKey: false, keyLabel: 'api_token' },
];

// giữ nguyên localStorage helpers nếu bạn vẫn muốn lưu key khi chọn chế độ direct-call
