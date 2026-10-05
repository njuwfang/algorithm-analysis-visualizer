import { parseArray } from "../../core/utils.js";
import { describePartitionState, renderPartition, traceLomutoPartition } from "./lomuto-partition.js?v=20261004-1";

export function parseQuickselectInput(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2) throw new Error("Use array values | k, for example 4, 1, 10, 8, 7, 12, 9, 2, 15 | 5.");
  const values = parseArray(parts[0], { min: 1, max: 10 });
  const rank = parts[1].trim();
  const k = Number(rank);
  if (!rank || !Number.isInteger(k) || k < 1 || k > values.length) {
    throw new Error(`The rank k must be a whole number from 1 to ${values.length}.`);
  }
  return { values, k };
}

function initialOrder(values) {
  if (values.length === 1) return "singleton";
  if (values.every((value) => value === values[0])) return "all equal";
  if (values.every((value, index) => index === 0 || value > values[index - 1])) return "strictly increasing";
  if (values.every((value, index) => index === 0 || value < values[index - 1])) return "strictly decreasing";
  return "mixed order or repeated keys";
}

export function buildQuickselectTrace(input) {
  let values = [...input.values];
  const inputOrder = initialOrder(values);
  const k = input.k;
  const targetIndex = k - 1;
  let l = 0;
  let r = values.length - 1;
  let comparisons = 0;
  let partitionNumber = 0;
  const completedPartitionSizes = [];
  const trace = [];

  while (l <= r) {
    const call = {
      values: [...values], l, r, m: null, p: null, i: null,
      processedThrough: l - 1, partitioned: false,
      comparisons, partitionComparisons: 0, partitionNumber,
      comparisonResult: null, swapIndices: [],
      k, targetIndex, inputOrder, retainedL: l, retainedR: r,
      completedPartitionSizes: [...completedPartitionSizes],
      result: null, resultIndex: null, rankDecision: "not evaluated"
    };
    trace.push({
      ...call, phase: "call", activeLine: 1,
      message: `Quickselect A[${l}..${r}], global rank k = ${k}; target absolute index ${targetIndex}.`
    });

    if (l === r) {
      trace.push({
        ...call, phase: "singleton", activeLine: 2,
        result: values[l], resultIndex: l,
        rankDecision: "one candidate remains",
        message: `One candidate remains: return A[${l}] = ${values[l]} for rank ${k}; no pivot comparisons are needed.`
      });
      break;
    }

    trace.push({
      ...call, phase: "partition-call", activeLine: 3,
      message: `Partition A[${l}..${r}] around its first element; reveal each pivot comparison.`
    });
    partitionNumber += 1;
    const partition = traceLomutoPartition(values, l, r, {
      comparisons, partitionNumber,
      lines: { start: 10, scan: 11, compare: 12, smaller: 13, pivot: 14, returned: 15 }
    });
    for (const step of partition.trace) {
      if (step.phase === "partition-return") completedPartitionSizes.push(r - l + 1);
      trace.push({
        ...call, ...step,
        completedPartitionSizes: [...completedPartitionSizes]
      });
    }
    values = partition.values;
    comparisons = partition.comparisons;
    const m = partition.pivotIndex;
    const ranked = { ...trace.at(-1), swapIndices: [] };
    const equal = m === targetIndex;
    trace.push({
      ...ranked, phase: "rank-match", activeLine: 4,
      result: equal ? values[m] : null, resultIndex: equal ? m : null,
      retainedL: equal ? m : l, retainedR: equal ? m : r,
      rankDecision: `${m} = ${k} − 1 = ${targetIndex} is ${equal ? "true" : "false"}`,
      message: equal
        ? `m = ${m} equals k − 1 = ${targetIndex}; return A[${m}] = ${values[m]}, the ${k}th smallest value.`
        : `m = ${m} does not equal k − 1 = ${targetIndex}; choose one side of the partition.`
    });
    if (equal) break;

    const goLeft = m > targetIndex;
    trace.push({
      ...ranked, phase: "rank-side", activeLine: 5,
      rankDecision: `${m} > ${targetIndex} is ${goLeft ? "true; choose left" : "false; choose right"}`,
      message: `Test m > k − 1: ${m} > ${targetIndex} is ${goLeft ? "true; search the left part" : "false; search the right part"}.`
    });
    const nextL = goLeft ? l : m + 1;
    const nextR = goLeft ? m - 1 : r;
    trace.push({
      ...ranked, phase: goLeft ? "recurse-left" : "recurse-right", activeLine: goLeft ? 6 : 7,
      retainedL: nextL, retainedR: nextR,
      rankDecision: `retain A[${nextL}..${nextR}]; global k stays ${k}`,
      message: `Recurse into A[${nextL}..${nextR}]; discard the other candidates. Keep global k = ${k} and target index ${targetIndex}.`
    });
    l = nextL;
    r = nextR;
  }

  const last = trace.at(-1);
  trace.push({
    ...last, phase: "complete", activeLine: null, activeLabel: "Generalize",
    message: `Selection complete: rank ${k} is ${last.result}, found with ${comparisons} key comparisons across ${completedPartitionSizes.length} partitions.`
  });
  return trace;
}

function indexedRegion(step, start, end) {
  return start > end ? "none" : step.values.slice(start, end + 1)
    .map((value, offset) => `A[${start + offset}] = ${value}`).join("; ");
}

export function candidateSizes(step) {
  const sizes = [step.values.length, ...step.completedPartitionSizes, step.retainedR - step.retainedL + 1];
  return sizes.filter((size, index) => index === 0 || size !== sizes[index - 1]);
}

function renderCandidateSizes(step) {
  const sizes = candidateSizes(step);
  return `<div class="selection-progress"><span>Candidates</span><div class="selection-size-path ${sizes.length > 5 ? "is-long" : ""}">${sizes.map((size, index) =>
    `${index ? '<span class="selection-size-arrow" aria-hidden="true">→</span>' : ""}<span class="selection-size ${index === sizes.length - 1 ? "is-current" : ""}" style="--candidate-fraction:${size / step.values.length}"><b>${size}</b></span>`
  ).join("")}</div></div>`;
}

function describeQuickselect(step) {
  const discarded = [
    indexedRegion(step, 0, step.retainedL - 1),
    indexedRegion(step, step.retainedR + 1, step.values.length - 1)
  ].filter((value) => value !== "none").join("; ") || "none";
  return {
    summary: step.message,
    state: [
      { label: "Target rank", value: `global k = ${step.k}; absolute target index k − 1 = ${step.targetIndex}` },
      { label: "Initial order", value: step.inputOrder },
      ...describePartitionState(step),
      { label: "Retained candidates", value: indexedRegion(step, step.retainedL, step.retainedR) },
      { label: "Discarded positions", value: discarded },
      { label: "Rank decision", value: step.rankDecision },
      { label: "Completed partition sizes", value: step.completedPartitionSizes.length ? step.completedPartitionSizes.join(", ") : "none" },
      { label: "Candidate-size progression", value: candidateSizes(step).join(" → ") },
      { label: "Returned value", value: step.result === null ? "none" : `A[${step.resultIndex}] = ${step.result}, rank ${step.k}` }
    ],
    details: ["Candidate-size bars share the original array size as their scale; a shorter bar represents fewer retained candidates."]
  };
}

export const quickselectModule = {
  id: "quickselect",
  shortTitle: "Quickselect",
  title: "Quickselect",
  summary: "Reveal Lomuto's comparisons, retain one partition, and select the kth smallest value.",
  complexity: "Best Θ(n); worst Θ(n²)",
  source: { slides: "96–97, 104–137" },
  objective: "Trace the pivot comparisons and explain which subarray retains the target rank.",
  input: {
    label: "Array A | rank k",
    hint: "Enter 1–10 finite numbers | k. Convention: k is a global 1-based rank; absolute indices start at 0, so the target stays k − 1 in every call.",
    default: "4, 1, 10, 8, 7, 12, 9, 2, 15 | 5",
    presets: [
      { label: "Lecture: k = 5", value: "4, 1, 10, 8, 7, 12, 9, 2, 15 | 5" },
      { label: "First pivot is target", value: "4, 1, 10, 8, 7, 12, 9, 2, 15 | 3" },
      { label: "Increasing: largest", value: "1, 2, 4, 7, 8, 9, 10, 12, 15 | 9" },
      { label: "Decreasing: middle", value: "15, 12, 10, 9, 8, 7, 4, 2, 1 | 5" },
      { label: "Decreasing: largest", value: "15, 12, 10, 9, 8, 7, 4, 2, 1 | 9" },
      { label: "Equal keys", value: "4, 4, 4, 4 | 3" },
      { label: "Singleton", value: "4 | 1" }
    ],
    parse: parseQuickselectInput
  },
  pseudocode: [
    { line: 1, text: "Algorithm Quickselect(A[l..r], k)" },
    { line: 2, text: "if l = r return A[l]  // singleton convention", indent: 1 },
    { line: 3, text: "m ← LomutoPartition(A[l..r])", indent: 1 },
    { line: 4, text: "if m = k − 1 return A[m]", indent: 1 },
    { line: 5, text: "else if m > k − 1", indent: 1 },
    { line: 6, text: "return Quickselect(A[l..m − 1], k)", indent: 2 },
    { line: 7, text: "else return Quickselect(A[m + 1..r], k)", indent: 1 },
    { line: 8, text: "// Convention: global k stays fixed; indices are absolute" },
    { line: 9, text: "Algorithm LomutoPartition(A[l..r])" },
    { line: 10, text: "p ← A[l]; m ← l", indent: 1 },
    { line: 11, text: "for i ← l + 1 to r do", indent: 1 },
    { line: 12, text: "if A[i] < p", indent: 2, basic: true },
    { line: 13, text: "m ← m + 1; swap(A[m], A[i])", indent: 3 },
    { line: 14, text: "swap(A[l], A[m])", indent: 1 },
    { line: 15, text: "return m", indent: 1 }
  ],
  buildTrace: buildQuickselectTrace,
  render(step) {
    return renderPartition(step, { selection: true, progression: renderCandidateSizes(step) });
  },
  describe: describeQuickselect,
  metrics(step) { return [{ label: "Key comparisons", value: step.comparisons, emphasis: true }]; },
  model(step) {
    if (step.phase !== "complete") return {
      latex: `C_{\\text{seen}}=${step.comparisons}`,
      notes: ["Count only comparisons A[i] < p inside LomutoPartition; index tests and swaps are excluded."]
    };
    const counts = step.completedPartitionSizes.map((size) => size - 1);
    const split = Math.ceil(counts.length / 2);
    const total = counts.length > 5
      ? `${counts.slice(0, split).join("+")}\\\\&\\quad+${counts.slice(split).join("+")}`
      : counts.join("+") || "0";
    const decreasing = step.inputOrder === "strictly decreasing";
    return {
      latex: `\\begin{aligned}C_{\\text{trace}}&=${total}${counts.length ? `=${step.comparisons}` : ""}\\\\C_b(n)&=n-1\\in\\Theta(n)\\\\C_w(n)&=\\sum_{j=1}^{n-1}j=\\frac{n(n-1)}{2}\\in\\Theta(n^2)\\end{aligned}`,
      notes: [
        decreasing && step.k === step.values.length
          ? "Decreasing order, largest rank: the largest value is the first pivot, so this input finishes in one partition with n − 1 comparisons."
          : "Best case: the first partition places the pivot at the target index, using n − 1 key comparisons.",
        decreasing && step.k === Math.ceil(step.values.length / 2)
          ? "Decreasing order, middle rank: pivots alternate between the largest and smallest remaining key. Each retained part loses one element, so this input realizes the full worst-case sum."
          : "Worst case: the retained part has one fewer element each time; the increasing input selecting the largest value realizes this case.",
        "The singleton base case uses zero comparisons; the array is partitioned only as far as selection requires."
      ]
    };
  },
  analysis: [
    { term: "Input size", value: "n is the full array size; a partition of s candidates makes s − 1 key comparisons" },
    { term: "Basic operation", value: "Only the strict pivot comparison A[i] < p; rank tests, loop checks, and swaps are excluded" },
    { term: "Pivot rule", value: "First element of each active subarray; equal keys remain in the ≥ p part" },
    { term: "Rank convention", value: "Slide 105 mixes an absolute m with an adjusted local k. This trace follows the worked diagrams: keep global one-based k, compare absolute m to k − 1, and retain k on the right" },
    { term: "Base case", value: "A singleton returns its only value without partitioning; this explicit guard completes the slide pseudocode" },
    { term: "Best case", value: "The first pivot is the desired order statistic: n − 1 comparisons, Θ(n)" },
    { term: "Worst case", value: "Successive retained sizes n−1, n−2, …, 1 give n(n−1)/2 comparisons, Θ(n²)" },
    { term: "Decreasing order", value: "The largest value is the first pivot, so rank n finishes after one partition. For middle rank ⌈n/2⌉, the largest and smallest remaining pivots alternate; each retained part loses one element, realizing the quadratic worst case." }
  ]
};
