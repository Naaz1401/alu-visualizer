import { useEffect, useState } from "react";
import { AdditionView } from "./components/AdditionView";
import { BoothView } from "./components/BoothView";
import { DivisionView } from "./components/DivisionView";
import { buildAdditionTrace, type AdditionStep } from "./lib/addition";
import {
  addSignedWrap,
  inSignedRange,
  inUnsignedRange,
  parseDecimalInput,
  signedAddOverflow,
  signedToBits,
  unsignedFromBits,
} from "./lib/binary";
import { buildBoothTrace, productFromAQ, type BoothStep } from "./lib/booth";
import { buildRestoringDivisionTrace, type RestoringDivisionStep } from "./lib/division";
import type { AluOperation, BitWidth } from "./lib/types";

type Trace =
  | {
      kind: "addition";
      steps: AdditionStep[];
      summary: { resultBits: string; resultDecimal: number; overflow: boolean };
    }
  | {
      kind: "booth";
      steps: BoothStep[];
      summary: { productBits: string; productDecimal: number };
    }
  | {
      kind: "division";
      steps: RestoringDivisionStep[];
      summary: { quotient: number; remainder: number; quotientBits: string; remainderBits: string };
    };

const BIT_WIDTHS: readonly BitWidth[] = [8, 16];

/**
 * Root application shell: collects operands, runs the selected ALU algorithm,
 * and exposes playback controls over the generated step history.
 */
export default function App() {
  const [rawA, setRawA] = useState("12");
  const [rawB, setRawB] = useState("7");
  const [bitWidth, setBitWidth] = useState<BitWidth>(8);
  const [operation, setOperation] = useState<AluOperation>("addition");
  const [manualMode, setManualMode] = useState(true);
  const [speedMs, setSpeedMs] = useState(520);
  const [playing, setPlaying] = useState(false);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const aNum = parseDecimalInput(rawA);
  const bNum = parseDecimalInput(rawB);
  const operandALabel = operation === "division" ? "Dividend (loads into Q)" : "Operand A";
  const operandBLabel = operation === "division" ? "Divisor (M)" : "Operand B";

  const execute = () => {
    setError(null);
    setPlaying(false);

    if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) {
      setTrace(null);
      setError("Please enter two valid integers.");
      return;
    }

    try {
      if (operation === "addition" || operation === "booth") {
        if (!inSignedRange(aNum, bitWidth) || !inSignedRange(bNum, bitWidth)) {
          throw new Error(`Signed operands must lie in [${-(1 << (bitWidth - 1))}, ${(1 << (bitWidth - 1)) - 1}].`);
        }
      } else {
        if (!inUnsignedRange(aNum, bitWidth) || !inUnsignedRange(bNum, bitWidth)) {
          throw new Error(`Unsigned division operands must lie in [0, ${(1 << bitWidth) - 1}].`);
        }
        if (bNum === 0) throw new Error("Divisor must be non-zero.");
      }

      if (operation === "addition") {
        const steps = buildAdditionTrace(aNum, bNum, bitWidth);
        const wrapped = addSignedWrap(aNum, bNum, bitWidth);
        setTrace({
          kind: "addition",
          steps,
          summary: {
            resultBits: signedToBits(wrapped, bitWidth).join(""),
            resultDecimal: wrapped,
            overflow: signedAddOverflow(aNum, bNum, bitWidth),
          },
        });
      } else if (operation === "booth") {
        const steps = buildBoothTrace(aNum, bNum, bitWidth);
        const last = steps[steps.length - 1];
        const productDecimal = productFromAQ(last.a, last.q);
        const productBits = [...last.a, ...last.q].join("");
        setTrace({ kind: "booth", steps, summary: { productBits, productDecimal } });
      } else {
        const steps = buildRestoringDivisionTrace(aNum, bNum, bitWidth);
        const last = steps[steps.length - 1];
        const quotientBits = last.q.join("");
        const remainderBits = last.a.join("");
        const quotient = unsignedFromBits(last.q);
        const remainder = unsignedFromBits(last.a);
        setTrace({
          kind: "division",
          steps,
          summary: { quotient, remainder, quotientBits, remainderBits },
        });
      }

      setStepIndex(0);
      setPlaying(!manualMode);
    } catch (e) {
      setTrace(null);
      setError(e instanceof Error ? e.message : "Unable to build trace.");
    }
  };

  useEffect(() => {
    if (!trace) return;
    if (!playing || manualMode) return;
    if (stepIndex >= trace.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setStepIndex((i) => Math.min(i + 1, trace.steps.length - 1));
    }, speedMs);
    return () => window.clearTimeout(id);
  }, [trace, playing, manualMode, stepIndex, speedMs]);

  const currentStep = trace ? trace.steps[stepIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">Educational ALU</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">ALU Visualizer</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Step through ripple-carry addition, Booth multiplication, and restoring division with animated register
              updates, carry cues, and responsive layouts tailored for lecture demos.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400 shadow-lg shadow-black/30">
            <div className="font-semibold text-slate-200">Tip</div>
            <p className="mt-1 max-w-xs">
              Toggle <span className="text-slate-200">Step-by-step</span> to drive the timeline with{" "}
              <span className="text-slate-200">Next</span>/<span className="text-slate-200">Prev</span>, or disable it
              for timed playback with adjustable speed.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl shadow-black/40 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-200">Controls</h2>

            <label className="block text-xs font-semibold text-slate-400">
              {operandALabel}
              <input
                value={rawA}
                onChange={(e) => setRawA(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/40"
                inputMode="numeric"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-400">
              {operandBLabel}
              <input
                value={rawB}
                onChange={(e) => setRawB(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/40"
                inputMode="numeric"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-400">
              Bit width
              <select
                value={bitWidth}
                onChange={(e) => setBitWidth(Number(e.target.value) as BitWidth)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/40"
              >
                {BIT_WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w} bits
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-400">
              Operation
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as AluOperation)}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="addition">Binary addition</option>
                <option value="booth">Booth multiplication</option>
                <option value="division">Restoring division</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={manualMode}
                onChange={(e) => {
                  setManualMode(e.target.checked);
                  setPlaying(false);
                }}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/40"
              />
              Step-by-step mode (manual Next/Prev)
            </label>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Animation speed</span>
                <span className="font-mono text-sky-200">{speedMs} ms</span>
              </div>
              <input
                type="range"
                min={120}
                max={1400}
                step={40}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="mt-2 w-full accent-sky-400"
              />
            </div>

            <button
              type="button"
              onClick={execute}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:translate-y-px"
            >
              Execute
            </button>

            {error ? (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl shadow-black/40 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Timeline</h2>
                  <p className="text-xs text-slate-500">
                    {trace ? `Step ${stepIndex + 1} of ${trace.steps.length}` : "Run Execute to populate history."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!trace}
                    onClick={() => {
                      setStepIndex((i) => Math.max(0, i - 1));
                      setPlaying(false);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition enabled:hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={!trace}
                    onClick={() => {
                      setStepIndex((i) => (trace ? Math.min(trace.steps.length - 1, i + 1) : i));
                      setPlaying(false);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition enabled:hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    disabled={!trace}
                    onClick={() => {
                      setStepIndex(0);
                      setPlaying(false);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 transition enabled:hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled={!trace || manualMode}
                    onClick={() => setPlaying((p) => !p)}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {playing ? "Pause" : "Play"}
                  </button>
                </div>
              </div>

              {trace ? (
                <div className="mt-4 space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={trace.steps.length - 1}
                    value={stepIndex}
                    onChange={(e) => {
                      setPlaying(false);
                      setStepIndex(Number(e.target.value));
                    }}
                    className="w-full accent-sky-400"
                  />
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
                      style={{ width: `${((stepIndex + 1) / trace.steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-1 shadow-inner shadow-black/40">
              {!trace || !currentStep ? (
                <div className="rounded-[1.35rem] border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
                  Configure operands, choose an operation, then press <span className="text-slate-200">Execute</span>{" "}
                  to visualize register motion.
                </div>
              ) : trace.kind === "addition" ? (
                <AdditionView step={currentStep as AdditionStep} width={bitWidth} />
              ) : trace.kind === "booth" ? (
                <BoothView step={currentStep as BoothStep} />
              ) : (
                <DivisionView step={currentStep as RestoringDivisionStep} />
              )}
            </div>

            {trace ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-200 shadow-lg shadow-black/30">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Final summary</h3>
                {trace.kind === "addition" ? (
                  <div className="mt-3 space-y-1 font-mono text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-400">Sum (wrapped):</span>{" "}
                      <span className="text-sky-200">{trace.summary.resultBits}</span>{" "}
                      <span className="text-slate-500">|</span>{" "}
                      <span className="text-emerald-200">{trace.summary.resultDecimal}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Signed overflow (infinite-precision vs. finite width):{" "}
                      <span className={trace.summary.overflow ? "text-amber-200" : "text-emerald-200"}>
                        {trace.summary.overflow ? "yes" : "no"}
                      </span>
                    </div>
                  </div>
                ) : trace.kind === "booth" ? (
                  <div className="mt-3 space-y-1 font-mono text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-400">Product (AQ):</span>{" "}
                      <span className="text-sky-200">{trace.summary.productBits}</span>{" "}
                      <span className="text-slate-500">|</span>{" "}
                      <span className="text-emerald-200">{trace.summary.productDecimal}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-1 font-mono text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-400">Quotient:</span>{" "}
                      <span className="text-sky-200">{trace.summary.quotientBits}</span>{" "}
                      <span className="text-slate-500">|</span>{" "}
                      <span className="text-emerald-200">{trace.summary.quotient}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Remainder:</span>{" "}
                      <span className="text-sky-200">{trace.summary.remainderBits}</span>{" "}
                      <span className="text-slate-500">|</span>{" "}
                      <span className="text-emerald-200">{trace.summary.remainder}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <footer className="border-t border-slate-800 pt-6 text-xs text-slate-500">
          Built with React + Tailwind CSS v4. Arithmetic kernels live under <code className="text-slate-300">src/lib</code>{" "}
          for easy unit testing.
        </footer>
      </div>
    </div>
  );
}
