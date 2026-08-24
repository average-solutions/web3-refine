import { describe, expect, test } from "bun:test";

import { txHashFromPath } from "../src/core/tx";

const HASH = `0x${"a".repeat(64)}`;

describe("txHashFromPath", () => {
  test("accepts a transaction path", () => {
    expect(txHashFromPath(`/tx/${HASH}`)).toBe(HASH);
  });

  test("accepts a trailing slash", () => {
    expect(txHashFromPath(`/tx/${HASH}/`)).toBe(HASH);
  });

  test("lowercases a mixed-case hash", () => {
    const mixed = `0x${"AbCdEf01".repeat(8)}`;
    expect(txHashFromPath(`/tx/${mixed}`)).toBe(mixed.toLowerCase());
  });

  test("rejects non-transaction paths", () => {
    expect(txHashFromPath("/tx")).toBeNull();
    expect(txHashFromPath("/tx/")).toBeNull();
    expect(txHashFromPath("/")).toBeNull();
    expect(txHashFromPath("/block/123")).toBeNull();
    expect(txHashFromPath(`/txs/${HASH}`)).toBeNull();
    expect(txHashFromPath(`/address/${HASH}`)).toBeNull();
  });

  test("rejects extra path segments", () => {
    expect(txHashFromPath(`/tx/${HASH}/extra`)).toBeNull();
    expect(txHashFromPath(`/chain/tx/${HASH}`)).toBeNull();
  });

  test("rejects malformed hashes", () => {
    expect(txHashFromPath(`/tx/0x${"a".repeat(63)}`)).toBeNull();
    expect(txHashFromPath(`/tx/0x${"a".repeat(65)}`)).toBeNull();
    expect(txHashFromPath(`/tx/0x${"a".repeat(63)}z`)).toBeNull();
    expect(txHashFromPath(`/tx/${"a".repeat(64)}`)).toBeNull();
  });
});
