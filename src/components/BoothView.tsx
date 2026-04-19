import type { BoothStep } from "../lib/booth";
import { BitRow } from "./BitRow";

function toSet(indices: readonly number[]): Set<number> {
  return new Set(indices);
}

/**
 * Booth multiplier visualization: registers plus a compact step table for A/Q/Q₋₁.
 */
export function BoothView({ step }: { step: BoothStep }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Booth multiplication (signed)</h3>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-slate-200">
            Decode: {step.decoded}
          </span>
          {step.willShift ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-200">
              Arithmetic shift
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <BitRow label="A" bits={step.a} activeMsbIndices={toSet(step.highlightA)} shiftPulse={step.willShift} />
        <BitRow label="Q" bits={step.q} activeMsbIndices={toSet(step.highlightQ)} shiftPulse={step.willShift} />
        <div className="grid grid-cols-[4.25rem_1fr] items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Q₋₁</span>
          <div className="flex justify-end">
            <div
              className={[
                "bit-cell flex h-10 w-9 items-center justify-center rounded-md border text-sm font-semibold",
                step.qMinus1 === 1
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-50"
                  : "border-slate-700 bg-slate-900/60 text-slate-300",
                step.highlightQM1 ? "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.35)]" : "",
              ].join(" ")}
            >
              {step.qMinus1}
            </div>
          </div>
        </div>
        <BitRow label="M" bits={step.m} activeMsbIndices={new Set<number>()} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Iter</th>
              <th className="px-3 py-2">A</th>
              <th className="px-3 py-2">Q</th>
              <th className="px-3 py-2">Q₋₁</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-800 bg-slate-950/60 font-mono text-[11px] text-slate-200">
              <td className="px-3 py-2">{step.iteration}</td>
              <td className="px-3 py-2">{step.a.join("")}</td>
              <td className="px-3 py-2">{step.q.join("")}</td>
              <td className="px-3 py-2">{step.qMinus1}</td>
              <td className="px-3 py-2 text-slate-300">{step.decoded}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-slate-400">{step.title}</p>
    </div>
  );
}
