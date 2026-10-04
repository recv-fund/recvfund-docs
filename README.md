# recvfund-docs

Documentation site for recv.fund, published at https://docs.recv.fund.

Next 15 (App Router) with Nextra 4 and the `nextra-theme-docs` theme. Pages
are MDX files under `content/`; the sidebar order comes from the `_meta.ts`
file in each folder. The build is a static export into `out/`, with a
Pagefind search index generated after the export.

## Run

```bash
yarn install
yarn dev          # http://localhost:3040
yarn build        # static export into out/ plus out/_pagefind
yarn start        # serve out/ on port 3040
yarn typecheck
yarn biome        # format and lint, writing fixes
yarn biome:ci     # format and lint, read-only (used in CI)
```

Node 22 or newer and yarn 1.22.

## Where it deploys

Every push to `main` deploys: `.github/workflows/deploy.yml` runs the
typecheck, Biome and `yarn build`, uploads `out/` to the server and switches
nginx to it (runbook: `recvfund-planning/ops/DEPLOYMENT.md`).

`out/` is a plain static site, servable by any static host that serves
`index.html` from directories (every route is exported as
`<route>/index.html` because `trailingSlash` is on). The public hostname is
`docs.recv.fund`; `public/llms.txt` and the `metadataBase` in
`app/layout.tsx` use that name.

## Layout

```
app/                 Next root layout, catch-all page, global styles
content/             MDX pages and _meta.ts sidebar definitions
public/llms.txt      one line per page, for language-model readers (generated)
scripts/llms-txt.mjs writes public/llms.txt from page front matter; runs before next build
types/css.d.ts       declaration for global stylesheet imports
```

## Sections

| Folder | Pages |
|---|---|
| `content/` | Welcome, What's new, Use cases |
| `content/deployment-guide/` | Introduction, Quick setup, Advanced setup, Script usage |
| `content/onboarding-guide/` | Introduction, Root account setup, Node configuration, Hot wallet, Merchant registration, Test payment, Funds sweeping |
| `content/features/` | Overview, Payment links, Customer deposit wallets, Projects, API keys, User management, Analytics, Payouts, Sweeps, Webhooks, Operator mode |
| `content/api-integration/` | Introduction, Payments API (overview, create payment, deposit options, assign deposit address, payment status, webhook), Checkout endpoints, Payouts API |
| `content/support/` | Glossary, Networks and tokens, Links, Change log, FAQ |

Every page states only what `../recvfund-server/docs/*.md` and the server
code implement. Pages about contracts, the fee and the program addresses
follow `../recvfund-contracts-evm/README.md` and
`../recvfund-contracts-solana/README.md`. Since 2026-10-03 the pages describe
the deposit-only payment model of the server branch
`feat/deposit-only-settlement`: every customer payment is a transfer to the
customer's deposit address, the fee is taken only at sweep and is fixed per
registration, and registration is one transaction. Features that are planned but not implemented (WalletConnect,
low-balance alerts, operator mode, the public ticker endpoint, deep-reorg
reconciliation) are marked as not available in this release. When the server
changes, update the page that describes it in the same change.

## Writing rules

- Front matter `title` and `description` on every page. Quote a description
  that contains a colon followed by a space, or the YAML parser fails the build.
- Internal links are absolute with a trailing slash: `/features/webhooks/`.
- Plain, precise technical language; no slang, hype or metaphors; no em-dashes.
- Every folder has a `_meta.ts` naming its pages in sidebar order.

## Verification

```bash
yarn typecheck
yarn biome:ci
yarn build        # fails on a bad _meta.ts key, invalid front matter or an MDX error
```

`yarn build` writes `out/` and reports the page count; `public/llms.txt` is
regenerated at the start. The `zod` resolution in `package.json` pins the
version `nextra-theme-docs` 4.6.1 was written against; with zod 4.6 the
theme's Layout props validation fails on every page.

## Writing pages

- Front matter: `title` and `description` on every page. The description is
  reused in `public/llms.txt`; keep the two in sync.
- Plain technical language, second person, short sentences. Commands and
  payloads go in code blocks.
- API reference pages must match `recvfund-server/docs/API.md` exactly.

## Handover rule

This repo is worked on by many agents across sessions. Before finishing any
task: commit in small conventional commits as the git global user (no
trailers), update this README and `docs/` so they stay true, and append a
dated entry to `../recvfund-planning/PROGRESS.md` (Handover log) with what
changed, what was verified and how, what is broken, and the next step. Full
rule: `../AGENTS.md`.
