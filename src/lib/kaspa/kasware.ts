export type KaswareBalance = {
  confirmed: number;
  unconfirmed: number;
  total: number;
};

export type KaswareProvider = {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<string>;
  switchNetwork?: (network: string) => Promise<void>;
  disconnect?: (origin?: string) => Promise<void>;
  getBalance: () => Promise<KaswareBalance | number>;
  getKRC20Balance?: (tickers?: string[]) => Promise<unknown>;
  getPublicKey?: () => Promise<string>;
  getUtxoEntries?: () => Promise<unknown[]>;
  sendKaspa: (
    toAddress: string,
    sompi: number | bigint | string,
    options?: { priorityFee?: number; payload?: string },
  ) => Promise<string>;
  signPskt?: (args: {
    txJsonString: string;
    options?: {
      signInputs?: Array<{
        index: number;
        sighashType?: number;
        address?: string;
        publicKey?: string;
      }>;
      autoFinalize?: boolean;
    };
  }) => Promise<string>;
  pushTx?: (txJsonString: string) => Promise<string>;
  signKRC20Transaction?: (params: unknown) => Promise<string>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    kasware?: KaswareProvider;
  }
}

export function getKasware(): KaswareProvider | null {
  return typeof window !== 'undefined' && window.kasware ? window.kasware : null;
}

export function isKaswareInstalled(): boolean {
  return Boolean(getKasware());
}

export async function connectKasware(): Promise<string> {
  const wallet = getKasware();
  if (!wallet) throw new Error('Kasware is not installed');
  const accounts = await wallet.requestAccounts();
  if (!accounts?.[0]) throw new Error('No Kasware account returned');
  return accounts[0];
}

export async function getKaswareAccounts(): Promise<string[]> {
  const wallet = getKasware();
  if (!wallet) return [];
  try {
    return (await wallet.getAccounts()) ?? [];
  } catch {
    return [];
  }
}

export async function ensureMainnet(): Promise<string> {
  const wallet = getKasware();
  if (!wallet) throw new Error('Kasware is not installed');
  const network = await wallet.getNetwork();
  if (network && network !== 'kaspa_mainnet' && wallet.switchNetwork) {
    await wallet.switchNetwork('kaspa_mainnet');
    return await wallet.getNetwork();
  }
  return network || 'kaspa_mainnet';
}

export function normalizeBalance(raw: KaswareBalance | number): KaswareBalance {
  if (typeof raw === 'number') {
    return { confirmed: raw, unconfirmed: 0, total: raw };
  }
  const confirmed = Number(raw.confirmed ?? 0);
  const unconfirmed = Number(raw.unconfirmed ?? 0);
  return {
    confirmed,
    unconfirmed,
    total: Number(raw.total ?? confirmed + unconfirmed),
  };
}

export async function getKasBalanceSompi(): Promise<bigint> {
  const wallet = getKasware();
  if (!wallet) throw new Error('Kasware is not installed');
  const bal = normalizeBalance(await wallet.getBalance());
  return BigInt(Math.floor(bal.confirmed));
}

function parseKrc20Balance(raw: unknown, ticker: string): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return Number(raw) || 0;
  if (Array.isArray(raw)) {
    const hit = raw.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const tick = String(
        (item as { tick?: string; ticker?: string; ca?: string }).tick ??
          (item as { ticker?: string }).ticker ??
          '',
      ).toUpperCase();
      return tick === ticker.toUpperCase();
    }) as { balance?: string | number; amount?: string | number } | undefined;
    if (!hit) return 0;
    return Number(hit.balance ?? hit.amount ?? 0) || 0;
  }
  if (typeof raw === 'object') {
    const map = raw as Record<string, unknown>;
    const direct = map[ticker] ?? map[ticker.toUpperCase()] ?? map[ticker.toLowerCase()];
    if (direct != null) return parseKrc20Balance(direct, ticker);
    if ('balance' in map || 'amount' in map) {
      return Number((map.balance ?? map.amount) as string | number) || 0;
    }
  }
  return 0;
}

export async function getKrc20Balance(ticker: string): Promise<number> {
  const wallet = getKasware();
  if (!wallet?.getKRC20Balance) throw new Error('Kasware KRC20 balance API unavailable');
  const raw = await wallet.getKRC20Balance([ticker]);
  return parseKrc20Balance(raw, ticker);
}

export async function sendKaspa(
  toAddress: string,
  sompi: bigint,
  options?: { priorityFee?: number; payloadHex?: string },
): Promise<string> {
  const wallet = getKasware();
  if (!wallet) throw new Error('Kasware is not installed');
  const txid = await wallet.sendKaspa(toAddress, sompi.toString(), {
    priorityFee: options?.priorityFee ?? 0,
    ...(options?.payloadHex ? { payload: options.payloadHex } : {}),
  });
  return typeof txid === 'string' ? txid : String(txid);
}

export async function signAndPushPskt(
  unsignedTxJson: string,
  signInputs: Array<{ index: number; address: string; publicKey?: string }>,
): Promise<string> {
  const wallet = getKasware();
  if (!wallet?.signPskt || !wallet.pushTx) {
    throw new Error('PSKT_UNAVAILABLE');
  }
  const signed = await wallet.signPskt({
    txJsonString: unsignedTxJson,
    options: {
      signInputs: signInputs.map((s) => ({ ...s, sighashType: 1 })),
      autoFinalize: true,
    },
  });
  const pushed = await wallet.pushTx(signed);
  return typeof pushed === 'string' ? pushed : String(pushed);
}

/** Best-effort KRC20 transfer via Kasware when available. */
export async function sendKrc20(params: {
  ticker: string;
  toAddress: string;
  amount: string;
  ca?: string;
}): Promise<string> {
  const wallet = getKasware();
  if (!wallet?.signKRC20Transaction) {
    throw new Error(
      'KRC20 transfers require a Kasware build that supports signKRC20Transaction. Configure ticker/CA after launch.',
    );
  }
  const result = await wallet.signKRC20Transaction({
    tick: params.ticker,
    to: params.toAddress,
    amount: params.amount,
    ca: params.ca,
    op: 'transfer',
  });
  return typeof result === 'string' ? result : String(result);
}
