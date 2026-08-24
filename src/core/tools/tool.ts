/** A third-party analysis site that can render an EVM transaction. */
export interface TxTool {
  /** Stable identifier, used in DOM ids and CSS classes. */
  readonly id: string;
  /** Text shown on the injected link. */
  readonly label: string;
  /** Absolute URL for `hash` on `chainId`, or null when the tool does not cover that chain. */
  txUrl(chainId: number, hash: string): string | null;
}
