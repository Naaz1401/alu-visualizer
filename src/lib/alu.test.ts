import { describe, expect, it } from "vitest";
import { buildAdditionTrace } from "./addition";
import { addSignedWrap, signedFromBits, signedFromBitsAny, signedToBits, unsignedFromBits } from "./binary";
import { buildBoothTrace, productFromAQ } from "./booth";
import { buildRestoringDivisionTrace } from "./division";

describe("binary helpers", () => {
  it("round-trips 8-bit signed extremes", () => {
    expect(signedToBits(-128, 8).join("")).toBe("10000000");
    expect(signedToBits(127, 8).join("")).toBe("01111111");
    expect(signedFromBits(signedToBits(-37, 8), 8)).toBe(-37);
  });

  it("reconstructs a signed product from the final AQ register pair", () => {
    const steps = buildBoothTrace(-1, 3, 8);
    const last = steps[steps.length - 1];
    expect(signedFromBitsAny([...last.a, ...last.q])).toBe(-3);
  });

  it("wraps signed addition modulo the width", () => {
    expect(addSignedWrap(120, 10, 8)).toBe(-126);
  });
});

describe("ripple-carry addition trace", () => {
  it("ends on the wrapped sum for overflowing operands", () => {
    const steps = buildAdditionTrace(120, 10, 8);
    const last = steps[steps.length - 1];
    expect(signedFromBits(last.sumBits, 8)).toBe(-126);
  });
});

describe("Booth multiplication trace", () => {
  it("matches grade-school checks for small operands", () => {
    const steps = buildBoothTrace(6, -5, 8);
    const last = steps[steps.length - 1];
    expect(productFromAQ(last.a, last.q)).toBe(-30);
  });

  it("handles a non-trivial 8-bit product", () => {
    const steps = buildBoothTrace(11, 9, 8);
    const last = steps[steps.length - 1];
    expect(productFromAQ(last.a, last.q)).toBe(99);
  });
});

describe("restoring division trace", () => {
  it("recovers dividend = quotient * divisor + remainder", () => {
    const dividend = 210;
    const divisor = 11;
    const steps = buildRestoringDivisionTrace(dividend, divisor, 8);
    const last = steps[steps.length - 1];
    const q = unsignedFromBits(last.q);
    const r = unsignedFromBits(last.a);
    expect(q * divisor + r).toBe(dividend);
    expect(r).toBeLessThan(divisor);
  });
});
