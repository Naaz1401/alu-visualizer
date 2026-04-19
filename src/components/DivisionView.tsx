import type { RestoringDivisionStep } from "../lib/division";
import { BitRow } from "./BitRow";

function toSet(indices: readonly number[]): Set<number> {
  return new Set(indices);
}

/**
 * Restoring division visualization with phase-colored status chips.
 */
export function DivisionView({ step }: { step: RestoringDivisionStep }) {
  const phaseClass =
    step.phase === "restore"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
      : step.phase === "quotient-bit"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
        : step.phase === "shift-left"
          ? "border-sky-500/40 bg-sky-500/10 text-sky-100"
          : step.phase === "subtract"
            ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
            : "border-slate-700 bg-slate-900 text-slate-200";

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Restoring division (unsigned)</h3>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${phaseClass}`}>
          Phase: {step.phase}
        </span>
      </div>

      <div className="space-y-2">
        <BitRow
          label="A"
          bits={step.a}
          activeMsbIndices={toSet(step.highlightA)}
          shiftPulse={step.phase === "shift-left"}
        />
        <BitRow
          label="Q"
          bits={step.q}
          activeMsbIndices={toSet(step.highlightQ)}
          shiftPulse={step.phase === "shift-left"}
        />
        <BitRow label="M" bits={step.m} />
      </div>

      <p className="text-xs leading-relaxed text-slate-400">{step.title}</p>
    </div>
  );
}
