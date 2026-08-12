import type { AssetId } from '@/lib/config';
import { ASSETS, config } from '@/lib/config';
import { sendKaspa, sendKrc20 } from '@/lib/kaspa/kasware';
import { kasToSompi, utf8ToHex } from '@/lib/utils';

export type PaymentRequest = {
  to: string;
  amount: number;
  asset: AssetId;
  memo?: string;
};

export type PayResult = {
  txHash: string;
  asset: AssetId;
};

export function encodePayQuery(req: PaymentRequest): string {
  const params = new URLSearchParams();
  params.set('to', req.to);
  params.set('amount', String(req.amount));
  params.set('asset', req.asset);
  if (req.memo) params.set('memo', req.memo);
  return params.toString();
}

export function parsePayQuery(search: string): PaymentRequest | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const to = params.get('to') || config.treasuryAddress;
  const amount = Number(params.get('amount') || '');
  const asset = (params.get('asset') || 'KAS').toUpperCase() as AssetId;
  const memo = params.get('memo') || undefined;
  if (!to || !Number.isFinite(amount) || amount <= 0) return null;
  if (asset !== 'KAS' && asset !== 'KTLX') return null;
  return { to, amount, asset, memo };
}

export function buildPayPath(req: PaymentRequest): string {
  return `/pay?${encodePayQuery(req)}`;
}

export async function executePayment(req: PaymentRequest): Promise<PayResult> {
  const asset = ASSETS[req.asset];
  if (!asset) throw new Error('Unknown asset');

  if (req.asset === 'KAS') {
    const sompi = kasToSompi(req.amount);
    const payloadHex = req.memo ? utf8ToHex(req.memo) : undefined;
    const txHash = await sendKaspa(req.to, sompi, { payloadHex });
    return { txHash, asset: 'KAS' };
  }

  if (!config.ktlxTicker) {
    throw new Error('KTLX ticker is not configured yet');
  }
  const amountAtomic = String(Math.round(req.amount * 10 ** asset.decimals));
  const txHash = await sendKrc20({
    ticker: config.ktlxTicker,
    toAddress: req.to,
    amount: amountAtomic,
    ca: config.ktlxCa || undefined,
  });
  return { txHash, asset: 'KTLX' };
}
