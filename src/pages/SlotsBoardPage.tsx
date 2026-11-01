import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { JoinSlotForm } from '@/components/slots/JoinSlotForm';
import { SlotTable } from '@/components/slots/SlotTable';
import { CopyableShort } from '@/components/ui/CopyableShort';
import { useSlotsDirectory } from '@/hooks/useSlotsDirectory';
import { useWallet } from '@/hooks/useWallet';
import { bytesToHex } from '@/lib/kcc20/bytes';
import { nativeTicker } from '@/lib/config';
import { verifyBoard, type BoardSummary, type LiveBoard } from '@/lib/slots/directory';
import { type SlotJoinResult } from '@/lib/slots/join';
import { filledCount } from '@/lib/slots/math';
import { formatKas, sompiToKas } from '@/lib/utils';

const BOARD_POLL_MS = 6000;

type PendingJoin = {
  genesisId: string;
  keys: Uint8Array;
  txId: string;
};

function withPending(summary: BoardSummary | undefined, pending: PendingJoin | null): BoardSummary | undefined {
  if (!summary || !pending || pending.genesisId !== summary.genesisId) return summary;
  if (summary.seatTxs?.[0] === pending.txId) return summary;
  if (bytesToHex(summary.keys) === bytesToHex(pending.keys)) return summary;
  const seatTxs = [pending.txId, ...(summary.seatTxs ?? []).slice(0, Math.max(0, summary.count - 1))];
  return {
    ...summary,
    keys: pending.keys,
    seatTxs,
    filled: filledCount(pending.keys, summary.count),
    latestTxId: pending.txId,
    recent: [{ txId: pending.txId, at: Date.now() }, ...summary.recent.filter((row) => row.txId !== pending.txId)].slice(0, 12),
  };
}

function boardToShow(summary: BoardSummary | undefined, live: LiveBoard | null): BoardSummary | null {
  if (!summary) return null;
  if (!live || live.genesisId !== summary.genesisId) return summary;
  const announced = filledCount(summary.keys, summary.count);
  const checked = filledCount(live.keys, live.count);
  if (announced > checked) return summary;
  return live.seatTxs?.length ? live : { ...live, seatTxs: summary.seatTxs };
}

export function SlotsBoardPage() {
  const { genesisId = '' } = useParams();
  const { mode, boards, reload, loading } = useSlotsDirectory();
  const { address } = useWallet();
  const summary = boards.find((board) => board.genesisId === genesisId.toLowerCase());
  const [live, setLive] = useState<LiveBoard | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const [amount, setAmount] = useState('');
  const [pending, setPending] = useState<PendingJoin | null>(null);
  const [check, setCheck] = useState(0);
  const ticker = nativeTicker();
  const boardReady = Boolean(summary);
  const announced = withPending(summary, pending);
  const shown = boardToShow(announced, live);
  const tableIsLive = Boolean(
    shown &&
      live?.verified &&
      live.genesisId === shown.genesisId &&
      filledCount(live.keys, live.count) >= filledCount(shown.keys, shown.count),
  );
  const caughtUp =
    live &&
    shown &&
    live.genesisId === shown.genesisId &&
    live.verified &&
    filledCount(live.keys, live.count) >= filledCount(shown.keys, shown.count)
      ? live
      : null;
  const formBoard: LiveBoard | null = !announced
    ? null
    : (caughtUp ??
      (live && live.genesisId === announced.genesisId
        ? {
            ...live,
            keys: announced.keys,
            seatTxs: announced.seatTxs,
            filled: filledCount(announced.keys, announced.count),
            latestTxId: announced.latestTxId,
            verified: false,
            spend: null,
          }
        : {
            ...announced,
            address: '',
            treasury: new Uint8Array(32),
            topicHash: new Uint8Array(32),
            spend: null,
            verified: false,
          }));
  const summaryRef = useRef(summary);
  const pendingRef = useRef(pending);
  summaryRef.current = summary;
  pendingRef.current = pending;

  useEffect(() => {
    setPending(null);
  }, [genesisId]);

  useEffect(() => {
    const id = genesisId.toLowerCase();
    if (!id) return;
    let cancel = false;
    let ticket = 0;
    const run = () => {
      const current = summaryRef.current;
      if (!current || current.genesisId !== id) return;
      const board = withPending(current, pendingRef.current) ?? current;
      const mine = ++ticket;
      setUnreadable(false);
      void verifyBoard(mode, board)
        .then((next) => {
          if (cancel || mine !== ticket) return;
          setLive((prev) => {
            if (
              prev &&
              prev.genesisId === next.genesisId &&
              prev.verified &&
              !next.verified &&
              filledCount(prev.keys, prev.count) > filledCount(next.keys, next.count)
            ) {
              return prev;
            }
            return next;
          });
          setAmount((value) => value || String(sompiToKas(next.minSompi)));
        })
        .catch(() => {
          if (!cancel && mine === ticket) setUnreadable(true);
        });
    };
    run();
    const timer = window.setInterval(run, BOARD_POLL_MS);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [mode, genesisId, check, boardReady]);

  return (
    <div className="desk-doc">
      <div className="stack-md">
        <div className="row-actions">
          <Link className="btn btn-ghost" to="/">
            All boards
          </Link>
          <button
            type="button"
            className={`btn btn-ghost btn-icon${loading ? ' is-busy' : ''}`}
            aria-label="Refresh"
            data-tooltip="Refresh"
            onClick={() => {
              void reload().finally(() => setCheck((n) => n + 1));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M20 12a8 8 0 1 1-2.2-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 4v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {!summary ? (
          <section className="card">
            <h1>Board</h1>
            <p className="helper-text">This board is not in the directory yet. Refresh after the treasury payment is indexed.</p>
          </section>
        ) : (
          <>
            <section className="card stack-md">
              <header className="page-header">
                <h1>{summary.topic}</h1>
                <p>
                  {summary.type}. {summary.count} slots. Minimum {formatKas(sompiToKas(summary.minSompi))} {ticker}.
                </p>
              </header>
              <p className="helper-text">
                Genesis <CopyableShort value={summary.genesisId} kind="tx" />
              </p>
            </section>
            {shown ? (
              <div className="grid-3">
                <div className="stat-box">
                  <span className="muted">Joins</span>
                  <strong>{filledCount(shown.keys, shown.count)}</strong>
                </div>
                <div className="stat-box">
                  <span className="muted">Open</span>
                  <strong>{Math.max(0, shown.count - filledCount(shown.keys, shown.count))}</strong>
                </div>
                <div className="stat-box">
                  <span className="muted">Minimum</span>
                  <strong>
                    {formatKas(sompiToKas(shown.minSompi))} {ticker}
                  </strong>
                </div>
              </div>
            ) : null}
            <section className="card stack-md">
              {tableIsLive ? (
                <p className="helper-text">This table is the live board.</p>
              ) : (
                <p className="helper-text">This table is the last announced board. It is not confirmed on the network yet.</p>
              )}
              {shown ? (
                <SlotTable board={shown} mode={mode} wallet={address} principalKas={Number(amount) || sompiToKas(shown.minSompi)} />
              ) : (
                <p className="helper-text">
                  {unreadable ? 'Could not read this board from the network.' : 'Reading the live board.'}
                </p>
              )}
            </section>
          </>
        )}
      </div>
      <aside className="desk-inspector">
        {formBoard ? (
          <JoinSlotForm
            board={formBoard}
            mode={mode}
            address={address}
            amount={amount}
            onAmount={setAmount}
            onJoined={(joined: SlotJoinResult) => {
              if (!summary) return;
              setPending({
                genesisId: summary.genesisId,
                keys: joined.keys,
                txId: joined.txId,
              });
              void reload().finally(() => setCheck((n) => n + 1));
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}
