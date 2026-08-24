/**
 * Builds the unpacked extension into `dist/`.
 *
 * Content scripts are classic scripts, so every entrypoint is bundled as IIFE;
 * ESM output would be rejected by Chrome at injection time.
 */
import { watch } from "node:fs";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");

/** Entrypoints, relative to `src`, that Chrome loads directly. */
const ENTRYPOINTS = ["content/blockscout.ts"];

/** Verbatim copies: `[path in src, path in dist]`. */
const ASSETS: ReadonlyArray<readonly [string, string]> = [
  ["manifest.json", "manifest.json"],
  ["content/blockscout.css", "content/blockscout.css"],
  ["icons", "icons"],
];

/** Debounce window for filesystem events, in milliseconds. */
const WATCH_DEBOUNCE_MS = 100;

async function build(): Promise<void> {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const result = await Bun.build({
    entrypoints: ENTRYPOINTS.map((entry) => join(SRC, entry)),
    outdir: OUT,
    root: SRC,
    target: "browser",
    format: "iife",
    minify: false,
    sourcemap: "linked",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error("bundle failed");
  }

  for (const [from, to] of ASSETS) {
    await cp(join(SRC, from), join(OUT, to), { recursive: true });
  }

  const entries = await readdir(OUT, { recursive: true, withFileTypes: true });
  console.log(`built ${entries.filter((e) => e.isFile()).length} files -> dist/`);
}

await build();

if (process.argv.includes("--watch")) {
  // Editors emit bursts of events per save; only the newest event rebuilds.
  let generation = 0;
  watch(SRC, { recursive: true }, () => {
    const mine = ++generation;
    setTimeout(() => {
      if (mine !== generation) return;
      build().catch((error: unknown) => console.error(error));
    }, WATCH_DEBOUNCE_MS);
  });
  console.log("watching src/ ...");
}
