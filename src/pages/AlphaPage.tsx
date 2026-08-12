import { useEffect, useState } from 'react';
import { Countdown } from '@/components/alpha/Countdown';
import { CopyableShort, extractTxDisplay } from '@/components/ui/CopyableShort';
import { useToast } from '@/components/ui/Toast';
import { useWallet } from '@/hooks/useWallet';
import { config } from '@/lib/config';
import { checkKtlxHolderAccess, type HolderGateResult } from '@/lib/alpha/holderGate';
import {
  ALPHA_PROTOCOL,
  encodeAlphaPayload,
  fetchLatestAlpha,
  type AlphaAnnouncement,
} from '@/lib/alpha/protocol';
import { sendKaspa } from '@/lib/kaspa/kasware';
import { kasToSompi } from '@/lib/utils';

const DUST_KAS = 0.2;

function AdminPublishForm({ onPublished }: { onPublished: () => void }) {
  const { address } = useWallet();
  const { push } = useToast();
  const [ticker, setTicker] = useState('NEW');
  const [title, setTitle] = useState('');
  const [launchAt, setLaunchAt] = useState('');
  const [blurb, setBlurb] = useState('');
  const [supply, setSupply] = useState('');
  const [lp, setLp] = useState('');
  const [team, setTeam] = useState('');
  const [notes, setNotes] = useState('');
  const [kronUrl, setKronUrl] = useState('https://kron.technology/');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTxid(null);
    if (!address) {
      setError('Connect admin wallet');
      return;
    }
    if (!launchAt || !title.trim()) {
      setError('Title and launch time are required');
      return;
    }
    const announcement: AlphaAnnouncement = {
      protocol: ALPHA_PROTOCOL,
      ticker: ticker.trim().toUpperCase(),
      title: title.trim(),
      blurb: blurb.trim(),
      launchAt: new Date(launchAt).toISOString(),
      tokenomics: {
        supply: supply.trim() || undefined,
        lp: lp.trim() || undefined,
        team: team.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      kronUrl: kronUrl.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    const payloadHex = encodeAlphaPayload(announcement);
    setBusy(true);
    try {
      const to = config.treasuryAddress || address;
      const hash = extractTxDisplay(await sendKaspa(to, kasToSompi(DUST_KAS), { payloadHex }));
      setTxid(hash);
      push('Alpha announcement published on-chain', 'success');
      onPublished();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed';
      setError(msg);
      push(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={(e) => void publish(e)}>
      <h2 style={{ marginTop: 0 }}>Publish Alpha (on-chain)</h2>
      <p className="muted">
        Writes a <code>{ALPHA_PROTOCOL}</code> JSON payload via Kasware. Anyone can read the latest
        announcement from your admin address. No server.
      </p>
      <div className="grid-2">
        <div className="field">
          <label>Ticker</label>
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} />
        </div>
        <div className="field">
          <label>Launch (local time)</label>
          <input
            type="datetime-local"
            value={launchAt}
            onChange={(e) => setLaunchAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label>Blurb</label>
        <textarea rows={3} value={blurb} onChange={(e) => setBlurb(e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Supply</label>
          <input value={supply} onChange={(e) => setSupply(e.target.value)} />
        </div>
        <div className="field">
          <label>LP</label>
          <input value={lp} onChange={(e) => setLp(e.target.value)} />
        </div>
        <div className="field">
          <label>Team</label>
          <input value={team} onChange={(e) => setTeam(e.target.value)} />
        </div>
        <div className="field">
          <label>Kron URL</label>
          <input value={kronUrl} onChange={(e) => setKronUrl(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Confirm in Kasware...' : `Publish (~${DUST_KAS} KAS + fees)`}
      </button>
      {error && <p className="danger">{error}</p>}
      {txid && (
        <p className="success" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          Published. Tx: <CopyableShort value={txid} kind="tx" />
        </p>
      )}
    </form>
  );
}

export function AlphaPage() {
  const { address, isAdmin, connect, installed } = useWallet();
  const [gate, setGate] = useState<HolderGateResult | null>(null);
  const [announcement, setAnnouncement] = useState<AlphaAnnouncement | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      const latest = await fetchLatestAlpha(config.kaspaApiBase, config.adminAddress);
      setAnnouncement(latest?.announcement ?? null);
      setTxId(latest?.txId ?? null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load alpha');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await checkKtlxHolderAccess(address);
      if (!cancelled) setGate(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const canSeeFull = Boolean(isAdmin || gate?.allowed);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alpha</h1>
          <p>Holder-gated launch intel. Announcements are published on-chain from the admin wallet.</p>
        </div>
        <span className="badge">On-chain</span>
      </div>

      {!config.adminAddress && (
        <div className="card">
          <p className="danger">
            Set <code>VITE_ADMIN_ADDRESS</code> so the app knows which wallet may publish Alpha.
          </p>
        </div>
      )}

      {isAdmin && <AdminPublishForm onPublished={() => void refresh()} />}

      <div className="card">
        {loading && <p className="muted">Loading announcements...</p>}
        {loadError && <p className="danger">{loadError}</p>}
        {!loading && !announcement && (
          <p className="muted">No on-chain Alpha announcement found yet for the admin address.</p>
        )}
        {announcement && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div className="badge">{announcement.ticker}</div>
                <h2 style={{ margin: '0.5rem 0' }}>{announcement.title}</h2>
                <p className="muted">{announcement.blurb}</p>
              </div>
              {announcement.kronUrl && (
                <a className="btn btn-primary" href={announcement.kronUrl} target="_blank" rel="noreferrer">
                  Open on Kron
                </a>
              )}
            </div>
            <div style={{ margin: '1rem 0' }}>
              <Countdown targetIso={announcement.launchAt} />
            </div>
            <p className="muted" style={{ fontSize: '0.85rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>Launch (UTC): {new Date(announcement.launchAt).toUTCString()}</span>
              {txId ? (
                <>
                  <span>|</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    Tx <CopyableShort value={txId} kind="tx" />
                  </span>
                </>
              ) : null}
            </p>

            {!address && installed && (
              <div className="row-actions">
                <button type="button" className="btn btn-primary" onClick={() => void connect()}>
                  Connect to unlock holder details
                </button>
              </div>
            )}

            {gate && !canSeeFull && (
              <p className="muted">
                Teaser only. {gate.reason || `Hold ${config.alphaMinBalance}+ ${config.ktlxTicker} for full tokenomics.`}
              </p>
            )}

            {canSeeFull ? (
              <div style={{ marginTop: '1rem' }}>
                <h3>Tokenomics</h3>
                <ul>
                  {announcement.tokenomics.supply && <li>Supply: {announcement.tokenomics.supply}</li>}
                  {announcement.tokenomics.lp && <li>LP: {announcement.tokenomics.lp}</li>}
                  {announcement.tokenomics.team && <li>Team: {announcement.tokenomics.team}</li>}
                  {announcement.tokenomics.notes && <li>Notes: {announcement.tokenomics.notes}</li>}
                </ul>
                {gate?.source && gate.source !== 'none' && (
                  <p className="muted" style={{ fontSize: '0.8rem' }}>
                    Access via {gate.source}
                    {gate.balance > 0 ? ` | balance ${gate.balance}` : ''}
                  </p>
                )}
              </div>
            ) : (
              <div className="card" style={{ marginTop: '1rem', background: 'rgba(11,28,29,0.6)' }}>
                <p className="muted">Full tokenomics unlock for KTLX holders after connect + balance check.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
