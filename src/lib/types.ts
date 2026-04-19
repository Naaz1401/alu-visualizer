/** Supported operand / register width for ALU demos. */
export type BitWidth = 8 | 16;

/** User-selectable high-level operation. */
export type AluOperation = "addition" | "booth" | "division";

/** Bit order used across modules: index 0 = MSB (left), index n-1 = LSB (right). */
export type BitString = readonly string[];
