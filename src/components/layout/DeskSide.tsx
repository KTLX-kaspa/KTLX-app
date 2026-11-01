import { useMemo, useState } from 'react';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { useSlotsDirectory } from '@/hooks/useSlotsDirectory';
import { SLOTS_GUIDE_STEPS } from '@/lib/ui/howItWorks';

export function DeskSide() {
  const { pathname } = useLocation();
  const boardMatch = useMatch('/slots/:genesisId');
  const { boards } = useSlotsDirectory();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const genesisId = (boardMatch?.params.genesisId || '').toLowerCase();
  const current = boards.find((board) => board.genesisId === genesisId);
  const isAlpha = pathname.startsWith('/alpha');

  const rows = useMemo(() => {
    return boards.filter((board) => {
      if (!query) return true;
      return board.topic.toLowerCase().includes(query) || board.type.toLowerCase().includes(query);
    });
  }, [boards, query]);

  return (
    <aside className="desk-side">
      <div className="desk-side-head">
        <h2>{isAlpha ? 'Alpha' : current ? 'How it works' : 'Boards'}</h2>
      </div>
      {isAlpha ? (
        <div className="desk-note">
          <p>Holder Alpha for sealed listings.</p>
          <p className="muted">Connect Kasware to open a listing.</p>
        </div>
      ) : current ? (
        <ol className="how-steps desk-guide">
          {SLOTS_GUIDE_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : (
        <>
          <label className="desk-search">
            <span className="sr-only">Filter boards</span>
            <input value={q} placeholder="Filter topics" onChange={(event) => setQ(event.target.value)} />
          </label>
          <div className="desk-index">
            {rows.map((board) => (
              <Link
                key={board.genesisId}
                to={`/slots/${board.genesisId}`}
                className={genesisId === board.genesisId ? 'desk-row active' : 'desk-row'}
              >
                <span className="desk-row-ticker">{board.topic}</span>
                <span className="muted">
                  {board.type} · {board.filled}/{board.count}
                </span>
              </Link>
            ))}
            {rows.length === 0 ? <p className="muted desk-note">No boards match.</p> : null}
          </div>
        </>
      )}
    </aside>
  );
}
