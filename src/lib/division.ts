import { inUnsignedRange, unsignedToBits, unsignedFromBits } from "./binary";
import type { BitWidth } from "./types";

export interface RestoringDivisionStep {
  title: string;
  index: number;
  phase: "init" | "shift-left" | "subtract" | "restore" | "quotient-bit" | "done";
  a: readonly string[];
  q: readonly string[];
  m: readonly string[];
  /** MSB-first indices to emphasize in A. */
  highlightA: readonly number[];
  /** MSB-first indices to emphasize in Q. */
  highlightQ: readonly number[];
}

function concatMsb(a: readonly string[], q: readonly string[]): string[] {
  return [...a, ...q];
}

function splitMsb(t: readonly string[], n: number): { a: string[]; q: string[] } {
  return { a: t.slice(0, n), q: t.slice(n, 2 * n) };
}

function shiftLeftAQ(a: readonly string[], q: readonly string[], n: number): { a: string[]; q: string[] } {
  const t = concatMsb(a, q);
  const newT = t.slice(1).concat("0");
  return splitMsb(newT, n);
}

function subtractUnsignedMsb(a: readonly string[], m: readonly string[], n: BitWidth): {
  bits: string[];
  underflow: boolean;
} {
  const av = unsignedFromBits(a);
  const mv = unsignedFromBits(m);
  if (av >= mv) {
    return { bits: unsignedToBits(av - mv, n), underflow: false };
  }
  // Borrow path: still compute (av - mv) mod 2^n for visualization of the attempted subtract.
  const mod = 1 << n;
  const wrapped = (av - mv) & (mod - 1);
  return { bits: unsignedToBits(wrapped, n), underflow: true };
}

function addUnsignedMsb(a: readonly string[], m: readonly string[], n: BitWidth): string[] {
  const av = unsignedFromBits(a);
  const mv = unsignedFromBits(m);
  return unsignedToBits((av + mv) & ((1 << n) - 1), n);
}

/**
 * Unsigned restoring division: dividend in Q, divisor in M, A starts at zero.
 * After `n` iterations, Q holds the quotient and A holds the remainder.
 */
export function buildRestoringDivisionTrace(dividend: number, divisor: number, n: BitWidth): RestoringDivisionStep[] {
  if (!inUnsignedRange(dividend, n) || !inUnsignedRange(divisor, n)) {
    throw new RangeError("Dividend and divisor must be unsigned values in the selected width.");
  }
  if (divisor === 0) {
    throw new RangeError("Divisor must be non-zero.");
  }

  const m = unsignedToBits(divisor, n);
  let a = unsignedToBits(0, n);
  let q = unsignedToBits(dividend, n);

  const steps: RestoringDivisionStep[] = [];
  let idx = 0;

  steps.push({
    title: "Initialize: A←0, Q←dividend, M←divisor",
    index: idx++,
    phase: "init",
    a,
    q,
    m,
    highlightA: [],
    highlightQ: Array.from({ length: n }, (_, i) => i),
  });

  for (let i = 0; i < n; i++) {
    const shifted = shiftLeftAQ(a, q, n);
    a = shifted.a;
    q = shifted.q;

    steps.push({
      title: `Round ${i + 1}/${n}: shift (A,Q) left (inject 0 at LSB of Q)`,
      index: idx++,
      phase: "shift-left",
      a,
      q,
      m,
      highlightA: Array.from({ length: n }, (_, j) => j),
      highlightQ: Array.from({ length: n }, (_, j) => j),
    });

    const sub = subtractUnsignedMsb(a, m, n);
    const attempted = sub.bits;

    steps.push({
      title: `Round ${i + 1}/${n}: A ← A − M (trial subtract)`,
      index: idx++,
      phase: "subtract",
      a: attempted,
      q,
      m,
      highlightA: Array.from({ length: n }, (_, j) => j),
      highlightQ: [],
    });

    if (sub.underflow) {
      a = addUnsignedMsb(attempted, m, n);
      const q0 = [...q];
      q0[n - 1] = "0";

      steps.push({
        title: `Round ${i + 1}/${n}: restore A (A < 0 as unsigned trial), Q₀←0`,
        index: idx++,
        phase: "restore",
        a,
        q: q0,
        m,
        highlightA: Array.from({ length: n }, (_, j) => j),
        highlightQ: [n - 1],
      });
      q = q0;
    } else {
      a = attempted;
      const q1 = [...q];
      q1[n - 1] = "1";

      steps.push({
        title: `Round ${i + 1}/${n}: keep subtract result, Q₀←1`,
        index: idx++,
        phase: "quotient-bit",
        a,
        q: q1,
        m,
        highlightA: Array.from({ length: n }, (_, j) => j),
        highlightQ: [n - 1],
      });
      q = q1;
    }
  }

  const qVal = unsignedFromBits(q);
  const aVal = unsignedFromBits(a);
  steps.push({
    title: `Done: quotient=${qVal}, remainder=${aVal} (check: ${dividend} = ${qVal}·${divisor} + ${aVal})`,
    index: idx++,
    phase: "done",
    a,
    q,
    m,
    highlightA: Array.from({ length: n }, (_, j) => j),
    highlightQ: Array.from({ length: n }, (_, j) => j),
  });

  return steps;
}
