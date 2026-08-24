import { describe, expect, test } from "bun:test";

import { parseChainIdFromEnvs } from "../src/platform/blockscout";

/** Shape of a real `/assets/envs.js` body, trimmed to a handful of keys. */
const ENVS = `window.__envs = {
  NEXT_PUBLIC_APP_HOST: "eth.blockscout.com",
  NEXT_PUBLIC_NETWORK_NAME: "Ethereum",
  NEXT_PUBLIC_NETWORK_ID: "1",
  NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS: "18",
  NEXT_PUBLIC_IS_TESTNET: "false",
}
`;

describe("parseChainIdFromEnvs", () => {
  test("reads the id out of a realistic env block", () => {
    expect(parseChainIdFromEnvs(ENVS)).toBe(1);
  });

  test("reads an id above 2^32", () => {
    expect(parseChainIdFromEnvs(`NEXT_PUBLIC_NETWORK_ID: "3735928814",`)).toBe(3735928814);
  });

  test("tolerates extra whitespace after the colon", () => {
    expect(parseChainIdFromEnvs(`NEXT_PUBLIC_NETWORK_ID:    "8453",`)).toBe(8453);
    expect(parseChainIdFromEnvs(`NEXT_PUBLIC_NETWORK_ID:\n    "137",`)).toBe(137);
  });

  test("returns null when the key is absent", () => {
    expect(parseChainIdFromEnvs(`window.__envs = {\n  NEXT_PUBLIC_NETWORK_NAME: "Ethereum",\n}`)).toBeNull();
  });

  test("returns null for an empty body", () => {
    expect(parseChainIdFromEnvs("")).toBeNull();
  });

  test("returns null for a non-numeric value", () => {
    expect(parseChainIdFromEnvs(`NEXT_PUBLIC_NETWORK_ID: "abc",`)).toBeNull();
  });

  test("returns null for a non-positive id", () => {
    expect(parseChainIdFromEnvs(`NEXT_PUBLIC_NETWORK_ID: "0",`)).toBeNull();
  });

  test("ignores keys that merely contain the name", () => {
    expect(parseChainIdFromEnvs(`X_NEXT_PUBLIC_NETWORK_ID: "9",`)).toBeNull();
    expect(parseChainIdFromEnvs(`NEXT_PUBLIC_NETWORK_ID_SUFFIX: "9",`)).toBeNull();
  });

  test("picks the real key even next to look-alike keys", () => {
    const source = `window.__envs = {
  X_NEXT_PUBLIC_NETWORK_ID: "9",
  NEXT_PUBLIC_NETWORK_ID_SUFFIX: "9",
  NEXT_PUBLIC_NETWORK_ID: "11155111",
}`;
    expect(parseChainIdFromEnvs(source)).toBe(11155111);
  });
});
