/**
 * Chain-id discovery for a Blockscout instance.
 *
 * The tx page HTML carries no chain id at all, and `window.__envs` lives in the
 * page world where an isolated content script cannot reach it. The one
 * same-origin source is `/assets/envs.js`, so no host permission is needed.
 */

/** Static asset every Blockscout frontend serves, holding the runtime env block. */
const ENVS_URL = "/assets/envs.js";

/**
 * The response body is a JS object literal with unquoted keys, so it is not
 * JSON. The lookbehind rejects a longer key that merely ends with ours
 * (`X_NEXT_PUBLIC_NETWORK_ID`), and requiring the colon rejects one that starts
 * with ours (`NEXT_PUBLIC_NETWORK_ID_SUFFIX`).
 */
const NETWORK_ID_PATTERN = /(?<![\w$])NEXT_PUBLIC_NETWORK_ID:\s*"(\d+)"/;

/** Extracts the chain id from the body of a Blockscout `/assets/envs.js`, or null. */
export function parseChainIdFromEnvs(source: string): number | null {
  const match = NETWORK_ID_PATTERN.exec(source);
  if (match === null) return null;

  // Chain ids run past 2^32 (Tenderly lists 3735928814) but stay well inside the
  // safe integer range; a larger value would lose precision and build a wrong URL.
  const chainId = Number(match[1]);
  return Number.isSafeInteger(chainId) && chainId > 0 ? chainId : null;
}

/**
 * The pending or settled lookup for this page. Holding the promise rather than
 * the value keeps concurrent callers — and every SPA navigation — on a single
 * request; the env block cannot change without a full page load.
 */
let lookup: Promise<number | null> | undefined;

/** Resolves the chain id of the Blockscout instance serving the current page. */
export async function resolveChainId(): Promise<number | null> {
  lookup ??= fetchChainId();
  return lookup;
}

async function fetchChainId(): Promise<number | null> {
  let body: string;
  try {
    const response = await fetch(ENVS_URL);
    if (!response.ok) {
      console.warn(`[web3-refine] GET ${ENVS_URL} returned ${response.status}`);
      return null;
    }
    body = await response.text();
  } catch (error: unknown) {
    console.warn(`[web3-refine] GET ${ENVS_URL} failed`, error);
    return null;
  }

  const chainId = parseChainIdFromEnvs(body);
  if (chainId === null) {
    console.warn(`[web3-refine] no NEXT_PUBLIC_NETWORK_ID in ${ENVS_URL}`);
  }
  return chainId;
}
