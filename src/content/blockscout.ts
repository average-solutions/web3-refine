/**
 * Injects "open this transaction in <tool>" links into Blockscout tx pages.
 *
 * Blockscout is a Next.js SPA: `document_idle` fires once, but the route changes
 * without a reload and React freely re-renders the header away. Both cases are
 * handled by re-running `sync` on DOM mutations and making it a no-op whenever
 * the bar already matches the current transaction.
 */
import type { TxTool } from "../core/tools";
import { TX_TOOLS } from "../core/tools";
import { txHashFromPath } from "../core/tx";
import { resolveChainId } from "../platform/blockscout";

/** Id of the injected bar; also the CSS scope root. */
const BAR_ID = "web3-refine-tx-tools";

/** Coalesces the mutation burst a single React render produces, in milliseconds. */
const SYNC_DEBOUNCE_MS = 50;

/**
 * Brings the bar in line with the current URL. Never rejects: this is the async
 * entry, and an unhandled rejection would surface in the host page's console.
 */
async function sync(): Promise<void> {
  try {
    const hash = txHashFromPath(location.pathname);
    if (hash === null) {
      document.getElementById(BAR_ID)?.remove();
      return;
    }
    if (document.getElementById(BAR_ID)?.dataset.hash === hash) return;

    const chainId = await resolveChainId();
    // The route can move on, or a parallel pass can win, while the lookup runs.
    if (chainId === null || txHashFromPath(location.pathname) !== hash) return;
    if (document.getElementById(BAR_ID)?.dataset.hash === hash) return;

    const bar = buildBar(chainId, hash);
    if (bar !== null) place(bar);
  } catch (error: unknown) {
    console.error("[web3-refine] failed to inject transaction tools", error);
  }
}

/** Builds the bar for `hash`, or null when no tool covers `chainId`. */
function buildBar(chainId: number, hash: string): HTMLElement | null {
  const links: HTMLAnchorElement[] = [];
  for (const tool of TX_TOOLS) {
    const url = tool.txUrl(chainId, hash);
    if (url !== null) links.push(buildLink(tool, url));
  }
  // An empty bar is pure noise on a chain none of the tools index.
  if (links.length === 0) return null;

  const caption = document.createElement("span");
  caption.className = "web3-refine-caption";
  caption.textContent = "Open in";

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.dataset.hash = hash;
  bar.append(caption, ...links);
  return bar;
}

function buildLink(tool: TxTool, url: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = `web3-refine-link web3-refine-link-${tool.id}`;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = `Open transaction in ${tool.label}`;
  link.textContent = tool.label;
  return link;
}

/**
 * Inserts `bar` at the page header, replacing any stale bar. Anchors are
 * semantic on purpose: emotion class names carry a build hash. The chosen
 * anchor is recorded because the two placements need different spacing — the
 * header is a centred flex row, the tab strip needs a row of its own.
 */
function place(bar: HTMLElement): void {
  document.getElementById(BAR_ID)?.remove();

  const heading = document.querySelector("h1");
  const header = heading?.parentElement?.parentElement;
  if (header != null) {
    bar.dataset.anchor = "header";
    header.after(bar);
    return;
  }

  const tablist = document.querySelector('[role="tablist"]');
  if (tablist === null) return; // Nothing rendered yet; the observer retries.

  bar.dataset.anchor = "tablist";
  tablist.before(bar);
}

/** Handle of the pending debounced sync, or 0 while idle. */
let timer = 0;

function schedule(): void {
  if (timer !== 0) return;
  timer = window.setTimeout(() => {
    timer = 0;
    void sync();
  }, SYNC_DEBOUNCE_MS);
}

void sync();
// Our own insertion re-enters `sync`, which finds the bar current and stops.
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
