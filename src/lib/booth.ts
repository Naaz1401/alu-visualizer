import { signedFromBits, signedToBits, inSignedRange, signedFromBitsAny } from "./binary";
import type { BitWidth } from "./types";

export interface BoothStep {
  title: string;
  /** 1-based iteration counter (0 for the initial snapshot). */
  iteration: number;
  a: readonly string[];
  q: readonly string[];
  qMinus1: 0 | 1;
  m: readonly string[];
  /** Instruction decoded from (Q0, Q-1). */
  decoded: "A += M" | "A -= M" | "nop";
  /** Whether this step ends with an arithmetic right shift of (A, Q, Q-1). */
  willShift: boolean;
  /** MSB-first indices inside A/Q to emphasize (LSB pair, sign bits, etc.). */
  highlightA: readonly number[];
  highlightQ: readonly number[];
  highlightQM1: boolean;
}

function toSignedN(v: number, n: number): number {
  const mask = (1 << n) - 1;
  let x = v & mask;
  if (x & (1 << (n - 1))) x -= 1 << n;
  return x;
}

function concatAQ(a: readonly string[], q: readonly string[]): string[] {
  return [...a, ...q];
}

function arithShiftRightAQ(
  a: readonly string[],
  q: readonly string[],
  qm1: 0 | 1,
  n: number,
): { a: string[]; q: string[]; qm1: 0 | 1 } {
  const t = concatAQ(a, q);
  const newT: string[] = [];
  newT[0] = t[0]; // sign extension
  for (let i = 1; i < 2 * n; i++) newT[i] = t[i - 1];
  const newQm1 = (t[2 * n - 1] === "1" ? 1 : 0) as 0 | 1;
  return {
    a: newT.slice(0, n),
    q: newT.slice(n, 2 * n),
    qMinus1: newQm1,
  };
}

function addSubA(a: readonly string[], m: readonly string[], subtract: boolean, n: BitWidth): string[] {
  const av = signedFromBits(a, n);
  const mv = signedFromBits(m, n);
  const res = subtract ? av - mv : av + mv;
  return signedToBits(toSignedN(res, n), n);
}

/**
 * Booth multiplication (signed) with explicit A, Q, and Q₋₁ bookkeeping.
 * Uses `n` iterations where `n` is the selected bit width.
 */
export function buildBoothTrace(multiplicand: number, multiplier: number, n: BitWidth): BoothStep[] {
  if (!inSignedRange(multiplicand, n) || !inSignedRange(multiplier, n)) {
    throw new RangeError("Operands must fit the selected signed bit width.");
  }

  const m = signedToBits(multiplicand, n);
  let a = signedToBits(0, n);
  let q = signedToBits(multiplier, n);
  let qm1: 0 | 1 = 0;

  const steps: BoothStep[] = [];

  steps.push({
    title: "Initialize: A←0, Q←multiplier, Q₋₁←0, M←multiplicand",
    iteration: 0,
    a,
    q,
    qMinus1: qm1,
    m,
    decoded: "nop",
    willShift: false,
    highlightA: Array.from({ length: n }, (_, i) => i),
    highlightQ: [n - 1],
    highlightQM1: true,
  });

  for (let i = 1; i <= n; i++) {
    const q0 = q[n - 1] === "1" ? 1 : 0;

    let decoded: BoothStep["decoded"] = "nop";
    if (q0 === 1 && qm1 === 0) decoded = "A += M";
    else if (q0 === 0 && qm1 === 1) decoded = "A -= M";

    steps.push({
      title: `Iteration ${i}/${n}: inspect Q₀=${q0}, Q₋₁=${qm1} → ${decoded}`,
      iteration: i,
      a,
      q,
      qMinus1: qm1,
      m,
      decoded,
      willShift: false,
      highlightA: Array.from({ length: n }, (_, idx) => idx),
      highlightQ: [n - 1],
      highlightQM1: true,
    });

    if (decoded === "A += M") a = addSubA(a, m, false, n);
    else if (decoded === "A -= M") a = addSubA(a, m, true, n);

    if (decoded !== "nop") {
      steps.push({
        title: `Iteration ${i}/${n}: apply ${decoded} before the arithmetic shift`,
        iteration: i,
        a,
        q,
        qMinus1: qm1,
        m,
        decoded,
        willShift: false,
        highlightA: Array.from({ length: n }, (_, idx) => idx),
        highlightQ: [],
        highlightQM1: false,
      });
    }

    const shifted = arithShiftRightAQ(a, q, qm1, n);
    qm1 = shifted.qMinus1;
    a = shifted.a;
    q = shifted.q;

    steps.push({
      title: `Iteration ${i}/${n}: arithmetic right shift of (A, Q); old Q₀ → Q₋₁`,
      iteration: i,
      a,
      q,
      qMinus1: qm1,
      m,
      decoded: "nop",
      willShift: true,
      highlightA: Array.from({ length: n }, (_, idx) => idx),
      highlightQ: Array.from({ length: n }, (_, idx) => idx),
      highlightQM1: true,
    });
  }

  const productBits = [...a, ...q];
  const product = signedFromBitsAny(productBits);

  steps.push({
    title: `Done: product register AQ = ${productBits.join("")} (${product} decimal)`,
    iteration: n,
    a,
    q,
    qMinus1: qm1,
    m,
    decoded: "nop",
    willShift: false,
    highlightA: Array.from({ length: n }, (_, idx) => idx),
    highlightQ: Array.from({ length: n }, (_, idx) => idx),
    highlightQM1: true,
  });

  return steps;
}

/** Reconstruct signed 2n-bit product from final A and Q (MSB-first halves). */
export function productFromAQ(a: readonly string[], q: readonly string[]): number {
  return signedFromBitsAny([...a, ...q]);
}
