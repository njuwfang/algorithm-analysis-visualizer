import { escapeHtml, formatNumber, parseArray } from "../../core/utils.js?v=20260915-5";

export function buildMaxElementTrace(values) {
  const trace = [];
  let maxIndex = 0;
  let comparisons = 0;
  let updates = 0;

  trace.push({
    activeLine: 1,
    phase: "initial",
    values: [...values],
    currentIndex: null,
    maxIndex,
    processedThrough: 0,
    comparisons,
    updates,
    message: `Initialize max with A[0] = ${formatNumber(values[0])}.`
  });

  for (let i = 1; i < values.length; i += 1) {
    const priorMaxIndex = maxIndex;
    const comparisonResult = values[i] > values[priorMaxIndex];
    comparisons += 1;

    trace.push({
      activeLine: 3,
      phase: "compare",
      values: [...values],
      currentIndex: i,
      maxIndex: priorMaxIndex,
      processedThrough: comparisonResult ? i - 1 : i,
      comparisons,
      updates,
      comparisonResult,
      message: `Compare A[${i}] = ${formatNumber(values[i])} with max = ${formatNumber(values[priorMaxIndex])}: ${comparisonResult ? "true" : "false"}.`
    });

    if (comparisonResult) {
      maxIndex = i;
      updates += 1;
      trace.push({
        activeLine: 4,
        phase: "update",
        values: [...values],
        currentIndex: i,
        maxIndex,
        processedThrough: i,
        comparisons,
        updates,
        message: `Update max to A[${i}] = ${formatNumber(values[i])}.`
      });
    }
  }

  trace.push({
    activeLine: 5,
    phase: "complete",
    values: [...values],
    currentIndex: null,
    maxIndex,
    processedThrough: values.length - 1,
    comparisons,
    updates,
    result: values[maxIndex],
    message: `Return ${formatNumber(values[maxIndex])}, the largest element.`
  });

  return trace;
}

function renderMaximum(step) {
  const values = step.values;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum || 1;

  const bars = values.map((value, index) => {
    const height = 52 + ((value - minimum) / spread) * 105;
    const classes = ["array-item"];
    if (index <= step.processedThrough) classes.push("is-processed");
    if (index === step.maxIndex) classes.push("is-max");
    if (index === step.currentIndex) classes.push("is-current");
    if (step.phase === "complete" && index === step.maxIndex) classes.push("is-final");

    return `
      <div class="${classes.join(" ")}" style="--bar-height:${height}px" aria-label="A index ${index} equals ${escapeHtml(formatNumber(value))}">
        <span>${escapeHtml(formatNumber(value))}</span>
        <span class="array-index">A[${index}]</span>
      </div>`;
  }).join("");

  const comparison = step.phase === "compare"
    ? `<span class="annotation-pill"><strong>${escapeHtml(formatNumber(values[step.currentIndex]))}</strong> &gt; <strong>${escapeHtml(formatNumber(values[step.maxIndex]))}</strong> → ${step.comparisonResult ? "True" : "False"}</span>`
    : "";
  const maximumLegend = step.phase === "complete"
    ? "green = returned maximum"
    : "indigo = current maximum";

  return `
    <div class="viz-stack">
      <div class="viz-caption">
        <span>Processed prefix: A[0…${Math.max(0, step.processedThrough)}]</span>
        <span class="state-chip">max = ${escapeHtml(formatNumber(values[step.maxIndex]))}</span>
      </div>
      <div class="array-row">${bars}</div>
      <div class="array-label-row">
        ${comparison}
        <span class="annotation-pill">${maximumLegend}</span>
        <span class="annotation-pill">amber = current element</span>
      </div>
    </div>`;
}

export const maxElementModule = {
  id: "max-element",
  shortTitle: "Maximum",
  title: "Find the Maximum Element",
  summary: "Trace each comparison, separate comparisons from assignments, and connect the fixed count to Θ(n).",
  complexity: "Θ(n)",
  source: { slides: "2–3" },
  tags: ["nonrecursive", "linear", "array"],
  objective: "Determine whether input order changes the number of comparisons.",
  input: {
    label: "Array A",
    hint: "Enter 2–10 numbers separated by commas or spaces.",
    default: "4, 7, 2, 9, 5",
    presets: [
      { label: "Mixed", value: "4, 7, 2, 9, 5" },
      { label: "Descending", value: "9, 7, 5, 3, 1" },
      { label: "Ascending", value: "1, 3, 5, 7, 9" }
    ],
    parse: (raw) => parseArray(raw, { min: 2, max: 10 })
  },
  pseudocode: [
    { line: 1, text: "max ← A[0]" },
    { line: 2, text: "for i ← 1 to n − 1 do" },
    { line: 3, text: "if A[i] > max", indent: 1, basic: true },
    { line: 4, text: "max ← A[i]", indent: 2 },
    { line: 5, text: "return max" }
  ],
  buildTrace: buildMaxElementTrace,
  render: renderMaximum,
  metrics(step) {
    return [
      { label: "Comparisons", value: step.comparisons, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, the number of elements in A" },
    { term: "Basic operation", value: "The comparison A[i] > max" },
    { term: "Case behavior", value: "The comparison count is the same for every arrangement" },
    { term: "Count", value: "C(n) = Σ from i = 1 to n − 1 of 1 = n − 1" },
    { term: "Growth", value: "n − 1 ∈ Θ(n)" }
  ],
  model(step) {
    return {
      latex: "C(n) = \\sum_{i=1}^{n-1} 1 = n - 1 \\in \\Theta(n)",
      notes: [
        "Changing the element order can change max assignments, but not the comparison count."
      ]
    };
  }
};
