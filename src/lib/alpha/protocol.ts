export const ALPHA_PROTOCOL = 'ktlx.alpha.v1' as const;

export type AlphaAnnouncement = {
  protocol: typeof ALPHA_PROTOCOL;
  ticker: string;
  launchAt: string;
  title: string;
  blurb: string;
  tokenomics: {
    supply?: string;
    lp?: string;
    team?: string;
    notes?: string;
  };
  kronUrl?: string;
  imageUrl?: string;
  updatedAt: string;
};

export function isAlphaAnnouncement(value: unknown): value is AlphaAnnouncement {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.protocol === ALPHA_PROTOCOL &&
    typeof v.ticker === 'string' &&
    typeof v.launchAt === 'string' &&
    typeof v.title === 'string'
  );
}

export function encodeAlphaPayload(announcement: AlphaAnnouncement): string {
  const json = JSON.stringify(announcement);
  const bytes = new TextEncoder().encode(json);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function decodeAlphaPayload(hexOrText: string): AlphaAnnouncement | null {
  try {
    let text = hexOrText;
    if (/^[0-9a-fA-F]+$/.test(hexOrText) && hexOrText.length % 2 === 0) {
      const bytes = new Uint8Array(hexOrText.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Number.parseInt(hexOrText.slice(i * 2, i * 2 + 2), 16);
      }
      text = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(text) as unknown;
    return isAlphaAnnouncement(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type TxLike = {
  transaction_id?: string;
  transactionId?: string;
  payload?: string | null;
  accepting_block_time?: number;
  acceptingBlockTime?: number;
  block_time?: number;
  blockTime?: number;
};

function txTime(tx: TxLike): number {
  return Number(
    tx.accepting_block_time ??
      tx.acceptingBlockTime ??
      tx.block_time ??
      tx.blockTime ??
      0,
  );
}

/**
 * Fetch recent txs for the admin address and return the latest valid Alpha announcement.
 * Uses Kaspa REST address transactions with payload when available.
 */
export async function fetchLatestAlpha(
  apiBase: string,
  adminAddress: string,
): Promise<{ announcement: AlphaAnnouncement; txId: string | null } | null> {
  if (!adminAddress) return null;

  const bases = [
    `${apiBase}/addresses/${encodeURIComponent(adminAddress)}/full-transactions?limit=50`,
    `${apiBase}/addresses/${encodeURIComponent(adminAddress)}/transactions?limit=50`,
    `${apiBase}/v1/addresses/${encodeURIComponent(adminAddress)}/transactions?limit=50`,
  ];

  let txs: TxLike[] = [];
  for (const url of bases) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) {
        txs = data as TxLike[];
        break;
      }
      if (data && typeof data === 'object') {
        const obj = data as { transactions?: TxLike[]; items?: TxLike[] };
        if (Array.isArray(obj.transactions)) {
          txs = obj.transactions;
          break;
        }
        if (Array.isArray(obj.items)) {
          txs = obj.items;
          break;
        }
      }
    } catch {
      /* try next */
    }
  }

  if (txs.length === 0) return null;

  const ranked = [...txs].sort((a, b) => txTime(b) - txTime(a));
  for (const tx of ranked) {
    if (!tx.payload) continue;
    const announcement = decodeAlphaPayload(tx.payload);
    if (announcement) {
      return {
        announcement,
        txId: tx.transaction_id ?? tx.transactionId ?? null,
      };
    }
  }
  return null;
}
