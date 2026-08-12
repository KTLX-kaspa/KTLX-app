import { getKasware } from '@/lib/kaspa/kasware';

/**
 * Attempts an atomic multi-output send when Kasware exposes PSKT APIs
 * and a WASM tx builder is wired. Currently returns null so callers
 * fall back to sequential sendKaspa (documented in UI).
 */
export async function tryAtomicMultiOut(
  _outputs: Array<{ address: string; amountSompi: bigint }>,
  _senderAddress: string,
): Promise<string | null> {
  const wallet = getKasware();
  if (!wallet?.signPskt || !wallet.pushTx) {
    throw new Error('PSKT_UNAVAILABLE');
  }
  // Reserved hook: build unsigned multi-out via kaspa WASM createTransactions,
  // then wallet.signPskt + pushTx.
  return null;
}
