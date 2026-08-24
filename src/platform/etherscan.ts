/**
 * Native-token price discovery for an Etherscan-family explorer.
 *
 * The header price block is the only price the page exposes, and it carries both
 * the rate and the native symbol — which is why annotating fees needs no chain
 * registry and no network access.
 */

/**
 * Every fork of the Etherscan template keeps the id `ethPrice`, including chains
 * whose native token is not ETH (polygonscan serves `POL Price: $0.12` from it).
 * The symbol therefore has to be read from the label text; the id says nothing.
 */
const PRICE_ELEMENT_ID = "ethPrice";

/**
 * Anchored at the start of the header text so neither the change percentage nor
 * the trailing `Gas: 5.527 Gwei` figure can be read as the price. Some hosts
 * omit the space before `Gas`, so nothing past the amount is matched.
 */
const HEADER_PRICE = /^([A-Za-z]{2,10})\s+Price:\s*\$([\d,]+(?:\.\d+)?)/;

/** The native-token price advertised in an Etherscan page header. */
export interface NativePrice {
  /** Native currency symbol, e.g. `ETH` or `POL`. */
  readonly symbol: string;
  /** USD per one whole native token. */
  readonly usd: number;
}

/** Parses the header price text, or null when it carries no usable price. */
export function parseNativePrice(text: string): NativePrice | null {
  const match = HEADER_PRICE.exec(text.trim());
  if (match === null) return null;

  const [, symbol = "", price = ""] = match;

  // A zero or unparseable rate means the header has not been populated yet,
  // which is an ordinary transient state on a freshly loaded page.
  const usd = Number(price.replace(/,/g, ""));
  if (!Number.isFinite(usd) || usd <= 0) return null;

  return { symbol: symbol.toUpperCase(), usd };
}

/** Reads the native price from the current document, or null when absent. */
export function readNativePrice(): NativePrice | null {
  // Cloudflare challenge pages and unrecognised hosts have no header block.
  const element = document.getElementById(PRICE_ELEMENT_ID);
  if (element === null) return null;

  return parseNativePrice(element.textContent ?? "");
}
