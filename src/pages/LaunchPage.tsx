import { Link, useParams } from 'react-router-dom';
import { Countdown } from '@/components/alpha/Countdown';
import { getLaunchById } from '@/lib/launches/catalog';

export function LaunchPage() {
  const { id } = useParams();
  const launch = id ? getLaunchById(id) : undefined;

  if (!launch) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Launch not found</h1>
            <p>That token launch id is not in the catalog.</p>
          </div>
        </div>
        <Link className="btn btn-ghost" to="/">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="launch-meta">
            <span className="badge">${launch.ticker}</span>
            <span className={launch.status === 'upcoming' ? 'badge badge-warn' : 'badge'}>
              {launch.status === 'upcoming' ? 'Upcoming' : 'Previous'}
            </span>
          </div>
          <h1>{launch.name}</h1>
          <p>{launch.blurb}</p>
        </div>
        {launch.kronUrl && (
          <a className="btn btn-primary" href={launch.kronUrl} target="_blank" rel="noreferrer">
            Open on Kron
          </a>
        )}
      </div>

      <div className="card">
        {launch.status === 'upcoming' ? (
          <>
            <h2 style={{ marginTop: 0 }}>Countdown</h2>
            <Countdown targetIso={launch.launchAt} />
            <p className="muted" style={{ marginTop: '0.85rem', fontSize: '0.85rem' }}>
              Target (UTC): {new Date(launch.launchAt).toUTCString()}
            </p>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Launched (UTC): {new Date(launch.launchAt).toUTCString()}
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Details</h2>
        <ul>
          {launch.supply && <li>Supply: {launch.supply}</li>}
          {(launch.highlights ?? []).map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="row-actions">
          <Link className="btn btn-ghost" to="/">
            All launches
          </Link>
          <Link className="btn btn-ghost" to="/alpha">
            Holder Alpha
          </Link>
        </div>
      </div>
    </div>
  );
}
