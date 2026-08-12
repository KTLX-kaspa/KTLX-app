import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/alpha', label: 'Alpha' },
  { to: '/split', label: 'Bulk Split' },
  { to: '/pay', label: 'Pay' },
  { to: '/request', label: 'Pay Request' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-top">
          <img className="brand-logo" src="/brand/ktlx-logo.png" alt="KTLX logo" />
          <span className="brand-ticker">KTLX</span>
        </div>
        <div className="brand-title">Kaspa Token Launches X</div>
        <div className="brand-socials">
          <a
            href="https://discord.gg/exXp5JzdQv"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            title="Discord"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.3 4.6A19 19 0 0 0 15.9 3.4l-.2.4c1.6.4 3.1 1 4.5 1.9-1.5-.9-3.2-1.5-5-1.9l-.3-.1A16.5 16.5 0 0 0 12 3c-.9 0-1.8.1-2.6.3l-.3.1c-1.8.4-3.5 1-5 1.9 1.4-.9 2.9-1.5 4.5-1.9l-.2-.4A19 19 0 0 0 3.7 4.6C1.7 7.8.7 10.8.9 13.8c2 1.5 3.9 2.4 5.8 3l.7-1.2c-.4-.2-.8-.4-1.2-.6.1-.1.2-.1.3-.2 2.4 1.1 5 1.1 7.4 0 .1.1.2.1.3.2-.4.2-.8.4-1.2.6l.7 1.2c1.9-.6 3.8-1.5 5.8-3 .3-3.4-.6-6.4-2.6-9.6zM8.7 12.8c-.7 0-1.3-.7-1.3-1.5S8 9.8 8.7 9.8s1.3.7 1.3 1.5-.6 1.5-1.3 1.5zm6.6 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5z" />
            </svg>
          </a>
          <a
            href="https://x.com/KaspaTokensL1"
            target="_blank"
            rel="noreferrer"
            aria-label="X"
            title="X"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.9-6.4L5.3 22H2.5l7-8L2 2h6.3l4.4 5.8L18.2 2zm-1.1 18h1.7L7 3.9H5.2L17.1 20z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="sidebar-banner">
        <img src="/brand/ktlx-banner.png" alt="Kaspa Token Launches banner" />
      </div>

      <nav className="nav" aria-label="Main">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="muted" style={{ marginTop: 'auto', fontSize: '0.75rem', padding: '0 0.5rem' }}>
        On-chain utilities for Kaspa L1. No custodial servers.
      </div>
    </aside>
  );
}
