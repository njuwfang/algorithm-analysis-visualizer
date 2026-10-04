import { escapeHtml, parseArray } from "../../core/utils.js";
import { indexed } from "./trace-view.js";

const DEFAULT_LINES = { start: 1, scan: 2, compare: 3, smaller: 4, pivot: 5, returned: 6 };

// Pure partition trace, shared with Quickselect so its comparisons stay visible.
export function traceLomutoPartition(input, l = 0, r = input.length - 1, options = {}) {
  const values = [...input];
  const lines = options.lines ?? DEFAULT_LINES;
  const p = values[l];
  let m = l;
  let comparisons = options.comparisons ?? 0;
  let partitionComparisons = 0;
  let processedThrough = l;
  const trace = [];
  const push = (phase, activeLine, message, extra = {}) => trace.push({
    phase, activeLine, message, values: [...values], l, r, m, p,
    i: null, processedThrough, partitioned: false,
    comparisons, partitionComparisons,
    partitionNumber: options.partitionNumber ?? 1,
    comparisonResult: null, swapIndices: [], ...extra
  });

  push("partition-start", lines.start,
    `Set p = A[${l}] = ${p} and m = ${l}; scan A[${l}..${r}].`);

  for (let i = l + 1; i <= r; i += 1) {
    push("scan", lines.scan, `Scan A[${i}] = ${values[i]}; the pivot is ${p}.`, { i });
    const smaller = values[i] < p;
    comparisons += 1;
    partitionComparisons += 1;
    // A false comparison places this element in the >= p segment immediately.
    if (!smaller) processedThrough = i;
    push("compare", lines.compare,
      `Compare A[${i}] = ${values[i]} < p = ${p}: ${smaller ? "true" : "false"}.`,
      { i, comparisonResult: smaller });

    if (smaller) {
      m += 1;
      [values[m], values[i]] = [values[i], values[m]];
      processedThrough = i;
      push("smaller-swap", lines.smaller,
        m === i
          ? `Increase m to ${m}; swap A[${m}] with itself to extend the < p segment.`
          : `Increase m to ${m}; swap A[${m}] and A[${i}] to extend the < p segment.`,
        { i, swapIndices: m === i ? [m] : [m, i] });
    }
  }

  [values[l], values[m]] = [values[m], values[l]];
  push("pivot-swap", lines.pivot,
    m === l
      ? `No unprocessed elements remain. Swap A[${l}] with itself; the pivot stays at m = ${m}.`
      : `No unprocessed elements remain. Swap A[${l}] and A[${m}]; the pivot is now at m = ${m}.`,
    { i: r + 1, partitioned: true, swapIndices: m === l ? [l] : [l, m] });
  push("partition-return", lines.returned,
    `Return m = ${m}; all keys to its left in this subarray are < ${p}, and all keys to its right are ≥ ${p}.`,
    { i: r + 1, partitioned: true });
  return { trace, values, pivotIndex: m, comparisons };
}

export function buildLomutoPartitionTrace(input) {
  const { trace } = traceLomutoPartition(input);
  const last = trace.at(-1);
  return [...trace, {
    ...last, phase: "complete", activeLine: null, activeLabel: "Generalize",
    message: `Partition complete: pivot ${last.p} is at index ${last.m} after ${last.comparisons} key comparisons.`
  }];
}

function segment(step, start, end) {
  if (start > end) return "none";
  return step.values.slice(start, end + 1)
    .map((value, offset) => `A[${start + offset}] = ${value}`).join("; ");
}

export function describePartitionState(step) {
  const started = step.p !== null;
  const pivotPosition = step.partitioned ? step.m : step.l;
  const lessStart = step.partitioned ? step.l : step.l + 1;
  const lessEnd = step.partitioned ? step.m - 1 : step.m;
  const greaterEnd = step.partitioned ? step.r : step.processedThrough;
  return [
    { label: "Array A", value: indexed(step.values) },
    { label: "Active subarray", value: `A[${step.l}..${step.r}], size ${step.r - step.l + 1}` },
    { label: "Pivot p", value: started ? `${step.p} at A[${pivotPosition}]` : "not assigned" },
    { label: "Boundary m", value: started ? `${step.m}${step.partitioned ? "; final pivot index" : "; last position before the ≥ p segment"}` : "not assigned" },
    { label: "Scan i", value: step.i === null ? "not started" : step.i > step.r ? "complete; no unprocessed elements" : `A[${step.i}] = ${step.values[step.i]}` },
    { label: "Less than p", value: started ? segment(step, lessStart, lessEnd) : "none" },
    { label: "Greater than or equal to p", value: started ? segment(step, step.m + 1, greaterEnd) : "none" },
    { label: "Unprocessed", value: !started ? step.resultIndex !== null && step.resultIndex !== undefined ? "none; singleton returned without partitioning" : segment(step, step.l, step.r) : step.partitioned ? "none" : segment(step, step.processedThrough + 1, step.r) },
    { label: "Comparison this step", value: step.phase === "compare" ? `A[${step.i}] = ${step.values[step.i]} < ${step.p} is ${step.comparisonResult ? "true" : "false"}` : "not evaluated" },
    { label: "Swap this step", value: step.swapIndices.length === 1 ? `A[${step.swapIndices[0]}] with itself` : step.swapIndices.length === 2 ? `A[${step.swapIndices[0]}] with A[${step.swapIndices[1]}]` : "none" },
    { label: "Partition status", value: !started ? step.resultIndex !== null && step.resultIndex !== undefined ? "skipped; singleton returned" : "not started" : step.partitioned ? "complete; pivot between the two segments" : "scan in progress; pivot remains at the left endpoint" },
    { label: "Key comparisons", value: String(step.comparisons) }
  ];
}

function regionBand(start, end, label, kind) {
  if (start > end) return "";
  return `<span class="partition-band is-${kind}" style="grid-column:${start + 1} / span ${end - start + 1}">${label}</span>`;
}

function renderSwapPath(step) {
  const width = step.values.length * 64;
  if (!step.swapIndices.length) return '<div class="partition-swap-space" aria-hidden="true"></div>';
  const x = (step.swapIndices[0] + 0.5) * 64;
  const self = step.swapIndices.length === 1;
  const otherX = self ? x : (step.swapIndices[1] + 0.5) * 64;
  const path = self
    ? `M ${x - 10} 29 C ${x - 31} 0, ${x + 31} 0, ${x + 10} 29`
    : `M ${x} 29 C ${x} 3, ${otherX} 3, ${otherX} 29`;
  return `<svg class="partition-swap-path" viewBox="0 0 ${width} 34" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id="partition-swap-tip" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" stroke-width="1.5"></path></marker></defs>
    <path class="partition-exchange-line" d="${path}" marker-start="url(#partition-swap-tip)" marker-end="url(#partition-swap-tip)"></path>
  </svg>`;
}

export function renderPartition(step, { selection = false, progression = "" } = {}) {
  const started = step.p !== null;
  const pivotPosition = step.partitioned ? step.m : step.l;
  const retainedL = step.retainedL ?? step.l;
  const retainedR = step.retainedR ?? step.r;
  const hasResult = step.resultIndex !== null && step.resultIndex !== undefined;
  const hasUnprocessed = !started ? !hasResult : !step.partitioned && step.processedThrough < step.r;
  const hasDiscarded = retainedL > 0 || retainedR < step.values.length - 1;
  const swapping = step.swapIndices.length > 0;
  const current = swapping ? step.swapIndices
    : ["complete", "recurse-left", "recurse-right"].includes(step.phase) ? []
    : step.i !== null && step.i <= step.r ? [step.i]
    : started ? [pivotPosition] : [step.l];
  const counted = step.phase === "compare" ? [step.i, pivotPosition] : [];
  const activeIndex = counted[0] ?? current[0] ?? (selection ? step.targetIndex : pivotPosition);
  const minimumCell = Math.max(32, ...step.values.map((value) => String(value).length * 8 + 12));
  const pointers = step.values.map((value, index) => {
    const labels = [];
    if (index === step.l) labels.push("l");
    if (started && index === step.m) labels.push("m");
    if (index === step.i) labels.push("i");
    if (index === step.r) labels.push("r");
    return `<span class="partition-pointer ${index === step.i ? "is-scan" : ""}">${labels.length ? `<b>${labels.join(",")}</b><span aria-hidden="true">↓</span>` : ""}</span>`;
  }).join("");
  const cells = step.values.map((value, index) => {
    const discarded = index < retainedL || index > retainedR;
    const isPivot = started && index === pivotPosition;
    const isResult = hasResult ? index === step.resultIndex : !selection && step.partitioned && isPivot;
    const classes = ["partition-cell", discarded ? "is-discarded" : "", isPivot ? "is-pivot" : "",
      current.includes(index) ? "is-current" : "", counted.includes(index) ? "is-counted" : "", isResult ? "is-result" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}" role="group"${index === activeIndex ? " data-active-visual" : ""} aria-label="${escapeHtml(`A[${index}] = ${value}${isPivot ? "; pivot p" : ""}${discarded ? "; discarded" : ""}${selection && index === step.targetIndex ? "; target index k − 1" : ""}`)}"><span class="partition-index">${index}</span><strong>${escapeHtml(value)}</strong></div>`;
  }).join("");
  const bands = !started
    ? hasResult ? "" : regionBand(step.l, step.r, "?", "unprocessed")
    : regionBand(step.partitioned ? step.l : step.l + 1, step.partitioned ? step.m - 1 : step.m, "&lt; p", "less")
      + regionBand(pivotPosition, pivotPosition, "p", "pivot")
      + regionBand(step.m + 1, step.partitioned ? step.r : step.processedThrough, "≥ p", "greater")
      + (step.partitioned ? "" : regionBand(step.processedThrough + 1, step.r, "?", "unprocessed"));
  const retained = selection ? `<div class="partition-retention partition-grid">
    ${regionBand(0, retainedL - 1, retainedL > 2 ? "discarded" : "×", "discarded")}
    ${regionBand(retainedL, retainedR, hasResult ? "kth" : retainedL === retainedR ? "keep" : "retain", hasResult ? "selected" : "retained")}
    ${regionBand(retainedR + 1, step.values.length - 1, step.values.length - retainedR > 3 ? "discarded" : "×", "discarded")}
  </div><div class="partition-target-rail partition-grid"><span class="partition-target" style="grid-column:${step.targetIndex + 1}"><span aria-hidden="true">▲</span><b>k−1</b></span></div>` : "";
  const context = selection && hasResult ? started ? "Last partition" : "Final candidate" : started ? "Partition" : "Candidates";
  return `<section class="partition-visual ${selection ? "is-selection" : ""}" aria-label="${selection ? "Quickselect partition and retained candidates" : "Lomuto partition segments"}">
    <div class="partition-context"><span>${context} A[${step.l}..${step.r}]</span>${started ? `<strong>p = ${escapeHtml(step.p)} <small>at ${pivotPosition}</small></strong>` : ""}${selection ? `<span class="partition-target-context">target ${step.targetIndex}</span>` : ""}</div>
    <div class="partition-board-scroll" data-visual-scroll><div class="partition-board" style="--partition-items:${step.values.length};--partition-cell-min:${minimumCell}px">
      ${renderSwapPath(step)}<div class="partition-pointer-rail partition-grid">${pointers}</div>
      <div class="partition-values partition-grid">${cells}</div>
      <div class="partition-regions partition-grid">${bands}</div>${retained}
    </div></div>
    <div class="partition-key">${hasUnprocessed ? "<span>? unprocessed</span>" : ""}${hasResult ? "<span>kth result</span>" : ""}${selection && hasDiscarded ? "<span>× discarded</span>" : ""}<span>${swapping ? step.swapIndices.length === 1 ? "↶ self-swap" : "↔ exchange" : step.i > step.r ? "scan complete" : ""}</span></div>
    ${progression}
  </section>`;
}

export const lomutoPartitionModule = {
  id: "lomuto-partition",
  shortTitle: "Lomuto Partitioning",
  title: "Lomuto Partitioning",
  summary: "Scan around the first-element pivot and track the < p, ≥ p, and unprocessed segments.",
  complexity: "Θ(n)",
  source: { slides: "98–103; worked array 106–123" },
  objective: "Trace the boundary m and explain the n − 1 pivot comparisons of one partition.",
  input: {
    label: "Array A",
    hint: "Enter 1–10 finite numbers. The first element is the pivot; indices start at 0. Equal values stay in the ≥ p segment.",
    default: "4, 1, 10, 8, 7, 12, 9, 2, 15",
    presets: [
      { label: "Lecture example", value: "4, 1, 10, 8, 7, 12, 9, 2, 15" },
      { label: "Equal keys", value: "4, 4, 4, 4" },
      { label: "Singleton", value: "4" }
    ],
    parse: (raw) => parseArray(raw, { min: 1, max: 10 })
  },
  pseudocode: [
    { line: 1, text: "p ← A[l]; m ← l" },
    { line: 2, text: "for i ← l + 1 to r do" },
    { line: 3, text: "if A[i] < p", indent: 1, basic: true },
    { line: 4, text: "m ← m + 1; swap(A[m], A[i])", indent: 2 },
    { line: 5, text: "swap(A[l], A[m])" },
    { line: 6, text: "return m" }
  ],
  buildTrace: buildLomutoPartitionTrace,
  render: renderPartition,
  describe(step) { return { summary: step.message, state: describePartitionState(step) }; },
  metrics(step) { return [{ label: "Key comparisons", value: step.comparisons, emphasis: true }]; },
  model(step) {
    return step.phase === "complete" ? {
      latex: "C(n)=\\sum_{i=1}^{n-1}1=n-1\\in\\Theta(n)",
      notes: ["Each element after the first-element pivot is compared with p exactly once; swapping and loop checks are excluded."]
    } : {
      latex: `C_{\\text{seen}}=${step.comparisons}`,
      notes: ["Only A[i] < p adds a key comparison."]
    };
  },
  analysis: [
    { term: "Input size", value: "n = r − l + 1, the number of elements in the active subarray" },
    { term: "Basic operation", value: "A[i] < p, a strict key comparison with the first-element pivot" },
    { term: "Segments", value: "Before final swap: pivot at l, < p in l+1..m, ≥ p in m+1..processedThrough, then unprocessed keys" },
    { term: "Final state", value: "Pivot at m, < p in l..m−1, and ≥ p in m+1..r; neither part must be sorted" },
    { term: "Conventions", value: "Zero-based absolute indices; execute every swap statement, including self-swaps; a singleton has zero comparisons" },
    { term: "Count", value: "Exactly n − 1 key comparisons in every case; Θ(n)" }
  ]
};
