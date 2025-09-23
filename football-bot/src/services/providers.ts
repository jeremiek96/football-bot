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
  needsKey?: boolean;
  notes?: string;
  keyLabel?: string; // gợi ý tên key
  useProxy?: boolean;
};

export const PROVIDERS: ProviderConfig[] = [
  { id: 'openligadb', name: 'OpenLigaDB (free, no key)', notes: 'Bundesliga & nhiều giải Đức' },
  { id: 'scorebat', name: 'Scorebat (highlights, no key)', notes: 'Chủ yếu highlights' },
  { id: 'fifadata', name: 'FIFA Data (demo, no key)', notes: 'Giải FIFA (không phải CLB mỗi ngày)' },
  { id: 'football-data', name: 'football-data.org', needsKey: true, keyLabel: 'X-Auth-Token' },
  { id: 'thesportsdb', name: 'TheSportsDB', needsKey: true, keyLabel: 'API Key' },
  { id: 'api-football', name: 'API-Football (RapidAPI)', needsKey: true, keyLabel: 'X-RapidAPI-Key' },
  { id: 'sportmonks', name: 'SportMonks', needsKey: true, keyLabel: 'api_token' },
];

const KEY_PROVIDER = 'fb_provider';
const KEY_TOKENS = 'fb_provider_tokens'; // JSON map provider->token

export function getSelectedProvider(): ProviderId {
  return (localStorage.getItem(KEY_PROVIDER) as ProviderId) || 'openligadb';
}
export function setSelectedProvider(p: ProviderId) {
  localStorage.setItem(KEY_PROVIDER, p);
}

type TokenMap = Partial<Record<ProviderId, string>>;
function readTokenMap(): TokenMap {
  try { return JSON.parse(localStorage.getItem(KEY_TOKENS) || '{}') as TokenMap } catch { return {} }
}
function writeTokenMap(m: TokenMap) {
  localStorage.setItem(KEY_TOKENS, JSON.stringify(m));
}
export function getProviderToken(p?: ProviderId): string {
  const prov = p || getSelectedProvider();
  const map = readTokenMap();
  return map[prov] || '';
}
export function setProviderToken(token: string, p?: ProviderId) {
  const prov = p || getSelectedProvider();
  const map = readTokenMap();
  map[prov] = token;
  writeTokenMap(map);
}
