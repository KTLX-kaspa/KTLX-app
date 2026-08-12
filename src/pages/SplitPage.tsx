import { BulkSplitPanel } from '@/components/split/BulkSplitPanel';

export function SplitPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bulk Split</h1>
          <p>Send KAS to many wallets. Equal or custom amounts. Presets stay in your browser.</p>
        </div>
      </div>
      <BulkSplitPanel />
    </div>
  );
}
