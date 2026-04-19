import { useMemo } from "react";

export interface BitRowProps {
  label: string;
  bits: readonly string[];
  /** MSB-first indices to highlight. */
  activeMsbIndices?: ReadonlySet<number>;
  /** Optional per-bit annotation (e.g., carry digits), MSB-first. */
  annotations?: readonly string[];
  /** When true, nudges bits slightly to visualize a shift pulse. */
  shiftPulse?: boolean;
}

/**
 * Renders a labeled horizontal register with individual bit cells.
 * Bits are shown left → right as MSB → LSB to match textbook notation.
 */
export function BitRow({ label, bits, activeMsbIndices, annotations, shiftPulse }: BitRowProps) {
  const active = useMemo(() => activeMsbIndices ?? new Set<number>(), [activeMsbIndices]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="w-10 shrink-0 text-xs font-semibold tracking-wide text-slate-400">{label}</span>
        <div className={`flex flex-1 justify-end gap-1 ${shiftPulse ? "translate-x-1.5" : ""}`}>
          {bits.map((b, i) => {
            const isOn = active.has(i);
            return (
              <div key={`${label}-${i}`} className="flex flex-col items-center gap-1">
                {annotations && (
                  <span className="h-4 text-[10px] font-semibold text-sky-300/90">{annotations[i] ?? ""}</span>
                )}
                <div
                  className={[
                    "bit-cell flex h-10 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-transform",
                    b === "1"
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-50"
                      : "border-slate-700 bg-slate-900/60 text-slate-300",
                    isOn ? "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)]" : "",
                  ].join(" ")}
                >
                  {b}
                </div>
                <span className="text-[9px] font-medium text-slate-600">{bits.length - 1 - i}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
