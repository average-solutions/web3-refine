import { describe, expect, test } from "bun:test";

import { parseNativePrice } from "../src/platform/etherscan";

/** Verbatim `#ethPrice` text from etherscan.io and basescan.org. */
const ETH_HEADER = "ETH Price: $2,501.04 (+2.33%) Gas: 5.527 Gwei";

/** Verbatim `#ethPrice` text from polygonscan.com, which omits the space before `Gas`. */
const POL_HEADER = "POL Price: $0.12 (+9.04%)Gas: 281.595 Gwei";

describe("parseNativePrice", () => {
  test("reads symbol and rate from a real ETH header", () => {
    expect(parseNativePrice(ETH_HEADER)).toEqual({ symbol: "ETH", usd: 2501.04 });
  });

  test("reads the native symbol of a non-ETH chain", () => {
    expect(parseNativePrice(POL_HEADER)).toEqual({ symbol: "POL", usd: 0.12 });
  });

  test("strips thousands separators", () => {
    expect(parseNativePrice("ETH Price: $12,345.67 (+1.00%) Gas: 3 Gwei")?.usd).toBe(12345.67);
  });

  test("never reads the gas figure as the price", () => {
    expect(parseNativePrice("Gas: 5.527 Gwei")).toBeNull();
    expect(parseNativePrice("ETH Price: (+2.33%) Gas: 5.527 Gwei")).toBeNull();
  });

  test("returns null for an empty string", () => {
    expect(parseNativePrice("")).toBeNull();
  });

  test("returns null when no dollar amount follows the label", () => {
    expect(parseNativePrice("ETH Price: -- (0.00%)")).toBeNull();
  });

  test("returns null for a zero price, which means the header is not populated", () => {
    expect(parseNativePrice("ETH Price: $0.00 (0.00%) Gas: 1 Gwei")).toBeNull();
  });

  test("uppercases the symbol", () => {
    expect(parseNativePrice("eth Price: $2,501.04")?.symbol).toBe("ETH");
  });

  test("tolerates surrounding whitespace from the element text node", () => {
    expect(parseNativePrice(`\n  ${ETH_HEADER}\n `)).toEqual({ symbol: "ETH", usd: 2501.04 });
  });
});
