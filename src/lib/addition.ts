import {
  signedToBits,
  signedFromBits,
  inSignedRange,
  addSignedWrap,
  signedAddOverflow,
} from "./binary";
import type { BitWidth } from "./types";

/** Carry into the LSB column is index 0; carry out of the MSB is index `width`. */
export type CarryRail = readonly (0 | 1)[];

export interface AdditionStep {
  title: string;
  /** Active column counted from the LSB (0 = LSB). */
  activeColumn: number | null;
  highlightA: readonly number[];
  highlightB: readonly number[];
  highlightSum: readonly number[];
  /** Directed edges between MSB-first bit indices; `-1` denotes the external carry-in rail. */
  carryFlow: readonly { from: number; to: number }[];
  aBits: readonly string[];
  bBits: readonly string[];
  sumBits: readonly string[];
  carries: CarryRail;
}

function lsbGet(bitsMsb: readonly string[], w: BitWidth, k: number): 0 | 1 {
  const idx = w - 1 - k;
  return bitsMsb[idx] === "1" ? 1 : 0;
}

function setLsb(sumMsb: string[], w: BitWidth, k: number, bit: 0 | 1): void {
  const idx = w - 1 - k;
  sumMsb[idx] = bit === 1 ? "1" : "0";
}

function msbIndexForLsbColumn(w: BitWidth, k: number): number {
  return w - 1 - k;
}

/**
 * Ripple-carry addition with per-column highlights and a carry rail suitable for UI arrows.
 */
export function buildAdditionTrace(a: number, b: number, w: BitWidth): AdditionStep[] {
  if (!inSignedRange(a, w) || !inSignedRange(b, w)) {
    throw new RangeError("Operands must fit the selected signed bit width.");
  }

  const aBits = signedToBits(a, w);
  const bBits = signedToBits(b, w);
  const finalSumBits = signedToBits(addSignedWrap(a, b, w), w);

  const steps: AdditionStep[] = [];

  const partialSum = Array(w).fill("0") as string[];
  const partialCarries: (0 | 1)[] = Array(w + 1).fill(0) as (0 | 1)[];
  partialCarries[0] = 0;

  steps.push({
    title: "Operands loaded; carry into LSB = 0",
    activeColumn: null,
    highlightA: [],
    highlightB: [],
    highlightSum: [],
    carryFlow: [],
    aBits,
    bBits,
    sumBits: [...partialSum],
    carries: [...partialCarries],
  });

  for (let k = 0; k < w; k++) {
    const msbIdx = msbIndexForLsbColumn(w, k);
    const ak = lsbGet(aBits, w, k);
    const bk = lsbGet(bBits, w, k);
    const cin = partialCarries[k];
    const s = (ak ^ bk ^ cin) as 0 | 1;
    const cout = ((ak & bk) | (ak & cin) | (bk & cin)) as 0 | 1;

    const incomingFrom = k === 0 ? -1 : msbIndexForLsbColumn(w, k - 1);

    steps.push({
      title: `Column ${k}: evaluate A[${msbIdx}]⊕B[${msbIdx}]⊕c_in(${cin})`,
      activeColumn: k,
      highlightA: [msbIdx],
      highlightB: [msbIdx],
      highlightSum: [msbIdx],
      carryFlow: [{ from: incomingFrom, to: msbIdx }],
      aBits,
      bBits,
      sumBits: [...partialSum],
      carries: [...partialCarries],
    });

    setLsb(partialSum, w, k, s);
    partialCarries[k + 1] = cout;

    const outgoingTo = k === w - 1 ? w : msbIndexForLsbColumn(w, k + 1);

    steps.push({
      title: `Column ${k}: sum_bit=${s}, carry_out=${cout}`,
      activeColumn: k,
      highlightA: [msbIdx],
      highlightB: [msbIdx],
      highlightSum: [msbIdx],
      carryFlow: [{ from: msbIdx, to: outgoingTo }],
      aBits,
      bBits,
      sumBits: [...partialSum],
      carries: [...partialCarries],
    });
  }

  const signedOverflow = signedAddOverflow(a, b, w);

  steps.push({
    title: signedOverflow
      ? `Final (signed overflow): ${finalSumBits.join("")} as wrapped ${w}-bit pattern`
      : `Final: ${finalSumBits.join("")} (${signedFromBits(finalSumBits, w)} decimal)`,
    activeColumn: null,
    highlightA: [],
    highlightB: [],
    highlightSum: Array.from({ length: w }, (_, i) => i),
    carryFlow: [],
    aBits,
    bBits,
    sumBits: finalSumBits,
    carries: [...partialCarries],
  });

  return steps;
}
