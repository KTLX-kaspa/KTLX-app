import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { ConnectButton } from '@/components/wallet/ConnectButton';

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <header className="topbar">
          <ConnectButton />
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
