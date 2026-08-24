import { describe, expect, test } from "bun:test";

import { TX_TOOLS } from "../src/core/tools";
import { dedaub } from "../src/core/tools/dedaub";
import { phalcon } from "../src/core/tools/phalcon";
import { tenderly } from "../src/core/tools/tenderly";

const HASH = `0x${"a".repeat(64)}`;

describe("TX_TOOLS", () => {
  test("is ordered tenderly, dedaub, phalcon", () => {
    expect(TX_TOOLS.map((tool) => tool.id)).toEqual(["tenderly", "dedaub", "phalcon"]);
  });

  test("covers no chain id 0", () => {
    for (const tool of TX_TOOLS) {
      expect(tool.txUrl(0, HASH)).toBeNull();
    }
  });
});

describe("tenderly", () => {
  test("builds a chainless mainnet url", () => {
    expect(tenderly.txUrl(1, HASH)).toBe(`https://dashboard.tenderly.co/tx/${HASH}`);
  });

  test("covers base", () => {
    expect(tenderly.txUrl(8453, HASH)).toBe(`https://dashboard.tenderly.co/tx/${HASH}`);
  });

  test("rejects an unsupported chain", () => {
    expect(tenderly.txUrl(1101, HASH)).toBeNull();
  });
});

describe("dedaub", () => {
  test("builds a mainnet url", () => {
    expect(dedaub.txUrl(1, HASH)).toBe(`https://app.dedaub.com/ethereum/tx/${HASH}`);
  });

  test("covers base", () => {
    expect(dedaub.txUrl(8453, HASH)).toBe(`https://app.dedaub.com/base/tx/${HASH}`);
  });

  test("rejects gnosis and fantom", () => {
    expect(dedaub.txUrl(100, HASH)).toBeNull();
    expect(dedaub.txUrl(250, HASH)).toBeNull();
  });
});

describe("phalcon", () => {
  test("builds a mainnet url", () => {
    expect(phalcon.txUrl(1, HASH)).toBe(
      `https://app.blocksec.com/phalcon/explorer/tx/eth/${HASH}`,
    );
  });

  test("covers gnosis", () => {
    expect(phalcon.txUrl(100, HASH)).toBe(
      `https://app.blocksec.com/phalcon/explorer/tx/gnosis/${HASH}`,
    );
  });

  test("rejects blast", () => {
    expect(phalcon.txUrl(81457, HASH)).toBeNull();
  });
});
