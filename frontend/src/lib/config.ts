/** Modo de dados do showcase — mock (DTOs locais) ou live (backend Noah). */
export type DataMode = 'mock' | 'live';

export function dataMode(): DataMode {
  const raw = (import.meta.env.VITE_DATA_MODE ?? 'mock').toLowerCase();
  return raw === 'live' ? 'live' : 'mock';
}

export function isLiveMode(): boolean {
  return dataMode() === 'live';
}

/** Base URL; vazio usa proxy Vite `/api` → `localhost:8080`. */
export function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return base.replace(/\/$/, '');
}
