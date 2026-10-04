import { escapeHtml, parseArray } from "../../core/utils.js?v=20260916-1";
import { indexed } from "./trace-view.js";

const LECTURE_ARRAY = "3,14,27,31,39,42,55,70,74,81,85,93,98";
const MAX_VALUE = 1_000_000;

export function parseBinarySearchInput(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2) throw new Error("Enter a sorted array and one search key separated by |.");
  const array = parseArray(parts[0], { min: 1, max: 13 });
  if (array.some((value) => !Number.isInteger(value) || Math.abs(value) > MAX_VALUE)) {
    throw new Error("Array values must be integers from −1,000,000 to 1,000,000.");
  }
  if (array.some((value, index) => index > 0 && value < array[index - 1])) {
    throw new Error("The array must already be sorted in nondecreasing order.");
  }
  const keyText = parts[1].trim();
  const key = Number(keyText);
  if (!keyText || !Number.isInteger(key) || Math.abs(key) > MAX_VALUE) {
    throw new Error("The search key must be one integer from −1,000,000 to 1,000,000.");
  }
  return { array, key };
}

export function buildBinarySearchTrace({ array: inputArray, key }) {
  const array = [...inputArray];
  const trace = [];
  const probes = [];
  let l = 0;
  let r = array.length - 1;
  let m = null;
  let comparisons = 0;
  let comparison = null;
  let result = null;
  function emit(phase, activeLine, message) {
    trace.push({ array: [...array], key, l, r, m, comparisons, comparison, result,
      probes: probes.map((probe) => ({ ...probe })), phase, activeLine, message });
  }
  emit("initial", 1, `Set l = 0 and r = ${r}; search for K = ${key}.`);
  while (true) {
    emit("condition", 2, `Test l ≤ r: ${l} ≤ ${r} is ${l <= r ? "true" : "false"}.`);
    if (l > r) break;
    m = Math.floor((l + r) / 2);
    comparison = null;
    emit("midpoint", 3, `Set m = ⌊(${l} + ${r}) / 2⌋ = ${m}.`);
    comparison = key === array[m] ? "=" : key < array[m] ? "<" : ">";
    comparisons += 1;
    probes.push({ index: m, value: array[m], relation: comparison });
    emit("compare", 4, `One 3-way comparison: K = ${key} ${comparison} A[${m}] = ${array[m]}.`);
    if (comparison === "=") {
      result = m;
      emit("complete", 4, `The key matches A[${m}]; return index ${m}.`);
      return trace;
    }
    if (comparison === "<") {
      r = m - 1;
      emit("reduce", 5, `K < A[${m}]; set r = ${r} and retain the left half.`);
    } else {
      l = m + 1;
      emit("reduce", 6, `K > A[${m}]; set l = ${l} and retain the right half.`);
    }
  }
  result = -1;
  emit("complete", 7, "The candidate interval is empty; return −1.");
  return trace;
}

function remainingIndices(step) {
  return step.l <= step.r
    ? Array.from({ length: step.r - step.l + 1 }, (_, index) => index + step.l).join(", ")
    : "none";
}

function intervalSizes(step) {
  const sizes = [step.array.length];
  let l = 0;
  let r = step.array.length - 1;
  for (const [index, probe] of step.probes.entries()) {
    if (step.phase === "compare" && index === step.probes.length - 1) break;
    if (probe.relation === "=") break;
    if (probe.relation === "<") r = probe.index - 1;
    else l = probe.index + 1;
    sizes.push(Math.max(0, r - l + 1));
  }
  return sizes;
}

function renderBinarySearch(step) {
  const n = step.array.length;
  const hasCandidates = step.l <= step.r;
  const showMidpoint = ["midpoint", "compare"].includes(step.phase)
    || step.phase === "complete" && step.result >= 0;
  const focusIndex = showMidpoint ? step.m : step.phase === "reduce"
    ? step.activeLine === 5 ? step.r : step.l : null;
  const cellWidth = Math.max(36, ...step.array.map((value) => String(value).length * 9 + 12));
  const phoneCellWidth = Math.max(22, ...step.array.map((value) => String(value).length * 7.8 + 6));
  const cells = step.array.map((value, index) => {
    const discarded = index < step.l || index > step.r;
    const midpoint = showMidpoint && index === step.m;
    const found = step.result !== null && step.result >= 0 && index === step.result;
    const roles = [index === step.l && hasCandidates ? "l" : "", midpoint ? "m" : "",
      index === step.r && hasCandidates ? "r" : ""].filter(Boolean);
    const classes = ["binary-search-cell", discarded ? "is-discarded" : "",
      midpoint ? "is-midpoint" : "", midpoint && step.phase === "compare" ? "is-counted" : "",
      found ? "is-found" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}"${index === focusIndex ? " data-active-visual" : ""}>
      <span class="binary-search-pointer ${midpoint ? "is-midpoint" : ""}">${roles.length ? `${roles.length === 3 ? "<b>l,r</b><b>m</b>" : roles.join(",")}<i aria-hidden="true">↓</i>` : ""}</span>
      <span class="binary-search-index">${index}</span>
      <strong class="binary-search-value">${escapeHtml(value)}</strong>
    </div>`;
  }).join("");
  const discardedBand = (start, length) => length > 0
    ? `<span class="binary-search-band is-discarded" style="grid-column:${start + 1}/span ${length}">${length >= 3 ? "× discarded" : "×"}</span>` : "";
  const bands = hasCandidates
    ? `${discardedBand(0, step.l)}<span class="binary-search-band is-retained" style="grid-column:${step.l + 1}/span ${step.r - step.l + 1}"></span>${discardedBand(step.r + 1, n - step.r - 1)}`
    : discardedBand(0, n);
  const sizes = intervalSizes(step);
  return `<div class="decrease-layout binary-search-board">
    <div class="binary-search-caption"><strong>K = ${step.key}</strong><span>${hasCandidates ? `Candidate interval A[${step.l}..${step.r}]` : "Candidate interval empty"}</span></div>
    <div class="binary-search-scroll" data-visual-scroll>
      <div class="binary-search-strip ${hasCandidates && step.l === step.r && showMidpoint ? "has-shared-bounds" : ""}" style="--binary-items:${n};--binary-cell-width:${cellWidth}px;--binary-phone-cell-width:${phoneCellWidth}px">
        <div class="binary-search-array">${cells}</div>
        <div class="binary-search-bands">${bands}</div>
      </div>
    </div>
    <div class="binary-search-size-flow"><span>Interval sizes</span><ol>${sizes.map((size, index) => `<li class="${index === sizes.length - 1 ? "is-current" : ""}">${index ? '<span class="binary-search-size-arrow" aria-hidden="true">→</span>' : ""}<strong>${size}</strong></li>`).join("")}</ol></div>
  </div>`;
}

export const binarySearchModule = {
  id: "binary-search",
  shortTitle: "Binary search",
  title: "Binary Search",
  summary: "Probe the middle of the remaining sorted interval and count one 3-way key comparison per probe.",
  complexity: "Θ(log n) worst case",
  source: { slides: "69–80" },
  objective: "Connect the retained half-interval to the exact worst-case comparison count.",
  input: {
    label: "Sorted array A | search key K",
    hint: "Enter 1–13 sorted integers and a key, separated by |. Values may range from −1,000,000 to 1,000,000; m uses floor division.",
    default: `${LECTURE_ARRAY} | 70`,
    presets: [
      { label: "Lecture: K = 70", value: `${LECTURE_ARRAY} | 70` },
      { label: "First probe matches", value: `${LECTURE_ARRAY} | 55` },
      { label: "Missing key", value: `${LECTURE_ARRAY} | 71` },
      { label: "One element", value: "70 | 70" }
    ],
    parse: parseBinarySearchInput
  },
  pseudocode: [
    { line: 1, text: "l ← 0; r ← n − 1" },
    { line: 2, text: "while l ≤ r do" },
    { line: 3, text: "m ← ⌊(l + r) / 2⌋", indent: 1 },
    { line: 4, text: "if K = A[m] return m", indent: 1, basic: true, basicLabel: "3-way key comparison" },
    { line: 5, text: "else if K < A[m] r ← m − 1", indent: 1 },
    { line: 6, text: "else l ← m + 1", indent: 1 },
    { line: 7, text: "return −1" }
  ],
  buildTrace: buildBinarySearchTrace,
  render: renderBinarySearch,
  describe(step) {
    const excluded = step.array.map((_, index) => index).filter((index) => index < step.l || index > step.r);
    return {
      summary: step.message,
      state: [
        { label: "Array A", value: indexed(step.array) },
        { label: "Search key K", value: String(step.key) },
        { label: "Bounds", value: `l = ${step.l}; r = ${step.r}` },
        { label: "Candidate indices", value: remainingIndices(step) },
        { label: "Interval sizes", value: intervalSizes(step).join(" → ") },
        { label: "Midpoint m", value: step.m === null ? "not computed" : String(step.m) },
        { label: "Current comparison", value: step.phase === "compare" ? `K = ${step.key} with A[${step.m}] = ${step.array[step.m]}` : "none" },
        { label: "Comparison result", value: step.comparison === null ? "not evaluated" : `K ${step.comparison} A[${step.m}]` },
        { label: "Excluded indices", value: excluded.length ? excluded.join(", ") : "none" },
        { label: "Probe results", value: step.probes.length ? step.probes.map((probe) => `A[${probe.index}] = ${probe.value}: K ${probe.relation} A[${probe.index}]`).join("; ") : "none" },
        { label: "3-way key comparisons", value: String(step.comparisons) },
        { label: "Result", value: step.result === null ? "not returned" : step.result === -1 ? "−1: key not found" : `index ${step.result}, A[${step.result}] = ${step.key}` }
      ]
    };
  },
  metrics: (step) => [{ label: "3-way key comparisons", value: step.comparisons, emphasis: true }],
  model(step) {
    if (step.phase !== "complete") return {
      latex: `C_{\\text{trace}}=${step.comparisons},\\qquad n_{\\text{remaining}}=${Math.max(0, step.r - step.l + 1)}`,
      notes: ["The lecture counts one 3-way comparison with A[m] per probe, covering <, =, and > together."]
    };
    return {
      latex: "\\begin{gathered}C_w(n)=C_w(\\lfloor n/2\\rfloor)+1\\ (n>1),\\quad C_w(1)=1\\\\C_w(n)=\\lfloor\\log_2 n\\rfloor+1=\\lceil\\log_2(n+1)\\rceil\\in\\Theta(\\log n)\\end{gathered}",
      notes: ["n is the number of array elements; this trace used " + step.comparisons + " 3-way comparisons.", "The recurrence applies above the one-element base case; the midpoint is rounded down."]
    };
  },
  analysis: [
    { term: "Input size", value: "n, the number of sorted array elements" },
    { term: "Basic operation", value: "One 3-way comparison of K with A[m], as specified on slide 79" },
    { term: "Best case", value: "The first midpoint matches: one comparison" },
    { term: "Worst case", value: "Some successful searches and unsuccessful searches attain ⌊log₂ n⌋ + 1 comparisons; individual traces may be shorter" },
    { term: "Average case", value: "The lecture reports approximately log₂ n comparisons" },
    { term: "Indexing", value: "A[0..n−1], with m = ⌊(l+r)/2⌋; duplicates may return any matching index" }
  ]
};
