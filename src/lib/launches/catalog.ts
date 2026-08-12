export type LaunchStatus = 'upcoming' | 'previous';

export type TokenLaunch = {
  id: string;
  ticker: string;
  name: string;
  status: LaunchStatus;
  launchAt: string;
  blurb: string;
  kronUrl?: string;
  supply?: string;
  highlights?: string[];
};

/** Static catalog for v1. Replace/extend with on-chain Alpha later. */
export const TOKEN_LAUNCHES: TokenLaunch[] = [
  {
    id: 'ktlx',
    ticker: 'KTLX',
    name: 'Kaspa Token Launches X',
    status: 'upcoming',
    launchAt: '2026-08-20T18:00:00.000Z',
    blurb: 'Utility token for KTLX holders: Alpha access, tools, and pay rails on Kaspa L1.',
    kronUrl: 'https://kron.technology/',
    supply: 'TBA',
    highlights: ['Holder Alpha', 'Bulk Split utility', 'KAS + KTLX payments'],
  },
  {
    id: 'sample-prev-1',
    ticker: 'DEMO',
    name: 'Demo Previous Launch',
    status: 'previous',
    launchAt: '2026-07-28T16:00:00.000Z',
    blurb: 'Placeholder previous launch card. Swap for a real Kron listing when ready.',
    kronUrl: 'https://kron.technology/',
    supply: '1B',
    highlights: ['Fair launch', 'Community driven'],
  },
];

export function getLaunchById(id: string): TokenLaunch | undefined {
  return TOKEN_LAUNCHES.find((t) => t.id === id);
}

export function getLaunchesByStatus(status: LaunchStatus): TokenLaunch[] {
  return TOKEN_LAUNCHES.filter((t) => t.status === status).sort((a, b) =>
    status === 'upcoming'
      ? a.launchAt.localeCompare(b.launchAt)
      : b.launchAt.localeCompare(a.launchAt),
  );
}
