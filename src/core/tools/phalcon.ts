import type { TxTool } from "./tool";

/**
 * `chainId -> path slug`, from the chain registry in the shipped bundle
 * `https://app.blocksec.com/phalcon/explorer/assets/index-oPjIG8IR.js`, field
 * `blockExplorers.phalcon.slug`. Snapshot 2026-08-24. Solana is covered by Phalcon but
 * is not EVM, so it has no chain id here.
 */
const SLUGS = new Map<number, string>([
  [1, "eth"],
  [10, "optimism"],
  [56, "bsc"],
  [97, "bsc-testnet"],
  [100, "gnosis"],
  [137, "polygon"],
  [143, "monad"],
  [146, "sonic"],
  [169, "manta"],
  [223, "b2"],
  [250, "fantom"],
  [324, "zksync-era"],
  [480, "world"],
  [999, "hyperevm"],
  [1116, "core"],
  [1315, "data-network-aeneid"],
  [1329, "sei"],
  [1514, "data-network"],
  [1516, "story-odyssey"],
  [2222, "kava"],
  [2818, "morph"],
  [4200, "merlin"],
  [4217, "tempo"],
  [4326, "megaeth"],
  [4663, "robinhood"],
  [5000, "mantle"],
  [8453, "base"],
  [9745, "plasma"],
  [9746, "plasma-testnet"],
  [10143, "monad-testnet"],
  [17000, "holesky"],
  [42161, "arbitrum"],
  [43114, "avalanche"],
  [47763, "neo-x"],
  [59144, "linea"],
  [60808, "bob"],
  [80094, "berachain"],
  [167000, "taiko"],
  [200901, "btr"],
  [534352, "scroll"],
  [560048, "hoodi"],
  [810180, "zklink-nova"],
  [11155111, "sepolia"],
]);

export const phalcon: TxTool = {
  id: "phalcon",
  label: "Phalcon",
  txUrl(chainId, hash) {
    const slug = SLUGS.get(chainId);
    // The `/phalcon/` prefix is canonical: the shorter `/explorer/tx/...` form answers
    // with a 302 to it, so omitting it costs a redirect hop.
    return slug === undefined
      ? null
      : `https://app.blocksec.com/phalcon/explorer/tx/${slug}/${hash}`;
  },
};
