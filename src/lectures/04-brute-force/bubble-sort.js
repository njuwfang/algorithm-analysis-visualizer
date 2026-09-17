import { escapeHtml, formatNumber, parseArray } from "../../core/utils.js?v=20260916-1";

export function buildBubbleSortTrace(input) {
  const values = [...input];
  const trace = [{
    activeLine: 1,
    phase: "initial",
    values: [...values],
    passIndex: null,
    pair: [],
    completedPasses: 0,
    comparisons: 0,
    swaps: 0,
    message: "Begin with no elements fixed in the sorted suffix."
  }];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i <= values.length - 2; i += 1) {
    for (let j = 0; j <= values.length - 2 - i; j += 1) {
      const leftValue = values[j];
      const rightValue = values[j + 1];
      const outOfOrder = leftValue > rightValue;
      comparisons += 1;

      trace.push({
        activeLine: 3,
        phase: "compare",
        values: [...values],
        passIndex: i,
        pair: [j, j + 1],
        completedPasses: i,
        comparisons,
        swaps,
        outOfOrder,
        message: `Compare A[${j}] = ${formatNumber(leftValue)} with A[${j + 1}] = ${formatNumber(rightValue)}: ${outOfOrder ? "out of order" : "in order"}.`
      });

      if (outOfOrder) {
        [values[j], values[j + 1]] = [values[j + 1], values[j]];
        swaps += 1;
        trace.push({
          activeLine: 4,
          phase: "swap",
          values: [...values],
          passIndex: i,
          pair: [j, j + 1],
          completedPasses: i,
          comparisons,
          swaps,
          message: `Swap the adjacent elements; ${formatNumber(leftValue)} moves right and ${formatNumber(rightValue)} moves left.`
        });
      }
    }

    const fixedIndex = values.length - 1 - i;
    trace.push({
      activeLine: 1,
      activeLabel: `Pass ${i + 1} complete`,
      phase: "pass",
      values: [...values],
      passIndex: i,
      pair: [],
      fixedIndex,
      completedPasses: i + 1,
      comparisons,
      swaps,
      message: `Pass ${i + 1} fixes ${formatNumber(values[fixedIndex])} at A[${fixedIndex}].`
    });
  }

  trace.push({
    activeLine: null,
    activeLabel: "Generalize",
    phase: "complete",
    values: [...values],
    passIndex: values.length - 2,
    pair: [],
    completedPasses: values.length - 1,
    comparisons,
    swaps,
    message: `The array is sorted after ${comparisons} key comparisons and ${swaps} swaps.`
  });

  return trace;
}

function renderBubbleSort(step) {
  const activeIndices = new Set(step.pair);
  const fixedFrom = step.phase === "complete"
    ? 0
    : step.values.length - step.completedPasses;

  const items = step.values.map((value, index) => {
    const classes = ["sort-item"];
    if (index >= fixedFrom) classes.push("is-sorted");
    if (step.phase === "compare" && activeIndices.has(index)) classes.push("is-compared");
    if (step.phase === "compare" && index === step.pair[1]) classes.push("is-current");
    if (step.phase === "swap" && activeIndices.has(index)) classes.push("is-swapping");
    if (step.phase === "pass" && index === step.fixedIndex) classes.push("is-current");
    if (step.phase === "complete") classes.push("is-complete");

    const active = activeIndices.has(index) || (step.phase === "pass" && index === step.fixedIndex);
    const roles = [];
    if (index >= fixedFrom) roles.push("sorted suffix");
    if (activeIndices.has(index)) roles.push(step.phase === "swap" ? "swap position" : "compared element");
    if (step.phase === "pass" && index === step.fixedIndex) roles.push("newly fixed element");
    const suffix = roles.length ? `, ${roles.join(", ")}` : "";

    return `
      <li class="${classes.join(" ")}"${active ? ' data-active-visual="true"' : ""}
          aria-label="A index ${index}, value ${escapeHtml(formatNumber(value))}${escapeHtml(suffix)}">
        <span class="sort-item-value">${escapeHtml(formatNumber(value))}</span>
        <small class="sort-item-index">A[${index}]</small>
      </li>`;
  }).join("");

  let relation = "No sorted suffix yet.";
  if (step.phase === "compare") {
    const [left, right] = step.pair;
    relation = `A[${left}] > A[${right}] is ${step.outOfOrder ? "true" : "false"}.`;
  } else if (step.phase === "swap") {
    const [left, right] = step.pair;
    relation = `A[${left}] and A[${right}] have exchanged positions.`;
  } else if (step.phase === "pass") {
    relation = `A[${step.fixedIndex}] joins the sorted suffix.`;
  } else if (step.phase === "complete") {
    relation = "Every position is now in nondecreasing order.";
  }

  const passText = step.passIndex === null
    ? "Ready for pass 1"
    : step.phase === "complete"
      ? `${step.values.length - 1} passes complete`
      : `Pass ${step.passIndex + 1} of ${step.values.length - 1}`;

  return `
    <section class="sort-visual" aria-label="Bubble sort trace">
      <header class="sort-header">
        <span class="sort-context">${passText}</span>
        <span class="sort-chip">comparisons = ${step.comparisons}</span>
      </header>
      <ol class="sort-array" aria-label="Array A">${items}</ol>
      <p class="sort-relation">${escapeHtml(relation)}</p>
      <ul class="sort-legend" aria-label="Visualization key">
        <li class="sort-legend-item is-sorted">sorted suffix</li>
        <li class="sort-legend-item is-compared">compared pair</li>
        <li class="sort-legend-item is-current">current action</li>
      </ul>
    </section>`;
}

function describeBubbleSort(step) {
  const pass = step.phase === "initial"
    ? `Not started; ${step.values.length - 1} passes will run`
    : step.phase === "complete"
      ? `Complete; ${step.values.length - 1} passes finished`
      : `${step.passIndex + 1} of ${step.values.length - 1}`;
  const fixedFrom = step.phase === "complete"
    ? 0
    : step.values.length - step.completedPasses;
  const sortedSuffix = fixedFrom >= step.values.length
    ? "None"
    : `A[${fixedFrom}] through A[${step.values.length - 1}]`;
  const activePair = step.pair.length === 2
    ? `A[${step.pair[0]}] = ${formatNumber(step.values[step.pair[0]])} and A[${step.pair[1]}] = ${formatNumber(step.values[step.pair[1]])}`
    : "none";
  const comparisonResult = step.phase === "compare"
    ? `A[${step.pair[0]}] > A[${step.pair[1]}] is ${step.outOfOrder ? "true" : "false"}`
    : step.phase === "swap"
      ? "out of order; swap performed"
      : "not evaluated at this step";
  const swapThisStep = step.phase === "swap"
    ? `A[${step.pair[0]}] and A[${step.pair[1]}] exchanged positions`
    : "none";
  const newlyFixed = step.phase === "pass"
    ? `A[${step.fixedIndex}] = ${formatNumber(step.values[step.fixedIndex])}`
    : "none";

  return {
    summary: step.message,
    state: [
      {
        label: "Array A",
        value: step.values.map((value, index) => `A[${index}] = ${formatNumber(value)}`).join("; ")
      },
      { label: "Pass", value: pass },
      { label: "Sorted suffix", value: sortedSuffix },
      { label: "Active pair", value: activePair },
      { label: "Comparison result", value: comparisonResult },
      { label: "Swap this step", value: swapThisStep },
      { label: "Newly fixed position", value: newlyFixed },
      {
        label: "Order status",
        value: step.phase === "complete" ? "Every position is in nondecreasing order" : "Sorting in progress"
      },
      { label: "Key comparisons", value: String(step.comparisons) },
      { label: "Swaps", value: String(step.swaps) }
    ]
  };
}

export const bubbleSortModule = {
  id: "bubble-sort",
  shortTitle: "Bubble Sort",
  title: "Bubble Sort",
  summary: "Compare adjacent keys, move the largest remaining key to the end of each pass, and count every comparison.",
  complexity: "Θ(n²)",
  source: { slides: "25–40" },
  tags: ["brute-force", "sorting", "nested-loops"],
  objective: "Explain why swaps depend on input order while the lecture algorithm's comparison count does not.",
  input: {
    label: "Array A",
    hint: "Enter 2–10 numbers separated by commas or spaces.",
    default: "89, 45, 68, 90, 29, 34, 17",
    presets: [
      { label: "Lecture example", value: "89, 45, 68, 90, 29, 34, 17" }
    ],
    parse: (raw) => parseArray(raw, { min: 2, max: 10 })
  },
  pseudocode: [
    { line: 1, text: "for i ← 0 to n − 2 do" },
    { line: 2, text: "for j ← 0 to n − 2 − i do", indent: 1 },
    { line: 3, text: "if A[j] > A[j + 1]", indent: 2, basic: true },
    { line: 4, text: "swap A[j] and A[j + 1]", indent: 3 }
  ],
  buildTrace: buildBubbleSortTrace,
  render: renderBubbleSort,
  describe: describeBubbleSort,
  metrics(step) {
    return [
      { label: "Key comparisons", value: step.comparisons, emphasis: true },
      { label: "Swaps", value: step.swaps }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, the number of elements in A" },
    { term: "Basic operation", value: "The adjacent-key comparison A[j] > A[j + 1]" },
    { term: "Case behavior", value: "The comparison count is fixed; the swap count depends on the arrangement" },
    { term: "Worst-case swaps", value: "The slide identifies the maximum swap count as Θ(n²)" },
    { term: "Growth", value: "n(n − 1) / 2 ∈ Θ(n²) key comparisons" }
  ],
  model(step) {
    if (step.phase !== "complete") {
      return {
        latex: `C_{\\text{seen}} = ${step.comparisons}`,
        notes: ["This lecture version completes every pass; it has no early-exit test."]
      };
    }
    return {
      latex: "C(n) = \\sum_{i=0}^{n-2} \\sum_{j=0}^{n-2-i} 1 = \\frac{n(n-1)}{2} \\in \\Theta(n^2)",
      notes: ["Each pass compares one fewer adjacent pair, so the fixed comparison count is triangular."]
    };
  }
};
