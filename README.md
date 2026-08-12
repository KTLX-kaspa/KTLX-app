# Kaspa Token Launches X (KTLX)

Client-only utility app for **KTLX** on Kaspa L1: Kasware wallet connect, bulk KAS split, on-chain Alpha announcements, token launch cards, and a universal KAS / KTLX payment module with shareable pay-request links.

No custodial backend. No private keys in the app. Admin publishing is whoever controls the configured admin Kasware address.

## Stack

- Vite + React + TypeScript
- React Router
- Kasware (`window.kasware`)
- Static deploy on Vercel (`dist/`)

## Setup

```bash
npm install
cp .env.example .env
# fill VITE_ADMIN_ADDRESS, VITE_TREASURY_ADDRESS, and later VITE_KTLX_TICKER / VITE_KTLX_CA
npm run dev
```

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Local development server |
| `npm run build`   | Production static build  |
| `npm run preview` | Preview `dist/`          |

## Environment

All variables are public (`VITE_*`):

- `VITE_ADMIN_ADDRESS` - wallet allowed to publish Alpha payloads
- `VITE_TREASURY_ADDRESS` - default pay destination / Alpha dust target
- `VITE_KTLX_TICKER` / `VITE_KTLX_CA` - holder gate + KTLX payments (after launch)
- `VITE_ALPHA_MIN_BALANCE` - minimum KTLX for full Alpha tokenomics
- `VITE_KASPA_API_BASE` - explorer/API used to read admin txs + payloads
- `VITE_KRC20_API_BASE` - indexer fallback for KRC20 balances
- `VITE_KTLX_KCC20_DESCRIPTOR` - reserved for future kascov / KCC20 path

## Features

1. **Bulk Split** - multi-wallet KAS sends (sequential Kasware approvals; PSKT atomic path when available)
2. **Alpha** - publish `ktlx.alpha.v1` JSON as a tx payload; countdown + holder-gated tokenomics
3. **Pay / Pay Request** - KAS (native) + KTLX (KRC20 when Kasware supports it); QR + deep links to `/pay?...`
4. **Launches** - upcoming / previous cards with detail pages at `/launch/:id`

## GitHub + Vercel (separate identity)

Use your **KTLX** GitHub account (not any other product account):

```bash
git init
git add .
git commit -m "Initial KTLX utility app"
gh auth login
gh repo create ktlx-app --private --source=. --remote=origin --push
npx vercel login
npx vercel --prod
```

In Vercel: Framework Vite, output `dist`, add the same `VITE_*` env vars. SPA rewrites are in `vercel.json`.

## Security

- Never commit `.env`, private keys, or seed phrases.
- `.gitignore` already excludes secrets.
- Admin authority is on-chain wallet ownership, not an API key.

## Ecosystem links

- [Kron](https://kron.technology/)
- [Kasware](https://www.kasware.xyz/)
- [Kascov](https://kascov.io/)
- [KaspaCom](https://kaspa.com/)
- [Discord](https://discord.gg/exXp5JzdQv)
- [X](https://x.com/KaspaTokensL1)
