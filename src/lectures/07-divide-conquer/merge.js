import { parseArray } from "../../core/utils.js";
import { describeMergeState, renderMergeMechanism } from "./sort-view.js";

const DEFAULT_LINES = { initial: 1, compare: 3, left: 3, right: 4, tailC: 6, tailB: 7 };

export function parseMergeInput(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2) throw new Error("Separate the two sorted runs with |, for example 2, 6 | 3, 7.");
  const runs = parts.map((part) => part.trim() ? parseArray(part, { min: 1, max: 12 }) : []);
  if (!runs[0].length && !runs[1].length) throw new Error("At least one sorted run must contain a number.");
  if (runs[0].length + runs[1].length > 12) throw new Error("The two runs may contain at most 12 numbers altogether.");
  if (runs.flat().some((value) => Math.abs(value) > 1_000_000)) throw new Error("Every key must be between −1,000,000 and 1,000,000.");
  runs.forEach((values, run) => {
    if (values.some((value, index) => index > 0 && value < values[index - 1])) {
      throw new Error(`Run ${run === 0 ? "B" : "C"} must be in nondecreasing order.`);
    }
  });
  return { B: runs[0], C: runs[1] };
}

// The source's copy-remainder statement is one event, not an invented loop.
export function traceMergeRuns(inputB, inputC, options = {}) {
  const B = [...inputB], C = [...inputC];
  const BOrigins = [...(options.BOrigins ?? B.map((_, index) => `B[${index}]`))];
  const COrigins = [...(options.COrigins ?? C.map((_, index) => `C[${index}]`))];
  const A = Array(B.length + C.length).fill(null);
  const AOrigins = Array(A.length).fill(null);
  const lines = options.lines ?? DEFAULT_LINES;
  let i = 0, j = 0, k = 0;
  let comparisons = options.comparisons ?? 0;
  let mergeComparisons = 0;
  const trace = [];
  const push = (phase, activeLine, message, extra = {}) => trace.push({
    B: [...B], C: [...C], A: [...A], BOrigins: [...BOrigins], COrigins: [...COrigins], AOrigins: [...AOrigins],
    i, j, k, comparisons, mergeComparisons, phase, activeLine, message,
    comparison: null, moves: [], ...extra
  });
  push("initial", lines.initial, "Initialize i = 0, j = 0, k = 0; the output A is empty.");
  while (i < B.length && j < C.length) {
    const comparison = { i, j, left: B[i], right: C[j], takeLeft: B[i] <= C[j] };
    comparisons += 1;
    mergeComparisons += 1;
    push("compare", lines.compare, `Compare B[${i}] = ${B[i]} ≤ C[${j}] = ${C[j]}: ${comparison.takeLeft ? "true; choose B" : "false; choose C"}.`, { comparison });
    const run = comparison.takeLeft ? "B" : "C";
    const from = comparison.takeLeft ? i : j;
    A[k] = comparison.takeLeft ? B[i] : C[j];
    AOrigins[k] = comparison.takeLeft ? BOrigins[i] : COrigins[j];
    const move = { run, from, to: k, value: A[k], origin: AOrigins[k] };
    if (comparison.takeLeft) i += 1;
    else j += 1;
    push("take", comparison.takeLeft ? lines.left : lines.right,
      `Copy ${run}[${from}] = ${A[k]} to A[${k}] and advance ${run === "B" ? "i" : "j"}.${comparison.left === comparison.right ? " Equal keys take B first." : ""}`, { moves: [move] });
    // k's increment is bookkeeping between meaningful comparison/copy events.
    k += 1;
  }
  const run = i === B.length ? "C" : "B";
  const remaining = run === "B" ? B : C;
  const origins = run === "B" ? BOrigins : COrigins;
  const start = run === "B" ? i : j;
  const moves = [];
  for (let from = start; from < remaining.length; from += 1) {
    const to = k + from - start;
    A[to] = remaining[from];
    AOrigins[to] = origins[from];
    moves.push({ run, from, to, value: A[to], origin: AOrigins[to] });
  }
  if (moves.length) push("tail", run === "B" ? lines.tailB : lines.tailC,
    `${run === "B" ? "C" : "B"} is exhausted. Copy ${run}[${start}..${remaining.length - 1}] to A[${k}..${A.length - 1}]; no key comparison is needed.`, { moves });
  return { trace, values: [...A], origins: [...AOrigins], comparisons, mergeComparisons };
}

export function buildMergeTrace({ B, C }) {
  const result = traceMergeRuns(B, C);
  const last = result.trace.at(-1);
  return [...result.trace, { ...last, phase: "complete", activeLine: null, activeLabel: "Generalize", comparison: null, moves: [],
    B: [...last.B], C: [...last.C], A: [...last.A], BOrigins: [...last.BOrigins], COrigins: [...last.COrigins], AOrigins: [...last.AOrigins],
    message: `Merge complete: ${B.length + C.length} values in nondecreasing order, using ${result.comparisons} key comparisons.` }];
}

export const mergeModule = {
  id: "merge", shortTitle: "Merge", title: "Merging Two Sorted Arrays",
  summary: "Compare the two current heads, copy the smaller key, and append the remainder when one run is exhausted.",
  complexity: "Θ(p + q) total merge work",
  source: { slides: "20–33, 49" },
  objective: "Identify both comparison operands and distinguish counted comparisons from copying a remaining run.",
  input: {
    label: "Sorted run B | sorted run C",
    hint: "Enter two nondecreasing runs separated by |, at most 12 keys from −1,000,000 to 1,000,000. One run may be empty. Equal keys take B first.",
    default: "2, 6, 8, 11, 19, 21 | 3, 7, 10, 12, 13, 16",
    presets: [
      { label: "Lecture merge", value: "2, 6, 8, 11, 19, 21 | 3, 7, 10, 12, 13, 16" },
      { label: "Left run finishes first", value: "2, 3, 6, 7, 8, 10 | 11, 12, 13, 16, 19, 21" },
      { label: "Equal heads", value: "2, 6, 8 | 2, 6, 8" }
    ],
    parse: parseMergeInput
  },
  pseudocode: [
    { line: 1, text: "i ← 0; j ← 0; k ← 0" },
    { line: 2, text: "while i < p and j < q do" },
    { line: 3, text: "if B[i] ≤ C[j]: A[k] ← B[i]; i ← i + 1", indent: 1, basic: true, basicLabel: "key comparison B[i] ≤ C[j]" },
    { line: 4, text: "else A[k] ← C[j]; j ← j + 1", indent: 1 },
    { line: 5, text: "k ← k + 1", indent: 1 },
    { line: 6, text: "if i = p copy C[j..q − 1] to A[k..p + q − 1]" },
    { line: 7, text: "else copy B[i..p − 1] to A[k..p + q − 1]" }
  ],
  buildTrace: buildMergeTrace,
  render: (step) => renderMergeMechanism(step),
  describe(step) { return { summary: step.message, state: describeMergeState(step) }; },
  metrics: (step) => [{ label: "Key comparisons", value: step.comparisons, emphasis: true }],
  model(step) {
    if (step.phase !== "complete") return { latex: `C_{\\mathrm{seen}}=${step.comparisons}`, notes: ["Only B[i] ≤ C[j] adds a key comparison; copying adds none."] };
    const p = step.B.length, q = step.C.length;
    return {
      latex: p && q ? `\\begin{aligned}C_{\\mathrm{trace}}&=${step.comparisons}\\\\C_{\\mathrm{merge}}(p,q)&\\le p+q-1=${p + q - 1}\\end{aligned}` : "C_{\\mathrm{trace}}=0",
      notes: [p && q ? "With both runs nonempty, at most p + q − 1 head comparisons leave one run exhausted." : "An empty input run needs no key comparison; copy the other run.", "Every input key is written once. The ≤ rule preserves the left-to-right order of equal keys."]
    };
  },
  analysis: [
    { term: "Input size", value: "p + q, the combined length of the two sorted runs" },
    { term: "Basic operation", value: "B[i] ≤ C[j], evaluated only while both runs have a current head" },
    { term: "Remainder", value: "One source copy statement copies the whole remaining range without further key comparisons" },
    { term: "Stability", value: "Equal heads choose B first, preserving the order of equal keys across adjacent runs" },
    { term: "Source example", value: "Slides 21–31 contain 21; slide 32 prints 20 in its final cell. This trace preserves the input key 21." }
  ]
};
