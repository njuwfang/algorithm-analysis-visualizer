import { escapeHtml, formatNumber, parseArray } from "../../core/utils.js?v=20260916-1";

export function buildSelectionSortTrace(input) {
  const values = [...input];
  const trace = [{
    activeLine: 1,
    phase: "initial",
    values: [...values],
    passIndex: null,
    scanIndex: null,
    minimumIndex: null,
    swapIndices: [],
    sortedThrough: -1,
    comparisons: 0,
    swaps: 0,
    message: "Begin with an empty sorted prefix."
  }];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i <= values.length - 2; i += 1) {
    let minimumIndex = i;

    trace.push({
      activeLine: 2,
      activeLabel: `Pass ${i + 1}`,
      phase: "pass",
      values: [...values],
      passIndex: i,
      scanIndex: null,
      minimumIndex,
      swapIndices: [],
      sortedThrough: i - 1,
      comparisons,
      swaps,
      message: `Start pass ${i + 1}; A[${i}] is the current minimum.`
    });

    for (let j = i + 1; j <= values.length - 1; j += 1) {
      const priorMinimumIndex = minimumIndex;
      const foundSmaller = values[j] < values[priorMinimumIndex];
      comparisons += 1;

      trace.push({
        activeLine: 4,
        phase: "compare",
        values: [...values],
        passIndex: i,
        scanIndex: j,
        minimumIndex: priorMinimumIndex,
        swapIndices: [],
        sortedThrough: i - 1,
        comparisons,
        swaps,
        foundSmaller,
        message: `Compare A[${j}] = ${formatNumber(values[j])} with A[${priorMinimumIndex}] = ${formatNumber(values[priorMinimumIndex])}: ${foundSmaller ? "smaller" : "not smaller"}.`
      });

      if (foundSmaller) {
        minimumIndex = j;
        trace.push({
          activeLine: 5,
          phase: "minimum",
          values: [...values],
          passIndex: i,
          scanIndex: j,
          minimumIndex,
          swapIndices: [],
          sortedThrough: i - 1,
          comparisons,
          swaps,
          message: `Update min to ${j}; the current minimum is ${formatNumber(values[j])}.`
        });
      }
    }

    const selectedFrom = minimumIndex;
    const selectedValue = values[selectedFrom];
    [values[i], values[selectedFrom]] = [values[selectedFrom], values[i]];
    swaps += 1;

    trace.push({
      activeLine: 6,
      activeLabel: `Pass ${i + 1} complete`,
      phase: "swap",
      values: [...values],
      passIndex: i,
      scanIndex: null,
      minimumIndex: null,
      selectedFrom,
      swapIndices: selectedFrom === i ? [i] : [i, selectedFrom],
      sortedThrough: i,
      comparisons,
      swaps,
      message: selectedFrom === i
        ? `Swap A[${i}] with itself; ${formatNumber(selectedValue)} is fixed in position ${i}.`
        : `Swap A[${i}] with A[${selectedFrom}]; ${formatNumber(selectedValue)} is fixed in position ${i}.`
    });
  }

  trace.push({
    activeLine: null,
    activeLabel: "Generalize",
    phase: "complete",
    values: [...values],
    passIndex: values.length - 2,
    scanIndex: null,
    minimumIndex: null,
    swapIndices: [],
    sortedThrough: values.length - 1,
    comparisons,
    swaps,
    message: `The array is sorted after ${comparisons} key comparisons and ${swaps} swap statements.`
  });

  return trace;
}

function renderSelectionSort(step) {
  const activeIndices = new Set();
  if (step.phase === "compare") {
    activeIndices.add(step.scanIndex);
    activeIndices.add(step.minimumIndex);
  } else if (step.phase === "minimum" || step.phase === "pass") {
    activeIndices.add(step.minimumIndex);
  } else if (step.phase === "swap") {
    step.swapIndices.forEach((index) => activeIndices.add(index));
  }

  const focusIndex = step.phase === "compare"
    ? step.scanIndex
    : step.phase === "swap"
      ? step.selectedFrom
      : step.minimumIndex;

  const items = step.values.map((value, index) => {
    const classes = ["sort-item"];
    if (index <= step.sortedThrough) classes.push("is-sorted");
    if (index === step.minimumIndex && step.phase !== "complete") classes.push("is-minimum");
    if (index === step.scanIndex) classes.push("is-current");
    if (step.phase === "compare" && activeIndices.has(index)) classes.push("is-compared");
    if (step.phase === "swap" && activeIndices.has(index)) classes.push("is-swapping");
    if (step.phase === "complete") classes.push("is-complete");

    const roles = [];
    if (index <= step.sortedThrough) roles.push("sorted prefix");
    if (index === step.minimumIndex && step.phase !== "complete") roles.push("current minimum");
    if (index === step.scanIndex) roles.push("scanned element");
    if (step.phase === "swap" && activeIndices.has(index)) roles.push("swap position");
    const suffix = roles.length ? `, ${roles.join(", ")}` : "";

    return `
      <li class="${classes.join(" ")}"${index === focusIndex ? ' data-active-visual="true" aria-current="step"' : ""}
          aria-label="A index ${index}, value ${escapeHtml(formatNumber(value))}${escapeHtml(suffix)}">
        <span class="sort-item-value">${escapeHtml(formatNumber(value))}</span>
        <small class="sort-item-index">A[${index}]</small>
      </li>`;
  }).join("");

  let relation = "The sorted prefix is empty.";
  if (step.phase === "pass") {
    relation = `Set min = ${step.minimumIndex}.`;
  } else if (step.phase === "compare") {
    relation = `A[${step.scanIndex}] < A[${step.minimumIndex}] is ${step.foundSmaller ? "true" : "false"}.`;
  } else if (step.phase === "minimum") {
    relation = `A[${step.minimumIndex}] is the new minimum.`;
  } else if (step.phase === "swap") {
    relation = step.selectedFrom === step.passIndex
      ? `A[${step.passIndex}] remains in place.`
      : `A[${step.passIndex}] and A[${step.selectedFrom}] have exchanged positions.`;
  } else if (step.phase === "complete") {
    relation = "Every position is now in nondecreasing order.";
  }

  const passText = step.passIndex === null
    ? "Ready for pass 1"
    : step.phase === "complete"
      ? `${step.values.length - 1} passes complete`
      : `Pass ${step.passIndex + 1} of ${step.values.length - 1}`;

  return `
    <section class="sort-visual" aria-label="Selection sort trace">
      <header class="sort-header">
        <span class="sort-context">${passText}</span>
        <span class="sort-chip">comparisons = ${step.comparisons}</span>
      </header>
      <ol class="sort-array" aria-label="Array A">${items}</ol>
      <p class="sort-relation">${escapeHtml(relation)}</p>
      <ul class="sort-legend" aria-label="Visualization key">
        <li class="sort-legend-item is-sorted">sorted prefix</li>
        <li class="sort-legend-item is-minimum">current minimum</li>
        <li class="sort-legend-item is-current">current action</li>
      </ul>
    </section>`;
}

export const selectionSortModule = {
  id: "selection-sort",
  shortTitle: "Selection Sort",
  title: "Selection Sort",
  summary: "Scan the remaining suffix for its minimum, place it next, and connect all key comparisons to a triangular count.",
  complexity: "Θ(n²)",
  source: { slides: "8–24" },
  tags: ["brute-force", "sorting", "nested-loops"],
  objective: "Explain why every arrangement performs the same number of key comparisons.",
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
    { line: 2, text: "min ← i", indent: 1 },
    { line: 3, text: "for j ← i + 1 to n − 1 do", indent: 1 },
    { line: 4, text: "if A[j] < A[min]", indent: 2, basic: true },
    { line: 5, text: "min ← j", indent: 3 },
    { line: 6, text: "swap A[i] and A[min]", indent: 1 }
  ],
  buildTrace: buildSelectionSortTrace,
  render: renderSelectionSort,
  metrics(step) {
    return [
      { label: "Key comparisons", value: step.comparisons, emphasis: true },
      { label: "Swap statements", value: step.swaps }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, the number of elements in A" },
    { term: "Basic operation", value: "The key comparison A[j] < A[min]" },
    { term: "Case behavior", value: "Every arrangement has the same comparison count" },
    { term: "Swap statements", value: "Exactly n − 1, including a swap with the same position" },
    { term: "Growth", value: "n(n − 1) / 2 ∈ Θ(n²) key comparisons" }
  ],
  model(step) {
    if (step.phase !== "complete") {
      return {
        latex: `C_{\\text{seen}} = ${step.comparisons}`,
        notes: ["Each execution of A[j] < A[min] adds one key comparison."]
      };
    }
    return {
      latex: "C(n) = \\sum_{i=0}^{n-2} \\sum_{j=i+1}^{n-1} 1 = \\frac{n(n-1)}{2} \\in \\Theta(n^2)",
      notes: ["The unsorted suffix becomes shorter by one element after every pass, forming a triangular sum."]
    };
  }
};
