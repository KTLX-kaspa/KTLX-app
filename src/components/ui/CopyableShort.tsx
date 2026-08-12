import { useToast } from '@/components/ui/Toast';
import { shortenAddress, shortenId } from '@/lib/utils';

type Props = {
  value: string;
  kind?: 'address' | 'tx' | 'generic';
  left?: number;
  right?: number;
  className?: string;
};

export function CopyableShort({
  value,
  kind = 'generic',
  left,
  right,
  className,
}: Props) {
  const { push } = useToast();
  if (!value) return null;

  const display =
    kind === 'address'
      ? shortenAddress(value, left ?? 8, right ?? 6)
      : kind === 'tx'
        ? shortenId(value, left ?? 10, right ?? 8)
        : shortenId(value, left ?? 10, right ?? 8);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      push('Copied to clipboard', 'success');
    } catch {
      push('Could not copy', 'error');
    }
  }

  return (
    <span className={`copyable ${className ?? ''}`.trim()} title={value}>
      <code className="copyable-text">{display}</code>
      <button type="button" className="copyable-btn" onClick={() => void copy()} aria-label="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 8h10v12H8V8z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </span>
  );
}

/** Pull a readable tx hash from Kasware string or JSON-ish responses. */
export function extractTxDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const candidates = [
      parsed.txId,
      parsed.txid,
      parsed.transactionId,
      parsed.revealId,
      parsed.commitId,
      parsed.hash,
      parsed.id,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 8) return c;
    }
  } catch {
    /* keep raw */
  }
  return trimmed;
}
