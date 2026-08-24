import type { TxTool } from "./tool";

/**
 * `chainId -> path slug`, from the shipped GraphQL enum `NetworkValues` in
 * `https://app.dedaub.com/_next/static/chunks/0q7g44wiqi_s3.js`, kept only where
 * `https://app.dedaub.com/api/network` reports `is_etl: true` (transactions indexed).
 * Snapshot 2026-08-24.
 *
 * Fantom (250) is in the enum but has `is_etl: false`, so its transactions are not
 * indexed. Gnosis (100) is absent from the enum entirely; MetaSuites still maps it to a
 * `gnosis` slug, which no longer resolves.
 */
const SLUGS = new Map<number, string>([
  [1, "ethereum"],
  [10, "optimism"],
  [56, "binance"],
  [137, "polygon"],
  [4663, "robinhood"],
  [8453, "base"],
  [42161, "arbitrum"],
  [43114, "avalanche"],
  [81457, "blast"],
]);

export const dedaub: TxTool = {
  id: "dedaub",
  label: "Dedaub",
  txUrl(chainId, hash) {
    const slug = SLUGS.get(chainId);
    return slug === undefined ? null : `https://app.dedaub.com/${slug}/tx/${hash}`;
  },
};
