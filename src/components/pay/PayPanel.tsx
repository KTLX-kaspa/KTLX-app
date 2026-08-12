import { useEffect, useState } from 'react';
import { CopyableShort, extractTxDisplay } from '@/components/ui/CopyableShort';
import { useToast } from '@/components/ui/Toast';
import type { AssetId } from '@/lib/config';
import { ASSETS, config } from '@/lib/config';
import { executePayment, type PaymentRequest } from '@/lib/payments/payment';
import { useWallet } from '@/hooks/useWallet';

type Props = {
  initial?: Partial<PaymentRequest>;
  compact?: boolean;
  onPaid?: (txid: string) => void;
};

export function PayPanel({ initial, compact, onPaid }: Props) {
  const { address, connect, installed } = useWallet();
  const { push } = useToast();
  const [to, setTo] = useState(initial?.to || config.treasuryAddress || '');
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '');
  const [asset, setAsset] = useState<AssetId>(initial?.asset || 'KAS');
  const [memo, setMemo] = useState(initial?.memo || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.to) setTo(initial.to);
    if (initial?.amount != null) setAmount(String(initial.amount));
    if (initial?.asset) setAsset(initial.asset);
    if (initial?.memo) setMemo(initial.memo);
  }, [initial?.to, initial?.amount, initial?.asset, initial?.memo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTxid(null);
    if (!installed) {
      setError('Install Kasware to pay on-chain');
      return;
    }
    if (!address) {
      try {
        await connect();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connect failed');
        return;
      }
    }
    const value = Number(amount);
    if (!to || !Number.isFinite(value) || value <= 0) {
      setError('Enter a valid destination and amount');
      return;
    }
    setBusy(true);
    try {
      const result = await executePayment({
        to: to.trim(),
        amount: value,
        asset,
        memo: memo.trim() || undefined,
      });
      const display = extractTxDisplay(result.txHash);
      setTxid(display);
      onPaid?.(display);
      push('Payment sent', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setError(msg);
      push(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={compact ? undefined : 'card'} onSubmit={(e) => void onSubmit(e)}>
      {!compact && <h2 style={{ marginTop: 0 }}>Pay</h2>}
      <div className="field">
        <label htmlFor="pay-to">To address</label>
        <input id="pay-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="kaspa:..." required />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="pay-amount">Amount</label>
          <input
            id="pay-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="pay-asset">Asset</label>
          <select id="pay-asset" value={asset} onChange={(e) => setAsset(e.target.value as AssetId)}>
            {Object.values(ASSETS).map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="pay-memo">Memo (optional on-chain payload for KAS)</label>
        <input id="pay-memo" value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={200} />
      </div>
      <div className="row-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Confirm in Kasware...' : `Pay ${ASSETS[asset].label}`}
        </button>
      </div>
      {error && <p className="danger">{error}</p>}
      {txid && (
        <p className="success" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          Sent. Tx: <CopyableShort value={txid} kind="tx" />
        </p>
      )}
    </form>
  );
}

type ModalProps = Props & {
  open: boolean;
  onClose: () => void;
  title?: string;
};

export function PayModal({ open, onClose, title = 'Payment', ...rest }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <PayPanel {...rest} compact />
        </div>
      </div>
    </div>
  );
}
