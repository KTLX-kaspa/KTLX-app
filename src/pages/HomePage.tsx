import { Link } from 'react-router-dom';
import { getLaunchesByStatus, type TokenLaunch } from '@/lib/launches/catalog';

function LaunchCard({ launch }: { launch: TokenLaunch }) {
  return (
    <Link to={`/launch/${launch.id}`} className="card card-interactive" style={{ display: 'block', color: 'inherit' }}>
      <div className="launch-meta">
        <span className="badge">${launch.ticker}</span>
        <span className={launch.status === 'upcoming' ? 'badge badge-warn' : 'badge'}>
          {launch.status === 'upcoming' ? 'Upcoming' : 'Previous'}
        </span>
      </div>
      <h3 style={{ margin: '0.35rem 0' }}>{launch.name}</h3>
      <p className="muted" style={{ margin: 0 }}>
        {launch.blurb}
      </p>
      <p className="muted" style={{ margin: '0.65rem 0 0', fontSize: '0.82rem' }}>
        {launch.status === 'upcoming' ? 'Target' : 'Launched'}:{' '}
        {new Date(launch.launchAt).toUTCString()}
      </p>
    </Link>
  );
}

export function HomePage() {
  const upcoming = getLaunchesByStatus('upcoming');
  const previous = getLaunchesByStatus('previous');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Token launches</h1>
          <p>
            Upcoming and previous launches for KTLX. Open a card for tokenomics, links, and details.
          </p>
        </div>
      </div>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">Upcoming</h2>
        <div className="grid-2">
          {upcoming.map((launch) => (
            <LaunchCard key={launch.id} launch={launch} />
          ))}
          {upcoming.length === 0 && <p className="muted">No upcoming launches listed yet.</p>}
        </div>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">Previous</h2>
        <div className="grid-2">
          {previous.map((launch) => (
            <LaunchCard key={launch.id} launch={launch} />
          ))}
          {previous.length === 0 && <p className="muted">No previous launches listed yet.</p>}
        </div>
      </section>

      <h2 className="section-title">Tools</h2>
      <div className="grid-2">
        <Link to="/alpha" className="card card-interactive" style={{ display: 'block', color: 'inherit' }}>
          <h3 style={{ marginTop: 0 }}>Alpha</h3>
          <p className="muted">Countdown and tokenomics published on-chain. Holders unlock full details.</p>
        </Link>
        <Link to="/split" className="card card-interactive" style={{ display: 'block', color: 'inherit' }}>
          <h3 style={{ marginTop: 0 }}>Bulk Split</h3>
          <p className="muted">Split KAS across many wallets in one flow. Save recipient presets locally.</p>
        </Link>
        <Link to="/pay" className="card card-interactive" style={{ display: 'block', color: 'inherit' }}>
          <h3 style={{ marginTop: 0 }}>Pay</h3>
          <p className="muted">Universal payment panel for KAS and KTLX with optional memo payload.</p>
        </Link>
        <Link to="/request" className="card card-interactive" style={{ display: 'block', color: 'inherit' }}>
          <h3 style={{ marginTop: 0 }}>Pay Request</h3>
          <p className="muted">Create shareable payment links and QR codes for treasury or custom destinations.</p>
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Ecosystem</h3>
        <div className="row-actions">
          <a className="btn btn-ghost" href="https://kron.technology/" target="_blank" rel="noreferrer">
            Kron
          </a>
          <a className="btn btn-ghost" href="https://www.kasware.xyz/" target="_blank" rel="noreferrer">
            Kasware
          </a>
          <a className="btn btn-ghost" href="https://kascov.io/" target="_blank" rel="noreferrer">
            Kascov
          </a>
          <a className="btn btn-ghost" href="https://kaspa.com/" target="_blank" rel="noreferrer">
            KaspaCom
          </a>
        </div>
      </div>
    </div>
  );
}
