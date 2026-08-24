import type { TxTool } from "./tool";

import { dedaub } from "./dedaub";
import { phalcon } from "./phalcon";
import { tenderly } from "./tenderly";

export type { TxTool } from "./tool";

/** Every tool offered on a transaction page, in display order. */
export const TX_TOOLS: readonly TxTool[] = [tenderly, dedaub, phalcon];
