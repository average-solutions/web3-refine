import type { TxTool } from "./tool";

/**
 * Chain ids Tenderly indexes, from `https://api.tenderly.co/api/v1/public-networks`
 * (unauthenticated, field `.id`), snapshot 2026-08-24. Tenderly adds chains often, so
 * this set drifts; refetch to refresh it.
 *
 * The tx URL carries no chain, so nothing in the link itself can fail loudly on an
 * unsupported chain — without this gate we would offer a link to a page that can never
 * resolve the hash.
 */
const SUPPORTED_CHAINS: ReadonlySet<number> = new Set([
  1, 10, 14, 30, 31, 56, 71, 97, 100, 130,
  137, 143, 146, 196, 232, 239, 252, 288, 300, 324,
  360, 480, 988, 1030, 1088, 1135, 1301, 1328, 1329, 1439,
  1776, 1868, 1946, 1952, 2020, 2201, 2391, 2523, 4202, 4217,
  4326, 4663, 4801, 5000, 5003, 7000, 7001, 8453, 9069, 9070,
  9745, 9746, 10143, 10200, 11011, 13371, 13473, 14601, 28882, 33111,
  33139, 37111, 42161, 42220, 42431, 43113, 43114, 46630, 57073, 59141,
  59144, 59902, 60808, 80002, 80069, 80094, 81457, 84532, 98866, 98867,
  167000, 167013, 202601, 421614, 534352, 560048, 737373, 747474, 763373, 808813,
  5042002, 11142220, 11155111, 11155420, 1230263917,
]);

export const tenderly: TxTool = {
  id: "tenderly",
  label: "Tenderly",
  txUrl(chainId, hash) {
    // No chain segment: `/tx/1/{hash}` and `/tx/mainnet/{hash}` both canonicalize
    // client-side to `/tx/{hash}`, which resolves the network itself (live-verified),
    // so a chain segment is dead weight.
    return SUPPORTED_CHAINS.has(chainId) ? `https://dashboard.tenderly.co/tx/${hash}` : null;
  },
};
