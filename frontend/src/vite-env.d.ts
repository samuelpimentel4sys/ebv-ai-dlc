/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'mock' | 'live';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_BEARER?: string;
  readonly VITE_OIDC_ENABLED?: string;
  readonly VITE_OIDC_ISSUER?: string;
  readonly VITE_OIDC_BROWSER_BASE?: string;
  readonly VITE_OIDC_CLIENT_ID?: string;
  readonly VITE_OIDC_PASSWORD_CLIENT_ID?: string;
  readonly VITE_OIDC_REDIRECT_URI?: string;
  readonly VITE_PJ_OPINION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
