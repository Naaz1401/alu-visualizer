import type { BitWidth } from "./types";

/** Minimum signed integer representable in `w` bits (two's complement). */
export function signedMin(w: BitWidth): number {
  return -(1 << (w - 1));
}

/** Maximum signed integer representable in `w` bits (two's complement). */
export function signedMax(w: BitWidth): number {
  return (1 << (w - 1)) - 1;
}

/** Maximum unsigned value in `w` bits. */
export function unsignedMax(w: BitWidth): number {
  return (1 << w) - 1;
}

export function inSignedRange(value: number, w: BitWidth): boolean {
  return Number.isInteger(value) && value >= signedMin(w) && value <= signedMax(w);
}

export function inUnsignedRange(value: number, w: BitWidth): boolean {
  return Number.isInteger(value) && value >= 0 && value <= unsignedMax(w);
}

/**
 * Convert a signed integer to two's complement, returned as MSB-first bit strings.
 */
export function signedToBits(value: number, w: BitWidth): string[] {
  if (!inSignedRange(value, w)) {
    throw new RangeError(`Value ${value} out of signed ${w}-bit range`);
  }
  const mask = (1 << w) - 1;
  const u = value & mask;
  const out: string[] = [];
  for (let i = w - 1; i >= 0; i--) {
    out.push(((u >> i) & 1) === 1 ? "1" : "0");
  }
  return out;
}

/** Unsigned interpretation → MSB-first bits. */
export function unsignedToBits(value: number, w: BitWidth): string[] {
  if (!inUnsignedRange(value, w)) {
    throw new RangeError(`Value ${value} out of unsigned ${w}-bit range`);
  }
  const out: string[] = [];
  for (let i = w - 1; i >= 0; i--) {
    out.push(((value >> i) & 1) === 1 ? "1" : "0");
  }
  return out;
}

/** MSB-first bits → unsigned integer. */
export function unsignedFromBits(bits: readonly string[]): number {
  let v = 0;
  for (let i = 0; i < bits.length; i++) {
    v = (v << 1) | (bits[i] === "1" ? 1 : 0);
  }
  return v >>> 0;
}

/** MSB-first bits → signed integer for width `w`. */
export function signedFromBits(bits: readonly string[], w: BitWidth): number {
  if (bits.length !== w) throw new Error(`Expected ${w} bits, got ${bits.length}`);
  const u = unsignedFromBits(bits) & ((1 << w) - 1);
  const sign = 1 << (w - 1);
  if (u & sign) return u - (1 << w);
  return u;
}

/**
 * Signed two's complement for arbitrary width up to 32 bits (common ALU sizes).
 * Uses doubling instead of bitwise shifts to avoid JS 32-bit shift pitfalls at width 32.
 */
export function signedFromBitsAny(bits: readonly string[]): number {
  const w = bits.length;
  if (w === 0) return 0;
  if (w > 32) throw new RangeError("This helper supports widths up to 32 bits.");
  let mag = 0;
  for (let i = 0; i < w; i++) {
    mag *= 2;
    mag += bits[i] === "1" ? 1 : 0;
  }
  const mod = 2 ** w;
  if (mag >= mod / 2) return mag - mod;
  return mag;
}

/** Parse user decimal input; returns NaN if invalid. */
export function parseDecimalInput(raw: string): number {
  const t = raw.trim();
  if (t === "" || t === "-" || t === "+") return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/** `(a + b)` reduced modulo `2^w` with two's complement signed interpretation. */
export function addSignedWrap(a: number, b: number, w: BitWidth): number {
  const mask = (1 << w) - 1;
  const x = (a + b) & mask;
  const sign = 1 << (w - 1);
  if (x & sign) return x - (1 << w);
  return x;
}

/** True if `a + b` is not representable as a signed `w`-bit two's complement sum. */
export function signedAddOverflow(a: number, b: number, w: BitWidth): boolean {
  const s = addSignedWrap(a, b, w);
  return (a >= 0) === (b >= 0) && (a >= 0) !== (s >= 0);
}
