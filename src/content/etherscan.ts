/**
 * Appends a USD figure to the `Txn Fee` column on Etherscan-family explorers,
 * rendering `0.00000727 ETH | $0.02` — the shape Etherscan itself uses in the
 * Amount column's tooltip.
 *
 * Etherscan is server-rendered, so `document_idle` already sees the initial
 * table. The page's own JS still re-renders rows — the `Txn Fee` header swaps
 * the column for Gwei, filter links replace the tbody — so `sync` also re-runs
 * on DOM mutations and is a no-op whenever every cell already carries the
 * current header price.
 */
import { formatUsd } from "../core/money";
import type { NativePrice } from "../platform/etherscan";
import { readNativePrice } from "../platform/etherscan";

/** Class of the appended span; also the CSS scope root. */
const USD_CLASS = "web3-refine-fee-usd";

/** Coalesces the mutation burst a single re-render produces, in milliseconds. */
const SYNC_DEBOUNCE_MS = 50;

/**
 * Brings every fee cell in line with the header price. Never throws: this is
 * the entry, and an error here would surface in the host page's console.
 */
function sync(): void {
  try {
    const price = readNativePrice();
    // No price means no honest USD figure, and a guessed rate is worse than
    // none. Cloudflare challenges and pages without the header land here; a
    // later pass retries.
    if (price === null) return;

    // Only the native-token column. The sibling `td.showGasPrice` holds Gwei.
    for (const cell of document.querySelectorAll<HTMLElement>("td.showTxnFee")) {
      annotate(cell, price);
    }
  } catch (error: unknown) {
    console.error("[web3-refine] failed to annotate transaction fees", error);
  }
}

/**
 * Renders `<fee> <SYMBOL> | $<usd>` in `cell`, leaving it untouched when the
 * fee is unusable or already carries this exact price. The stamp pairs the fee
 * with the rate used, so a moved header price re-renders every cell instead of
 * leaving a stale figure behind.
 */
function annotate(cell: HTMLElement, price: NativePrice): void {
  const existing = cell.querySelector<HTMLElement>(`.${USD_CLASS}`);
  // Our own span pollutes `textContent`, so once it is in place the fee comes
  // from the copy stored beside it. Without it the cell text is the fee itself,
  // which also re-captures a cell the page has re-rendered in place.
  const stored = existing === null ? cell.textContent : cell.dataset.w3rFeeText;
  const feeText = (stored ?? "").trim();

  // Pending rows render a placeholder where the fee will go. `Number("")` is 0,
  // so emptiness cannot be left to the finite check.
  if (feeText === "") return;
  const fee = Number(feeText.replace(/,/g, ""));
  if (!Number.isFinite(fee)) return;

  // A matching stamp only means the cell is current if the figure is still
  // there; the page can rewrite a cell in place and drop the span while the
  // fee, and so the stamp, stay identical.
  const stamp = `${feeText}@${price.usd}`;
  if (cell.dataset.w3rFee === stamp && existing !== null) return;

  const span = document.createElement("span");
  span.className = USD_CLASS;
  span.textContent = ` ${price.symbol} | ${formatUsd(fee * price.usd)}`;

  cell.dataset.w3rFeeText = feeText;
  cell.dataset.w3rFee = stamp;
  // Replacing rather than appending is what keeps a re-priced cell single.
  if (existing === null) cell.append(span);
  else existing.replaceWith(span);
}

/** Handle of the pending debounced sync, or 0 while idle. */
let timer = 0;

function schedule(): void {
  if (timer !== 0) return;
  timer = window.setTimeout(() => {
    timer = 0;
    sync();
  }, SYNC_DEBOUNCE_MS);
}

sync();
// Our own appends re-enter `sync`, which finds every stamp current and stops.
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
