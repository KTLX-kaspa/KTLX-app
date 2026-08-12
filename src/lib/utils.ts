export const SOMPI_PER_KAS = 100_000_000n;

export function kasToSompi(kas: number | string): bigint {
  const n = typeof kas === 'string' ? Number(kas) : kas;
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid KAS amount');
  return BigInt(Math.round(n * 1e8));
}

export function sompiToKas(sompi: bigint | number): number {
  const v = typeof sompi === 'bigint' ? Number(sompi) : sompi;
  return v / 1e8;
}

export function formatKas(amount: number | bigint, digits = 4): string {
  const n = typeof amount === 'bigint' ? sompiToKas(amount) : amount;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function shortenAddress(address: string, left = 8, right = 6): string {
  if (!address || address.length <= left + right + 3) return address;
  return `${address.slice(0, left)}...${address.slice(-right)}`;
}

export function shortenId(value: string, left = 10, right = 8): string {
  if (!value || value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function utf8ToHex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToUtf8(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!clean || clean.length % 2 !== 0) throw new Error('Invalid hex');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

export function isKaspaAddress(address: string): boolean {
  return /^(kaspa|kaspatest|kaspa[a-z]*):[a-z0-9]+$/i.test(address.trim());
}
