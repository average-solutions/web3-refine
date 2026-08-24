# web3-refine

Chrome extension that adds power-user tooling to web3 explorers.

## Features

| Feature | Where | What it does |
|---|---|---|
| Transaction tool links | Blockscout | On a transaction page, adds `Open in` links that reopen the same transaction in **Tenderly**, **Dedaub** and **Phalcon**. Only tools that actually index the chain are offered, so there are no dead links; on a chain none of them cover, nothing is injected. |
| Txn fee in USD | Etherscan | Appends the fiat value to every `Txn Fee` cell in a transaction table, permanently visible. Etherscan reveals USD on hover for the `Amount` column but never for the fee, even though it already knows the rate. |

```
Transaction details   Open in  ( Tenderly ) ( Dedaub ) ( Phalcon )

Txn Fee
0.00001394 ETH | $0.03
```

## Supported explorers

Two explorer families, one content script each, since they share no DOM.

**Blockscout.** Any Blockscout frontend — the chain is detected at runtime, so a host needs
no prior knowledge, only a `content_scripts.matches` entry so Chrome injects there.

| Host | Covers |
|---|---|
| `*.blockscout.com` | ~50 public instances, mainnets and testnets |
| `explorer.optimism.io` | OP Mainnet (10) — `optimism.blockscout.com` redirects here |
| `gnosisscan.io` | Gnosis (100) — `gnosis.blockscout.com` redirects here |
| `scrollscan.com` | Scroll (534352) — an Etherscan-branded domain now serving Blockscout |

**Etherscan.** 27 zones, matched as `*.<zone>` so testnet subdomains work without a
manifest edit: `etherscan.io`, `bscscan.com`, `polygonscan.com`, `basescan.org`,
`arbiscan.io`, `lineascan.build`, `blastscan.io`, `snowscan.xyz`, `bttcscan.com`,
`celoscan.io`, `fraxscan.com`, `mantlescan.xyz`, `sonicscan.org`, `uniscan.xyz`,
`abscan.org`, `berascan.com`, `worldscan.org`, `apescan.io`, `taikoscan.io`,
`xdcscan.com`, `monadscan.com`, `hyperevmscan.io`, `katanascan.com`, `seiscan.io`,
`stablescan.xyz`, `plasmascan.to`, `memecorescan.io`.

Deliberately excluded, each verified rather than assumed: `scrollscan.com`, `gnosisscan.io`
and `nova.arbiscan.io` now serve Blockscout; `snowtrace.io` is Routescan; `cronoscan.com`
was retired; `ftmscan.com` no longer resolves; `moonscan.io` stopped serving network data
when Moonbeam entered maintenance mode.

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

### Blockscout: transaction tool links

`src/content/blockscout.ts` runs on the Blockscout hosts and, for each transaction page,
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

### Etherscan: txn fee in USD

`src/content/etherscan.ts` annotates every `td.showTxnFee` cell it finds, so the same code
covers address pages, `/txs` and block pages.

**Getting the rate.** Etherscan's header carries `<div id="ethPrice">` reading
`ETH Price: $2,501.04 (+2.33%) Gas: 5.527 Gwei`. That element is the only price the page
exposes, and it yields both the rate and the native symbol — which is why this feature
needs no chain registry and no network access. The id stays `ethPrice` on every fork, so
the symbol has to come from the label text: polygonscan serves `POL Price: $0.12` from
that same id. When the header has no usable price the pass does nothing; a guessed rate
would be worse than none.

**Not touching Gwei.** The `Txn Fee` header toggles the column between the fee and
`td.showGasPrice`, which holds Gwei. Only `.showTxnFee` is ever annotated.

**Staying correct.** Each cell is stamped with the fee and the exact rate used. A pass
skips cells whose stamp matches and whose figure is still present, so a re-render or a
moved rate re-renders rather than appending a second figure, and an idle pass writes
nothing at all.

**Sub-cent fees.** Cent precision would flatten most L2 fees to `$0.00`, so amounts under
a cent fall back to two significant digits (`$0.00052`).

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

- The two features do not overlap: tool links are Blockscout-only, the fee annotation is
  Etherscan-only. Neither has been ported to the other family.
- Some Etherscan hosts sit behind Cloudflare. On a `Just a moment...` challenge page none
  of the expected elements exist and the script correctly does nothing; it annotates once
  the real page loads.
- A Blockscout instance on a host not in `content_scripts.matches` gets nothing. Adding one
  is a single entry in `src/manifest.json`; chain detection already works there.
- Chain tables are snapshots, dated in each tool file. All three vendors add chains without
  notice; refresh from the cited sources when something new is missing.
