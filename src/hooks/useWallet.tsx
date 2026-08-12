import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  connectKasware,
  ensureMainnet,
  getKasBalanceSompi,
  getKasware,
  getKaswareAccounts,
  getKrc20Balance,
  isKaswareInstalled,
  normalizeBalance,
} from '@/lib/kaspa/kasware';
import { config } from '@/lib/config';
import { sompiToKas } from '@/lib/utils';

type WalletState = {
  installed: boolean;
  connecting: boolean;
  address: string | null;
  network: string | null;
  kasBalance: number | null;
  ktlxBalance: number | null;
  isAdmin: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [kasBalance, setKasBalance] = useState<number | null>(null);
  const [ktlxBalance, setKtlxBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!address) {
      setKasBalance(null);
      setKtlxBalance(null);
      return;
    }
    try {
      const sompi = await getKasBalanceSompi();
      setKasBalance(sompiToKas(sompi));
    } catch {
      setKasBalance(null);
    }
    if (config.ktlxTicker) {
      try {
        const bal = await getKrc20Balance(config.ktlxTicker);
        setKtlxBalance(bal);
      } catch {
        setKtlxBalance(null);
      }
    }
  }, [address]);

  const hydrate = useCallback(async () => {
    const has = isKaswareInstalled();
    setInstalled(has);
    if (!has) return;
    try {
      const accounts = await getKaswareAccounts();
      if (accounts[0]) {
        setAddress(accounts[0]);
        const net = await ensureMainnet();
        setNetwork(net);
      }
    } catch {
      /* not connected yet */
    }
  }, []);

  useEffect(() => {
    void hydrate();
    const onAccounts = (...args: unknown[]) => {
      const next = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      setAddress(next[0] ?? null);
    };
    const wallet = getKasware();
    wallet?.on?.('accountsChanged', onAccounts);
    return () => wallet?.removeListener?.('accountsChanged', onAccounts);
  }, [hydrate]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (!isKaswareInstalled()) {
        throw new Error('Kasware wallet not found. Install from kasware.xyz');
      }
      const addr = await connectKasware();
      const net = await ensureMainnet();
      setAddress(addr);
      setNetwork(net);
      const wallet = getKasware();
      if (wallet) {
        const bal = normalizeBalance(await wallet.getBalance());
        setKasBalance(sompiToKas(BigInt(Math.floor(bal.confirmed))));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const wallet = getKasware();
    try {
      await wallet?.disconnect?.(window.location.origin);
    } catch {
      /* optional API */
    }
    setAddress(null);
    setKasBalance(null);
    setKtlxBalance(null);
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      installed,
      connecting,
      address,
      network,
      kasBalance,
      ktlxBalance,
      isAdmin: Boolean(
        address &&
          config.adminAddress &&
          address.toLowerCase() === config.adminAddress.toLowerCase(),
      ),
      error,
      connect,
      disconnect,
      refreshBalances,
    }),
    [
      installed,
      connecting,
      address,
      network,
      kasBalance,
      ktlxBalance,
      error,
      connect,
      disconnect,
      refreshBalances,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
