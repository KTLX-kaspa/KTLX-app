export type AssetId = 'KAS' | 'KTLX';

export type AppConfig = {
  adminAddress: string;
  treasuryAddress: string;
  ktlxTicker: string;
  ktlxCa: string;
  alphaMinBalance: number;
  kaspaApiBase: string;
  krc20ApiBase: string;
  ktlxKcc20Descriptor: string;
};

function env(name: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export const config: AppConfig = {
  adminAddress: env('VITE_ADMIN_ADDRESS'),
  treasuryAddress: env('VITE_TREASURY_ADDRESS'),
  ktlxTicker: env('VITE_KTLX_TICKER', 'KTLX'),
  ktlxCa: env('VITE_KTLX_CA'),
  alphaMinBalance: Number(env('VITE_ALPHA_MIN_BALANCE', '1')) || 1,
  kaspaApiBase: env('VITE_KASPA_API_BASE', 'https://api.kaspa.org').replace(/\/$/, ''),
  krc20ApiBase: env('VITE_KRC20_API_BASE', 'https://api.kasplex.org/v1').replace(/\/$/, ''),
  ktlxKcc20Descriptor: env('VITE_KTLX_KCC20_DESCRIPTOR'),
};

export const ASSETS: Record<
  AssetId,
  { id: AssetId; label: string; decimals: number; kind: 'native' | 'krc20' }
> = {
  KAS: { id: 'KAS', label: 'KAS', decimals: 8, kind: 'native' },
  KTLX: { id: 'KTLX', label: config.ktlxTicker || 'KTLX', decimals: 8, kind: 'krc20' },
};
