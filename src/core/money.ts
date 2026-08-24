/**
 * USD amounts are rendered the way explorers already render them (`$1,234.56`),
 * so the annotated value reads as part of the page rather than as an addition.
 */

/** Amounts at or above one cent are exact to the cent, like every other price on the page. */
const CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * An L2 transaction fee is routinely worth a fraction of a cent, and cent
 * precision would flatten every one of those rows to an uninformative `$0.00`.
 * Significant digits keep the magnitude visible however small the fee gets.
 */
const SUB_CENT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumSignificantDigits: 2,
});

/** One cent: below it, cent precision carries no information. */
const CENT = 0.01;

/** Formats a USD amount for display beside a native-token amount, e.g. `$0.02`. */
export function formatUsd(amount: number): string {
  if (amount > 0 && amount < CENT) return SUB_CENT.format(amount);
  return CENTS.format(amount);
}
