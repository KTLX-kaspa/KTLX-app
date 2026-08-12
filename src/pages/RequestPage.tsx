import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import type { AssetId } from '@/lib/config';
import { ASSETS, config } from '@/lib/config';
import { buildPayPath, encodePayQuery } from '@/lib/payments/payment';

export function RequestPage() {
  const [to, setTo] = useState(config.treasuryAddress || '');
  const [amount, setAmount] = useState('1');
  const [asset, setAsset] = useState<AssetId>('KAS');
  const [memo, setMemo] = useState('');
  const [qr, setQr] = useState<string | null>(null);

  const path = useMemo(() => {
    const value = Number(amount);
    if (!to || !Number.isFinite(value) || value <= 0) return null;
    return buildPayPath({
      to: to.trim(),
      amount: value,
      asset,
      memo: memo.trim() || undefined,
    });
  }, [to, amount, asset, memo]);

  const absoluteUrl = path ? `${window.location.origin}${path}` : '';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!absoluteUrl) {
        setQr(null);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(absoluteUrl, {
          margin: 1,
          width: 220,
          color: { dark: '#0b1c1d', light: '#7fd3c5' },
        });
        if (!cancelled) setQr(dataUrl);
      } catch {
        if (!cancelled) setQr(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [absoluteUrl]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pay Request</h1>
          <p>Create a shareable link or QR that opens the payment module prefilled.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="field">
            <label>Destination</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="kaspa:..." />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Amount</label>
              <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="field">
              <label>Asset</label>
              <select value={asset} onChange={(e) => setAsset(e.target.value as AssetId)}>
                {Object.values(ASSETS).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Memo</label>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          {path && (
            <>
              <p className="muted" style={{ wordBreak: 'break-all' }}>
                {absoluteUrl}
              </p>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void navigator.clipboard.writeText(absoluteUrl)}
                >
                  Copy link
                </button>
                <a className="btn btn-ghost" href={path}>
                  Open pay panel
                </a>
              </div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Query: <code>{encodePayQuery({ to, amount: Number(amount), asset, memo })}</code>
              </p>
            </>
          )}
        </div>
        <div className="card" style={{ display: 'grid', placeItems: 'center' }}>
          {qr ? (
            <img src={qr} alt="Payment request QR" width={220} height={220} />
          ) : (
            <p className="muted">QR appears when the request is valid</p>
          )}
        </div>
      </div>
    </div>
  );
}
