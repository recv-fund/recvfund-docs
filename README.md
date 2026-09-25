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

`out/` is a plain static site. Upload it to any static host that serves
`index.html` from directories (every route is exported as
`<route>/index.html` because `trailingSlash` is on). The public hostname is
`docs.recv.fund`; `public/llms.txt` and the `metadataBase` in
`app/layout.tsx` use that name.

## Layout

```
app/                 Next root layout, catch-all page, global styles
content/             MDX pages and _meta.ts sidebar definitions
public/llms.txt      one line per page, for language-model readers
types/css.d.ts       declaration for global stylesheet imports
```

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
