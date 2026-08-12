import { config } from '@/lib/config';
import { getKrc20Balance } from '@/lib/kaspa/kasware';

export type HolderGateResult = {
  allowed: boolean;
  balance: number;
  source: 'kasware' | 'indexer' | 'none';
  reason?: string;
};

async function fetchIndexerBalance(address: string, ticker: string): Promise<number | null> {
  const url = `${config.krc20ApiBase}/krc20/address/${encodeURIComponent(address)}/token/${encodeURIComponent(ticker)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: Array<{ balance?: string; locked?: string }>;
      balance?: string;
    };
    if (Array.isArray(data.result) && data.result[0]) {
      return Number(data.result[0].balance ?? 0) / 1e8;
    }
    if (data.balance != null) return Number(data.balance) / 1e8;
    return null;
  } catch {
    return null;
  }
}

/**
 * Primary: Kasware getKRC20Balance.
 * Fallback: public KRC20 indexer.
 * Kascov is skipped unless VITE_KTLX_KCC20_DESCRIPTOR is set (future KCC20 path).
 */
export async function checkKtlxHolderAccess(address: string | null): Promise<HolderGateResult> {
  const min = config.alphaMinBalance;
  if (!address) {
    return { allowed: false, balance: 0, source: 'none', reason: 'Connect Kasware to verify KTLX holdings' };
  }

  if (!config.ktlxTicker && !config.ktlxCa) {
    return {
      allowed: true,
      balance: 0,
      source: 'none',
      reason: 'KTLX ticker not configured yet - preview mode for connected wallets',
    };
  }

  try {
    const bal = await getKrc20Balance(config.ktlxTicker);
    return {
      allowed: bal >= min,
      balance: bal,
      source: 'kasware',
      reason: bal >= min ? undefined : `Need at least ${min} ${config.ktlxTicker}`,
    };
  } catch {
    /* fallback */
  }

  const indexed = await fetchIndexerBalance(address, config.ktlxTicker);
  if (indexed != null) {
    return {
      allowed: indexed >= min,
      balance: indexed,
      source: 'indexer',
      reason: indexed >= min ? undefined : `Need at least ${min} ${config.ktlxTicker}`,
    };
  }

  if (config.ktlxKcc20Descriptor) {
    // Placeholder for future kascov KCC20 lookup. Descriptor configured but not wired in v1.
    return {
      allowed: false,
      balance: 0,
      source: 'none',
      reason: 'KCC20 descriptor set but kascov balance lookup is not enabled in this build',
    };
  }

  return {
    allowed: false,
    balance: 0,
    source: 'none',
    reason: 'Could not read KTLX balance from Kasware or indexer',
  };
}
