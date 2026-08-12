export type SplitRecipient = {
  address: string;
  amountKas: number;
};

export type SplitResult = {
  atomic: boolean;
  txHashes: string[];
  warning?: string;
};

const PRESETS_KEY = 'ktlx.split.presets.v1';

export type SplitPreset = {
  id: string;
  name: string;
  addresses: string[];
};

export function loadSplitPresets(): SplitPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SplitPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSplitPresets(presets: SplitPreset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function distributeEqual(total: number, count: number): number[] {
  if (count <= 0) return [];
  const sompiTotal = Math.round(total * 1e8);
  const base = Math.floor(sompiTotal / count);
  const remainder = sompiTotal - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 1e8);
}

export function buildEqualRecipients(addresses: string[], totalKas: number): SplitRecipient[] {
  const clean = addresses.map((a) => a.trim()).filter(Boolean);
  const amounts = distributeEqual(totalKas, clean.length);
  return clean.map((address, i) => ({ address, amountKas: amounts[i]! }));
}

/**
 * Multi-output KAS split via sequential Kasware sendKaspa.
 * Atomic PSKT path is attempted when signPskt/pushTx exist and a builder is available;
 * otherwise falls back to sequential sends with an explicit warning.
 */
export async function executeBulkSplit(
  recipients: SplitRecipient[],
  sendOne: (
    to: string,
    sompi: bigint,
  ) => Promise<string>,
  options?: {
    tryAtomic?: (
      outputs: Array<{ address: string; amountSompi: bigint }>,
    ) => Promise<string | null>;
  },
): Promise<SplitResult> {
  const outputs = recipients
    .filter((r) => r.address && r.amountKas > 0)
    .map((r) => ({
      address: r.address.trim(),
      amountSompi: BigInt(Math.round(r.amountKas * 1e8)),
    }));

  if (outputs.length === 0) throw new Error('Add at least one recipient with an amount');

  if (options?.tryAtomic) {
    try {
      const txid = await options.tryAtomic(outputs);
      if (txid) {
        return { atomic: true, txHashes: [txid] };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'PSKT_UNAVAILABLE') {
        /* continue to sequential */
      }
    }
  }

  const txHashes: string[] = [];
  for (const out of outputs) {
    const txid = await sendOne(out.address, out.amountSompi);
    txHashes.push(txid);
  }

  return {
    atomic: false,
    txHashes,
    warning:
      outputs.length > 1
        ? 'Sent as sequential transactions (wallet PSKT multi-out unavailable). Each recipient requires a separate approval.'
        : undefined,
  };
}
