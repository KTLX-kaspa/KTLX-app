import { useState } from 'react';
import { CopyableShort } from '@/components/ui/CopyableShort';
import { useWallet } from '@/hooks/useWallet';
import { formatKas } from '@/lib/utils';

export function ConnectButton() {
  const { installed, connecting, address, kasBalance, connect, disconnect, error } = useWallet();
  const [busy, setBusy] = useState(false);

  if (!installed) {
    return (
      <a
        className="btn btn-primary"
        href="https://www.kasware.xyz/"
        target="_blank"
        rel="noreferrer"
      >
        Install Kasware
      </a>
    );
  }

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {kasBalance != null && (
          <span className="wallet-chip">{formatKas(kasBalance)} KAS</span>
        )}
        <span className="wallet-chip">
          <CopyableShort value={address} kind="address" />
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => void disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        type="button"
        className="btn btn-primary"
        disabled={connecting || busy}
        onClick={() => {
          setBusy(true);
          void connect().finally(() => setBusy(false));
        }}
      >
        <span aria-hidden>◈</span>
        {connecting || busy ? 'Connecting...' : 'Connect'}
      </button>
      {error && <span className="danger" style={{ fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
}
