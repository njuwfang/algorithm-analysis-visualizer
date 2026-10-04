import { escapeHtml, parseArray } from "../../core/utils.js?v=20260916-1";
import { relativeBarHeights } from "../../core/sort-bars.js?v=20261004-1";
import { indexed } from "./trace-view.js?v=20261004-1";

export function buildInsertionSortTrace(input) {
  const values = [...input];
  const trace = [];
  let comparisons = 0;
  let sortedThrough = -1;
  let i = null;
  let j = null;
  let held = null;
  let hole = null;
  const passCounts = [];

  function push(phase, activeLine, message, extra = {}) {
    trace.push({
      phase, activeLine, message, values: [...values], comparisons,
      sortedThrough, i, j, held, hole, passCounts: [...passCounts],
      comparisonResult: null, shift: [], ...extra
    });
  }

  push("initial", null, "Begin with an empty sorted prefix; the lecture's outer loop starts at i = 0.", { activeLabel: "Ready" });
  for (i = 0; i < values.length; i += 1) {
    j = null;
    held = null;
    hole = null;
    passCounts.push(0);
    held = values[i];
    hole = i;
    push("hold", 2, `Save v = A[${i}] = ${held} outside the array.`);
    j = i - 1;

    while (j > -1) {
      const comparisonResult = values[j] > held;
      comparisons += 1;
      passCounts[i] += 1;
      push("compare", 4, `Compare A[${j}] = ${values[j]} with v = ${held}: A[${j}] > v is ${comparisonResult ? "true" : "false"}.`, { comparisonResult });
      if (!comparisonResult) break;

      values[j + 1] = values[j];
      hole = j;
      push("shift", 5, `Copy A[${j}] into A[${j + 1}]; v = ${held} remains saved.`, { shift: [j, j + 1] });
      j -= 1;
    }
    values[j + 1] = held;
    const insertedAt = j + 1;
    hole = null;
    sortedThrough = i;
    push("insert", 7, `Write v = ${held} at A[${insertedAt}]; A[0..${i}] is sorted.${j === -1 ? " Reaching j = −1 adds no key comparison." : ""}`, { insertedAt });
  }
  i = null;
  j = null;
  held = null;
  hole = null;
  push("complete", null, `The array is sorted after ${comparisons} key comparisons.`, { activeLabel: "Generalize" });
  return trace;
}

function comparisonText(step) {
  if (step.phase === "compare") return `A[${step.j}] = ${step.values[step.j]} > v = ${step.held} is ${step.comparisonResult ? "true" : "false"}`;
  if (step.phase === "boundary") return "j > −1 is false; the key comparison is not evaluated";
  return "not evaluated at this step";
}

function describeInsertionSort(step) {
  return {
    summary: step.message,
    state: [
      { label: "Array A", value: indexed(step.values) },
      { label: "Outer index i", value: step.i === null ? "none" : String(step.i) },
      { label: "Scan index j", value: step.j === null ? "none" : String(step.j) },
      { label: "Held key v", value: step.held === null ? "none" : String(step.held) },
      { label: "Insertion position", value: step.hole === null ? "none pending" : `A[${step.hole}]; its displayed value is replaceable while v is saved` },
      { label: "Sorted prefix", value: step.sortedThrough < 0 ? "empty" : `A[0..${step.sortedThrough}] at the end of completed passes` },
      { label: "Current comparison", value: comparisonText(step) },
      { label: "Shift this step", value: step.shift.length ? `A[${step.shift[0]}] copied to A[${step.shift[1]}]` : "none" },
      { label: "Order status", value: step.phase === "complete" ? "Every position is in nondecreasing order" : "Sorting in progress; the held key may be temporarily absent from A" },
      { label: "Key comparisons", value: String(step.comparisons) }
    ]
  };
}

function renderInsertionSort(step) {
  const heights = relativeBarHeights(step.held === null ? step.values : [...step.values, step.held]);
  const n = step.values.length;
  const complete = step.phase === "complete";
  const bars = step.values.map((value, index) => {
    const classes = ["sort-item", "dc-insertion-bar"];
    if (index <= step.sortedThrough && index !== step.hole) classes.push("is-sorted");
    if (step.phase === "compare" && index === step.j) classes.push("is-compared");
    if (step.phase === "shift" && step.shift.includes(index)) classes.push("is-swapping");
    if (step.phase === "insert" && index === step.insertedAt) classes.push("is-current");
    if (index === step.hole) classes.push("is-hole");
    if (complete) classes.push("is-complete");
    const pointers = [index === step.i ? "i" : "", index === step.j ? "j" : ""].filter(Boolean).join(", ");
    return `<li class="${classes.join(" ")}" style="--sort-height:${heights[index]}%" aria-label="A[${index}] = ${escapeHtml(value)}${index === step.hole ? "; insertion slot, displayed value replaceable" : ""}">
      ${pointers ? `<span class="dc-sort-pointer">${pointers}</span>` : ""}
      <span class="sort-item-value">${escapeHtml(value)}</span><small class="sort-item-index">A[${index}]</small>
    </li>`;
  }).join("");
  let arrow = "";
  if (step.phase === "shift") {
    const from = (step.shift[0] + 0.5) * 100 / n;
    const to = (step.shift[1] + 0.5) * 100 / n;
    arrow = `<svg class="dc-copy-arrow" viewBox="0 0 100 20" preserveAspectRatio="none" aria-label="Copy from A[${step.shift[0]}] to A[${step.shift[1]}]"><path d="M ${from} 16 Q ${(from + to) / 2} -1 ${to} 16"/><path d="M ${to - 1.5} 10 L ${to} 16 L ${to + 1.5} 10"/></svg>`;
  }
  const prefix = Math.max(0, step.sortedThrough + 1);
  const relation = step.phase === "compare" ? `${step.values[step.j]} > ${step.held} is ${step.comparisonResult ? "true" : "false"}`
    : step.phase === "shift" ? `Copy A[${step.shift[0]}] → A[${step.shift[1]}]; v stays saved`
      : step.hole !== null ? `v → A[${step.hole}] when the scan stops${step.j === -1 ? "; j = −1" : ""}`
        : step.phase === "insert" ? `v placed at A[${step.insertedAt}]`
          : complete ? "Every key is in nondecreasing order" : "The sorted prefix begins empty";
  return `<div class="dc-sort-visual dc-insertion">
    <div class="dc-insertion-key-row"><span class="dc-held-key ${step.phase === "compare" ? "is-compared" : ""}">Saved v <strong>${step.held === null ? "—" : escapeHtml(step.held)}</strong></span><span class="dc-slot-key">Dashed bar = insertion slot</span></div>
    <div class="dc-insertion-stage">${arrow}<ol class="sort-array dc-insertion-array" aria-label="Array A with value-height bars">${bars}</ol></div>
    <div class="dc-prefix-track" role="group" style="--dc-items:${n}" aria-label="${prefix ? `Sorted prefix A[0..${step.sortedThrough}]` : "Empty sorted prefix"}">${prefix ? `<span style="grid-column:1 / span ${prefix}">sorted</span>` : `<span class="is-empty" style="grid-column:1 / -1">empty prefix</span>`}</div>
    <p class="dc-sort-relation ${step.phase === "compare" ? "is-counted" : ""}">${escapeHtml(relation)}</p>
  </div>`;
}

export const insertionSortModule = {
  id: "insertion-sort",
  shortTitle: "Insertion Sort",
  title: "Insertion Sort",
  summary: "Save the next key, shift larger keys right, and extend the sorted prefix by one position.",
  complexity: "Best Θ(n); average and worst Θ(n²)",
  source: { slides: "10–54, 67" },
  objective: "Distinguish evaluated key comparisons from the index guard and explain best and worst input orders.",
  input: {
    label: "Array A",
    hint: "Enter 2–10 numbers separated by commas or spaces. The lecture starts at i = 0; only evaluated A[j] > v comparisons are counted.",
    default: "6, 4, 1, 7, 3, 2, 5",
    presets: [
      { label: "Lecture drawing", value: "6, 4, 1, 7, 3, 2, 5" },
      { label: "Lecture caption", value: "6, 4, 1, 7, 2, 5, 3" },
      { label: "Already sorted", value: "1, 2, 3, 4, 5, 6, 7" },
      { label: "Decreasing", value: "7, 6, 5, 4, 3, 2, 1" }
    ],
    parse: (raw) => parseArray(raw, { min: 2, max: 10 })
  },
  pseudocode: [
    { line: 1, text: "for i ← 0 to n − 1 do" },
    { line: 2, text: "v ← A[i]", indent: 1 },
    { line: 3, text: "j ← i − 1", indent: 1 },
    { line: 4, text: "while j > −1 and A[j] > v do", indent: 1, basic: true, basicLabel: "key comparison A[j] > v" },
    { line: 5, text: "A[j + 1] ← A[j]", indent: 2 },
    { line: 6, text: "j ← j − 1", indent: 2 },
    { line: 7, text: "A[j + 1] ← v", indent: 1 }
  ],
  buildTrace: buildInsertionSortTrace,
  render: renderInsertionSort,
  describe: describeInsertionSort,
  metrics: (step) => [{ label: "Key comparisons", value: step.comparisons, emphasis: true }],
  analysis: [
    { term: "Input size", value: "n, the number of keys in A" },
    { term: "Basic operation", value: "An evaluated A[j] > v comparison; the j > −1 guard is excluded" },
    { term: "i = 0", value: "The first pass saves and replaces A[0] without a key comparison" },
    { term: "Best case", value: "Nondecreasing keys: one key comparison for each i = 1, …, n − 1" },
    { term: "Worst case", value: "Strictly decreasing keys: i comparisons in pass i" },
    { term: "Average case", value: "The lecture uses randomly ordered keys and the leading approximation n²/4 ∈ Θ(n²)" },
    { term: "Properties", value: "In-place and stable: equal keys are not shifted past the held key" }
  ],
  model(step) {
    if (step.phase !== "complete") return {
      latex: `C_{\\mathrm{seen}} = ${step.comparisons}`,
      notes: ["A key comparison adds one; reaching j = −1 adds none."]
    };
    return {
      latex: `\\begin{aligned}C(A)&=\\sum_{i=1}^{n-1}c_i=${step.comparisons}\\\\C_b(n)&=\\sum_{i=1}^{n-1}1=n-1\\in\\Theta(n)\\\\C_w(n)&=\\sum_{i=1}^{n-1}i=\\frac{n(n-1)}2\\in\\Theta(n^2)\\\\C_a(n)&\\approx\\frac{n^2}{4}\\in\\Theta(n^2)\\end{aligned}`,
      notes: [
        `Here cᵢ is the number of evaluated key comparisons in pass i: ${step.passCounts.slice(1).join(" + ")} = ${step.comparisons}.`,
        "The average expression is the lecture's leading approximation for randomly ordered keys."
      ]
    };
  }
};
