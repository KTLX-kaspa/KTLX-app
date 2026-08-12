import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { sendKaspa } from '@/lib/kaspa/kasware';
import { tryAtomicMultiOut } from '@/lib/payments/atomicMultiOut';
import {
  buildEqualRecipients,
  executeBulkSplit,
  loadSplitPresets,
  saveSplitPresets,
  type SplitPreset,
} from '@/lib/payments/bulkSplit';
import { isKaspaAddress } from '@/lib/utils';

export function BulkSplitPanel() {
  const { address, connect, installed } = useWallet();
  const [total, setTotal] = useState('10');
  const [mode, setMode] = useState<'equal' | 'custom'>('equal');
  const [rows, setRows] = useState<Array<{ address: string; amount: string }>>([
    { address: '', amount: '' },
    { address: '', amount: '' },
  ]);
  const [presets, setPresets] = useState<SplitPreset[]>(() => loadSplitPresets());
  const [presetName, setPresetName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ txHashes: string[]; warning?: string; atomic: boolean } | null>(
    null,
  );

  const equalPreview = useMemo(() => {
    const addrs = rows.map((r) => r.address.trim()).filter(Boolean);
    const t = Number(total);
    if (!Number.isFinite(t) || t <= 0 || addrs.length === 0) return [];
    return buildEqualRecipients(addrs, t);
  }, [rows, total]);

  function addRow() {
    setRows((r) => [...r, { address: '', amount: '' }]);
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function applyPreset(preset: SplitPreset) {
    setRows(preset.addresses.map((address) => ({ address, amount: '' })));
  }

  function savePreset() {
    const addresses = rows.map((r) => r.address.trim()).filter(Boolean);
    if (!presetName.trim() || addresses.length === 0) return;
    const next: SplitPreset[] = [
      ...presets.filter((p) => p.name !== presetName.trim()),
      { id: crypto.randomUUID(), name: presetName.trim(), addresses },
    ];
    setPresets(next);
    saveSplitPresets(next);
    setPresetName('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!installed) {
      setError('Install Kasware first');
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

    const recipients =
      mode === 'equal'
        ? equalPreview
        : rows
            .map((r) => ({ address: r.address.trim(), amountKas: Number(r.amount) }))
            .filter((r) => r.address && r.amountKas > 0);

    if (recipients.some((r) => !isKaspaAddress(r.address))) {
      setError('One or more addresses look invalid');
      return;
    }
    if (recipients.length === 0) {
      setError('Add recipients and amounts');
      return;
    }

    setBusy(true);
    try {
      const out = await executeBulkSplit(
        recipients,
        (to, sompi) => sendKaspa(to, sompi),
        {
          tryAtomic: (outputs) => tryAtomicMultiOut(outputs, address ?? ''),
        },
      );
      setResult(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={(e) => void onSubmit(e)}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="split-total">Total KAS (equal mode)</label>
            <input
              id="split-total"
              type="number"
              min="0"
              step="any"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              disabled={mode !== 'equal'}
            />
          </div>
          <div className="field">
            <label htmlFor="split-mode">Distribution</label>
            <select
              id="split-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'equal' | 'custom')}
            >
              <option value="equal">Equal split</option>
              <option value="custom">Custom amounts</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Address</th>
              <th style={{ width: 140 }}>Amount (KAS)</th>
              <th style={{ width: 70 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <input
                    value={row.address}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, idx) => (idx === i ? { ...r, address: e.target.value } : r)),
                      )
                    }
                    placeholder="kaspa:…"
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      mode === 'equal'
                        ? equalPreview.find((p) => p.address === row.address.trim())?.amountKas ??
                          ''
                        : row.amount
                    }
                    disabled={mode === 'equal'}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)),
                      )
                    }
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => removeRow(i)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="row-actions">
          <button type="button" className="btn btn-ghost" onClick={addRow}>
            + Add wallet
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Confirm in Kasware…' : 'Split on-chain'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Local presets</h3>
        <div className="row-actions">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
            style={{ minWidth: 160 }}
          />
          <button type="button" className="btn btn-ghost" onClick={savePreset}>
            Save addresses
          </button>
        </div>
        {presets.length > 0 && (
          <div className="row-actions">
            {presets.map((p) => (
              <button key={p.id} type="button" className="btn btn-ghost" onClick={() => applyPreset(p)}>
                {p.name} ({p.addresses.length})
              </button>
            ))}
          </div>
        )}
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          Presets stay in this browser only. Prefer atomic multi-out when your Kasware build supports
          PSKT; otherwise each leg is a separate approval.
        </p>
      </div>

      {error && <p className="danger">{error}</p>}
      {result && (
        <div style={{ marginTop: '0.75rem' }}>
          <p className="success">
            {result.atomic ? 'Atomic multi-out sent.' : 'Sequential sends completed.'}{' '}
            {result.txHashes.length} tx(s).
          </p>
          {result.warning && <p className="muted">{result.warning}</p>}
          <ul>
            {result.txHashes.map((h) => (
              <li key={h}>
                <code style={{ wordBreak: 'break-all' }}>{h}</code>
              </li>
            ))}
          </ul>
          <Link to="/pay">Open payment module →</Link>
        </div>
      )}
    </div>
  );
}
