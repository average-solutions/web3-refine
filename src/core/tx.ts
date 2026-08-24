/**
 * Blockscout's transaction route is `/tx/[hash]`; tabs are query params, never extra path
 * segments, so a hash followed by anything else is not a transaction page.
 */
const TX_PATH = /^\/tx\/(0x[0-9a-fA-F]{64})\/?$/;

/**
 * Extracts the transaction hash from a Blockscout path, or null when `pathname`
 * is not a transaction page.
 */
export function txHashFromPath(pathname: string): string | null {
  const hash = TX_PATH.exec(pathname)?.[1];
  return hash === undefined ? null : hash.toLowerCase();
}
