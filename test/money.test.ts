import { describe, expect, test } from "bun:test";

import { formatUsd } from "../src/core/money";

describe("formatUsd", () => {
  test("formats a real basescan fee value to the cent", () => {
    expect(formatUsd(0.0182)).toBe("$0.02");
    expect(formatUsd(0.0349)).toBe("$0.03");
  });

  test("formats zero with cent precision", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  test("keeps cent precision at exactly one cent", () => {
    expect(formatUsd(0.01)).toBe("$0.01");
  });

  test("pads a single decimal to two", () => {
    expect(formatUsd(1.5)).toBe("$1.50");
  });

  test("separates thousands", () => {
    expect(formatUsd(1234.56)).toBe("$1,234.56");
    expect(formatUsd(2501.04)).toBe("$2,501.04");
  });

  test("keeps two significant digits below one cent", () => {
    expect(formatUsd(0.0018)).toBe("$0.0018");
    expect(formatUsd(0.00025)).toBe("$0.00025");
    expect(formatUsd(0.0000072)).toBe("$0.0000072");
  });

  test("drops an insignificant trailing zero below one cent", () => {
    expect(formatUsd(0.001)).toBe("$0.001");
  });
});
