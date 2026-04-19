import type { AdditionStep } from "../lib/addition";
import type { BitWidth } from "../lib/types";
import { BitRow } from "./BitRow";

function toSet(indices: readonly number[]): Set<number> {
  return new Set(indices);
}

/** Small carry digits aligned with each bit column (MSB-first indexing). */
function carryAnnotations(step: AdditionStep, w: BitWidth): string[] {
  const out: string[] = [];
  for (let msbIdx = 0; msbIdx < w; msbIdx++) {
    const k = w - 1 - msbIdx; // LSB column index
    out.push(String(step.carries[k]));
  }
  return out;
}

/**
 * Ripple-carry addition visualization with carry digits and active-column highlighting.
 */
export function AdditionView({ step, width }: { step: AdditionStep; width: BitWidth }) {
  const cout = step.carries[width];
  const carryAnn = carryAnnotations(step, width);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner shadow-black/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Binary addition (ripple carry)</h3>
        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-300">
          c_out = {cout}
        </span>
      </div>

      <div className="grid grid-cols-[4.25rem_1fr] items-end gap-y-2">
        <span className="text-xs font-semibold text-slate-500">c_in</span>
        <div className="flex justify-end gap-1">
          {carryAnn.map((c, i) => (
            <div key={`cin-${i}`} className="flex w-9 flex-col items-center gap-1">
              <span className="text-[11px] font-bold text-sky-300">{c}</span>
              <div className="h-3 w-px bg-gradient-to-b from-sky-400/70 to-transparent" />
            </div>
          ))}
        </div>

        <div className="col-span-2 space-y-2">
          <BitRow label="A" bits={step.aBits} activeMsbIndices={toSet(step.highlightA)} />
          <BitRow label="B" bits={step.bBits} activeMsbIndices={toSet(step.highlightB)} />
        </div>
      </div>

      <CarryPulseRow step={step} width={width} />

      <BitRow label="S" bits={step.sumBits} activeMsbIndices={toSet(step.highlightSum)} />

      <p className="text-xs leading-relaxed text-slate-400">{step.title}</p>
    </div>
  );
}

function CarryPulseRow({ step, width }: { step: AdditionStep; width: BitWidth }) {
  return (
    <div className="grid grid-cols-[4.25rem_1fr] items-center">
      <span className="text-xs font-semibold text-slate-500">flow</span>
      <div className="flex justify-end gap-1">
        {Array.from({ length: width }, (_, msbIdx) => {
          const active = step.carryFlow.some((e) => e.to === msbIdx || e.from === msbIdx);
          return (
            <div key={`flow-${msbIdx}`} className="flex h-8 w-9 items-end justify-center">
              {active ? (
                <span className="carry-arrow text-lg font-bold text-amber-300">↓</span>
              ) : (
                <span className="text-slate-800">·</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
