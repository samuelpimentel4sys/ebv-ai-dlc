/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'mock' | 'live';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_BEARER?: string;
  readonly VITE_PJ_OPINION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
