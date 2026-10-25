import { parseArray } from "../../core/utils.js";
import { traceMergeRuns } from "./merge.js";
import { describeMergeState, indexedRun, renderMergesort } from "./sort-view.js";

const MERGE_LINES = { initial: 8, compare: 10, left: 10, right: 11, tailC: 13, tailB: 14 };

export function parseMergesortInput(raw) {
  const values = parseArray(raw, { min: 1, max: 10 });
  if (values.some((value) => Math.abs(value) > 1_000_000)) throw new Error("Every key must be between −1,000,000 and 1,000,000.");
  return values;
}

export function buildMergesortTrace(input) {
  const original = [...input], trace = [], nodes = [], stack = [], mergeCounts = [];
  let comparisons = 0, activeId = "root", nextChild = null, merge = null;
  const makeNode = (id, values, origins, start, depth, parentId = null) => ({
    id, input: [...values], inputOrigins: [...origins], start, end: start + values.length - 1, depth, parentId,
    leftId: null, rightId: null, result: null, resultOrigins: null, status: "pending"
  });
  nodes.push(makeNode("root", original, original.map((_, index) => `A[${index}]`), 0, 0));
  function push(phase, activeLine, message, extra = {}) {
    trace.push({ phase, activeLine, message, original: [...original], comparisons, activeId, nextChild,
      stack: [...stack], mergeCounts: mergeCounts.map((entry) => ({ ...entry })),
      nodes: nodes.map((node) => ({ ...node, input: [...node.input], inputOrigins: [...node.inputOrigins], result: node.result && [...node.result], resultOrigins: node.resultOrigins && [...node.resultOrigins] })),
      merge: merge && { ...merge, B: [...merge.B], C: [...merge.C], A: [...merge.A], BOrigins: [...merge.BOrigins], COrigins: [...merge.COrigins], AOrigins: [...merge.AOrigins], comparison: merge.comparison && { ...merge.comparison }, moves: merge.moves.map((move) => ({ ...move })) },
      ...extra });
  }
  push("initial", null, "Begin with the lecture array; no recursive call has returned a sorted run yet.", { activeLabel: "Ready" });
  function sort(id) {
    const node = nodes.find((entry) => entry.id === id);
    activeId = id; nextChild = null; merge = null; stack.push(id);
    if (node.input.length === 1) {
      node.status = "returned"; node.result = [...node.input]; node.resultOrigins = [...node.inputOrigins];
      push("base", 1, `A[${node.start}..${node.end}] has one key; return ${node.input[0]} without a key comparison.`);
    } else {
      const mid = Math.floor(node.input.length / 2);
      const left = makeNode(`${id}L`, node.input.slice(0, mid), node.inputOrigins.slice(0, mid), node.start, node.depth + 1, id);
      const right = makeNode(`${id}R`, node.input.slice(mid), node.inputOrigins.slice(mid), node.start + mid, node.depth + 1, id);
      node.leftId = left.id; node.rightId = right.id; node.status = "divided"; nodes.push(left, right);
      push("split", 3, `Copy A[${node.start}..${left.end}] into B (${mid} keys) and A[${right.start}..${node.end}] into C (${right.input.length} keys).`);
      nextChild = left.id;
      push("call-left", 4, `Recursively sort B, the left run A[${left.start}..${left.end}].`);
      sort(left.id);
      activeId = id; merge = null; nextChild = right.id;
      push("call-right", 5, `B has returned [${left.result.join(", ")}]; recursively sort C, A[${right.start}..${right.end}].`);
      sort(right.id);
      activeId = id; nextChild = null; node.status = "merging";
      const merged = traceMergeRuns(left.result, right.result, { BOrigins: left.resultOrigins, COrigins: right.resultOrigins, comparisons, lines: MERGE_LINES });
      for (const step of merged.trace) {
        merge = step; comparisons = step.comparisons;
        push(step.phase === "initial" ? "merge-start" : `merge-${step.phase}`, step.activeLine,
          `Merge A[${node.start}..${node.end}]: ${step.message}`);
      }
      node.result = [...merged.values]; node.resultOrigins = [...merged.origins]; node.status = "returned";
      mergeCounts.push({ id, size: node.input.length, comparisons: merged.mergeComparisons });
      merge = null;
      push("return", 6, `The merge returns [${node.result.join(", ")}] for A[${node.start}..${node.end}]; retain this sorted result.`);
    }
    stack.pop();
  }
  sort("root");
  activeId = "root"; nextChild = null; merge = null;
  push("complete", null, `Mergesort complete: [${nodes[0].result.join(", ")}], using ${comparisons} key comparisons.`, { activeLabel: "Generalize" });
  return trace;
}

function describeMergesort(step) {
  const active = step.nodes.find((node) => node.id === step.activeId), root = step.nodes[0];
  const empty = { B: [], C: [], A: [], BOrigins: [], COrigins: [], AOrigins: [], i: null, j: null, k: null, phase: "inactive", comparison: null, moves: [], comparisons: step.comparisons };
  return { summary: step.message, state: [
    { label: "Original array A", value: indexedRun(step.original, "A") },
    { label: "Input size n", value: String(step.original.length) },
    { label: "Index convention", value: "Tree ranges identify original subarray positions; each merge uses local A, B, C indices starting at 0" },
    { label: "Active recursive call", value: `A[${active.start}..${active.end}], size ${active.input.length}; ${active.status}` },
    { label: "Call path", value: step.stack.length ? step.stack.map((id) => { const node = step.nodes.find((entry) => entry.id === id); return `A[${node.start}..${node.end}]`; }).join(" → ") : step.phase === "initial" ? "none; recursion has not started" : "none; all calls returned" },
    { label: "Next recursive call", value: step.nextChild ? (() => { const node = step.nodes.find((entry) => entry.id === step.nextChild); return `A[${node.start}..${node.end}]`; })() : "none" },
    { label: "Recursion tree", value: step.nodes.map((node) => `${node.id}: A[${node.start}..${node.end}]; input [${node.input.join(", ")}]; ${node.status}; children ${node.leftId ? `${node.leftId}, ${node.rightId}` : "none"}; returned ${node.result ? `[${node.result.join(", ")}]` : "none"}`).join(" | ") },
    { label: "Retained sorted results", value: step.nodes.filter((node) => node.result).map((node) => `A[${node.start}..${node.end}] = [${node.result.join(", ")}]`).join("; ") || "none" },
    ...describeMergeState(step.merge ?? empty).filter((row) => row.label !== "Key comparisons"),
    { label: "Completed merge counts", value: step.mergeCounts.length ? step.mergeCounts.map((entry) => `${entry.id}: size ${entry.size}, ${entry.comparisons} comparisons`).join("; ") : "none" },
    { label: "Root result", value: root.result ? indexedRun(root.result, "A") : "not returned" },
    { label: "Stable result origins", value: root.resultOrigins ? root.resultOrigins.join(", ") : "not returned" },
    { label: "Key comparisons", value: String(step.comparisons) }
  ] };
}

export const mergesortModule = {
  id: "mergesort", shortTitle: "Mergesort", title: "Mergesort",
  summary: "Divide with floor/ceiling halves, retain recursive results, and merge them with visible key comparisons.",
  complexity: "Worst-case Θ(n log n)", source: { slides: "18–19, 33–50" },
  objective: "Follow left-first recursion and connect the merges' exact comparisons to the lecture's worst-case recurrence.",
  input: {
    label: "Array A", hint: "Enter 1–10 keys from −1,000,000 to 1,000,000. Left/right sizes use floor(n/2)/ceil(n/2); equal keys keep their order.",
    default: "8, 3, 2, 9, 7, 1, 5, 4",
    presets: [
      { label: "Lecture array", value: "8, 3, 2, 9, 7, 1, 5, 4" },
      { label: "Lecture keys: worst comparisons", value: "1, 5, 3, 8, 2, 7, 4, 9" },
      { label: "Lecture keys: increasing", value: "1, 2, 3, 4, 5, 7, 8, 9" },
      { label: "Lecture keys: decreasing", value: "9, 8, 7, 5, 4, 3, 2, 1" },
      { label: "Odd-size prefix", value: "8, 3, 2, 9, 7" }
    ],
    parse: parseMergesortInput
  },
  pseudocode: [
    { line: 1, text: "if n > 1" },
    { line: 2, text: "copy A[0..⌊n/2⌋ − 1] to B[0..⌊n/2⌋ − 1]", indent: 1 },
    { line: 3, text: "copy A[⌊n/2⌋..n − 1] to C[0..⌈n/2⌉ − 1]", indent: 1 },
    { line: 4, text: "MergeSort(B[0..⌊n/2⌋ − 1])", indent: 1 },
    { line: 5, text: "MergeSort(C[0..⌈n/2⌉ − 1])", indent: 1 },
    { line: 6, text: "Merge(B, C, A)", indent: 1 },
    { line: 7, text: "// Merge(B, C, A), with p = |B| and q = |C|" },
    { line: 8, text: "i ← 0; j ← 0; k ← 0" },
    { line: 9, text: "while i < p and j < q do" },
    { line: 10, text: "if B[i] ≤ C[j]: A[k] ← B[i]; i ← i + 1", indent: 1, basic: true, basicLabel: "key comparison B[i] ≤ C[j]" },
    { line: 11, text: "else A[k] ← C[j]; j ← j + 1", indent: 1 },
    { line: 12, text: "k ← k + 1", indent: 1 },
    { line: 13, text: "if i = p copy C[j..q − 1] to A[k..p + q − 1]" },
    { line: 14, text: "else copy B[i..p − 1] to A[k..p + q − 1]" }
  ],
  buildTrace: buildMergesortTrace, render: renderMergesort, describe: describeMergesort,
  metrics: (step) => [{ label: "Key comparisons", value: step.comparisons, emphasis: true }],
  model(step) {
    if (step.phase !== "complete") return { latex: `C_{\\mathrm{seen}}=${step.comparisons}`, notes: ["Only a comparison of the two merge heads adds one. Dividing, copying, and singleton returns add none."] };
    const unequal = !Number.isInteger(Math.log2(step.original.length));
    return { latex: `\\begin{aligned}C_{\\mathrm{trace}}&=${step.comparisons}\\\\${unequal ? "C_w(n)&=C_w(\\lfloor n/2\\rfloor)\\\\&\\quad+C_w(\\lceil n/2\\rceil)+n-1" : "C_w(n)&=2C_w(n/2)+n-1"}\\\\C_w(1)&=0\\\\C_w(n)&\\in\\Theta(n\\log n)\\end{aligned}`,
      notes: [`Completed merges contribute ${step.mergeCounts.length ? step.mergeCounts.map((entry) => entry.comparisons).join(" + ") : "0"} = ${step.comparisons} comparisons for this input.`, "The equal-halves recurrence assumes powers of two. Other lengths use floor(n/2) and ceil(n/2).", "The recurrence uses the worst merge cost n − 1; an individual merge may use fewer comparisons."] };
  },
  analysis: [
    { term: "Input size", value: "n, the number of input keys; singleton runs require zero key comparisons" },
    { term: "Basic operation", value: "B[i] ≤ C[j] inside Merge; copying, loop guards, and recursive calls are excluded" },
    { term: "Split", value: "B has floor(n/2) keys, C has ceil(n/2); recursively sort B before C" },
    { term: "Worst-case recurrence", value: "Cw(n) = Cw(floor(n/2)) + Cw(ceil(n/2)) + n − 1, with Cw(1) = 0" },
    { term: "Lecture conclusion", value: "For equal halves, a = 2, b = 2, d = 1, so Cw(n) ∈ Θ(n log n)" },
    { term: "Properties", value: "Stable because equal heads choose B first; requires linear extra memory" }
  ]
};
