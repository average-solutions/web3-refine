# web3-refine

Personal Chrome extension that adds power-user tooling to web3 explorers.

## Features

| Feature | What it does |
|---|---|
| Transaction tool links | On a transaction page, adds `Open in` links that reopen the same transaction in **Tenderly**, **Dedaub** and **Phalcon**. Only tools that actually index the chain are offered, so there are no dead links; on a chain none of them cover, nothing is injected. |

```
Transaction details   Open in  ( Tenderly ) ( Dedaub ) ( Phalcon )
```

## Supported explorers

Any Blockscout frontend. The chain is detected at runtime, so a host does not need to be
known ahead of time — only listed in `content_scripts.matches` so Chrome injects there.

| Host | Covers |
|---|---|
| `*.blockscout.com` | ~50 public instances, mainnets and testnets |
| `explorer.optimism.io` | OP Mainnet (10) — `optimism.blockscout.com` redirects here |
| `gnosisscan.io` | Gnosis (100) — `gnosis.blockscout.com` redirects here |

## Install

```sh
bun install
bun run build
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select the `dist/` directory.

Chrome 137 and later ignore the `--load-extension` command-line flag, so the
`chrome://extensions` route above is the only way to side-load. (Automated verification of
this repo loads `dist/` through the CDP `Extensions.loadUnpacked` command instead.)

The extension requests **no permissions**. It reads the chain id with a same-origin
request, which needs none.

## How it works

`src/content/blockscout.ts` runs on the hosts listed above and, for each transaction page,
resolves the chain id and asks every tool for a URL.

**Getting the transaction hash.** From `location.pathname` only — Blockscout's route is
`/tx/[hash]` and its tabs are query parameters (`?tab=logs`), never extra path segments.

**Getting the chain id.** Harder than it looks. The tx page HTML contains no chain id at
all, and `window.__envs` lives in the page world where an isolated content script cannot
reach it. Every Blockscout frontend does serve `/assets/envs.js` containing
`NEXT_PUBLIC_NETWORK_ID: "1"`, so `src/platform/blockscout.ts` fetches that same-origin and
regexes it. That file is a JS object literal with unquoted keys, so it is not JSON and is
never parsed as such. The result is memoized per page load, as an in-flight promise, so
concurrent callers and SPA navigations share one request.

Detecting the chain at runtime rather than mapping hostnames means self-hosted and
rebranded Blockscout deployments work too, and hosts with several subdomain labels
(`nexus.testnet.blockscout.com`) do not need special cases.

**Surviving the SPA.** Blockscout is a Next.js app: `document_idle` fires once, but routes
change without a reload and React re-renders the header away. A single debounced
`MutationObserver` re-runs the sync, which is a no-op whenever the injected bar already
matches the current hash — that check is also what stops the observer feeding itself.

**Placement.** Anchored on `h1` (falling back to `[role="tablist"]`) because Blockscout's
emotion class names (`css-1ysmdhs`) carry a build hash and change between releases.

## Tool coverage

| Tool | URL | Chains |
|---|---|---|
| Tenderly | `dashboard.tenderly.co/tx/{hash}` | 95 |
| Dedaub | `app.dedaub.com/{slug}/tx/{hash}` | 9 |
| Phalcon | `app.blocksec.com/phalcon/explorer/tx/{slug}/{hash}` | 43 |

Each tool owns its own chain table in `src/core/tools/`, with the upstream source cited in
the file, because the three address chains differently: Tenderly's URL carries no chain at
all (every chain-scoped form redirects to the chainless one), while Dedaub and Phalcon use
two unrelated slug vocabularies. A shared table would be a false abstraction.

Deliberate exclusions, all verified upstream rather than assumed: Dedaub omits Gnosis
(absent from its network enum, though MetaSuites still maps it) and Fantom (`is_etl:false`,
so transactions are not indexed); Phalcon omits Solana (not EVM).

## Adding a tool

1. Add `src/core/tools/<name>.ts` exporting a `TxTool` — an `id`, a `label`, and
   `txUrl(chainId, hash)` returning `null` for chains it does not cover.
2. Add it to `TX_TOOLS` in `src/core/tools/index.ts`. Array order is display order.

No changes to the content script or CSS are needed.

## Development

```sh
bun run check      # typecheck + tests + build
bun run watch      # rebuild dist/ on change
```

After a rebuild, press the reload button on the extension card in `chrome://extensions`.

## Known limitations

- Only Blockscout-based explorers are supported. Etherscan and its family use a different
  DOM and expose no `/assets/envs.js`, so both the placement anchors and chain detection
  would need their own implementation.
- A Blockscout instance on a host not in `content_scripts.matches` gets nothing. Adding one
  is a single entry in `src/manifest.json`; chain detection already works there.
- Chain tables are snapshots, dated in each tool file. All three vendors add chains without
  notice; refresh from the cited sources when something new is missing.
