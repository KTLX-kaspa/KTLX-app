import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { WalletProvider } from '@/hooks/useWallet';
import { AlphaPage } from '@/pages/AlphaPage';
import { HomePage } from '@/pages/HomePage';
import { LaunchPage } from '@/pages/LaunchPage';
import { PayPage } from '@/pages/PayPage';
import { RequestPage } from '@/pages/RequestPage';
import { SplitPage } from '@/pages/SplitPage';
import '@/styles/app.css';

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="launch/:id" element={<LaunchPage />} />
              <Route path="alpha" element={<AlphaPage />} />
              <Route path="split" element={<SplitPage />} />
              <Route path="pay" element={<PayPage />} />
              <Route path="request" element={<RequestPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ToastProvider>
  );
}
