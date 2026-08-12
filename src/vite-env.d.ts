/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_ADDRESS?: string;
  readonly VITE_TREASURY_ADDRESS?: string;
  readonly VITE_KTLX_TICKER?: string;
  readonly VITE_KTLX_CA?: string;
  readonly VITE_ALPHA_MIN_BALANCE?: string;
  readonly VITE_KASPA_API_BASE?: string;
  readonly VITE_KRC20_API_BASE?: string;
  readonly VITE_KTLX_KCC20_DESCRIPTOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
