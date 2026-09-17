import { parsePositiveInteger } from "../../core/utils.js?v=20260916-1";

export function buildBinaryIterativeTrace(original) {
  const trace = [];
  const history = [];
  let current = original;
  let count = 1;
  let comparisons = 0;
  let bodyExecutions = 0;

  trace.push({
    activeLine: 1,
    phase: "initial",
    original,
    current,
    count,
    comparisons,
    bodyExecutions,
    history: [],
    message: "Initialize count to 1."
  });

  while (true) {
    comparisons += 1;
    const condition = current > 1;
    history.push({ check: comparisons, n: current, count, condition });

    trace.push({
      activeLine: 2,
      phase: "condition",
      original,
      current,
      count,
      comparisons,
      bodyExecutions,
      condition,
      history: history.map((row) => ({ ...row })),
      message: `Test n > 1: ${current} > 1 is ${condition ? "true" : "false"}.`
    });

    if (!condition) break;

    count += 1;
    bodyExecutions += 1;
    trace.push({
      activeLine: 3,
      phase: "increment",
      original,
      current,
      count,
      comparisons,
      bodyExecutions,
      history: history.map((row) => ({ ...row })),
      message: `Increment count to ${count}.`
    });

    const beforeDivision = current;
    current = Math.floor(current / 2);
    trace.push({
      activeLine: 4,
      phase: "divide",
      original,
      current,
      count,
      comparisons,
      bodyExecutions,
      beforeDivision,
      history: history.map((row) => ({ ...row })),
      message: `Replace n with ⌊${beforeDivision} / 2⌋ = ${current}.`
    });
  }

  trace.push({
    activeLine: 5,
    phase: "complete",
    original,
    current,
    count,
    comparisons,
    bodyExecutions,
    history: history.map((row) => ({ ...row })),
    result: count,
    message: `Return ${count} binary digits.`
  });

  return trace;
}

function renderBinaryIterative(step) {
  const rows = step.history.map((row, index) => {
    const isLast = index === step.history.length - 1;
    const classes = ["ladder-row"];
    if (isLast && step.phase !== "divide") classes.push("is-active");
    if (!row.condition) classes.push("is-false");
    return `
      <div class="${classes.join(" ")}">
        <span class="ladder-step">${row.check}</span>
        <span>n = ${row.n}</span>
        <span>count = ${row.count}</span>
        <span class="ladder-condition">${row.n} &gt; 1 → ${row.condition ? "True" : "False"}</span>
      </div>`;
  }).join("");

  const pending = step.history.length === 0
    ? `<div class="empty-state">The first condition check will appear here.</div>`
    : rows;

  const transition = step.phase === "divide"
    ? `<span class="annotation-pill"><strong>⌊${step.beforeDivision} / 2⌋ = ${step.current}</strong></span>`
    : "";

  return `
    <div class="binary-layout">
      <div class="viz-caption">
        <span>Repeated halving of the loop variable</span>
        <span class="state-chip">current n = ${step.current}</span>
      </div>
      <div class="binary-ladder">${pending}</div>
      ${transition ? `<div class="binary-summary">${transition}</div>` : ""}
    </div>`;
}

export const binaryIterativeModule = {
  id: "binary-iterative",
  shortTitle: "Binary · loop",
  title: "Number of Binary Digits — Iterative",
  summary: "Follow repeated halving and keep condition comparisons separate from loop-body repetitions.",
  complexity: "Θ(log n)",
  source: { slides: "8–9" },
  tags: ["nonrecursive", "logarithmic", "halving"],
  objective: "Explain how repeated halving controls the count and why the loop test executes once more than the body.",
  input: {
    label: "Positive decimal integer n",
    hint: "Enter an integer from 1 to 1,000,000,000. The trace uses integer division.",
    default: "16",
    presets: [
      { label: "Power of two", value: "16" },
      { label: "Not a power of two", value: "13" },
      { label: "Base input", value: "1" },
      { label: "Larger", value: "255" }
    ],
    parse: (raw) => parsePositiveInteger(raw)
  },
  pseudocode: [
    { line: 1, text: "count ← 1" },
    { line: 2, text: "while n > 1 do", basic: true },
    { line: 3, text: "count ← count + 1", indent: 1 },
    { line: 4, text: "n ← n / 2", indent: 1 },
    { line: 5, text: "return count" }
  ],
  buildTrace: buildBinaryIterativeTrace,
  render: renderBinaryIterative,
  describe(step) {
    const details = step.history.map((row) => (
      `Check ${row.check}: n = ${row.n}, count = ${row.count}; n > 1 is ${row.condition ? "true" : "false"}.`
    ));

    return {
      summary: step.message,
      state: [
        { label: "Original input", value: String(step.original) },
        { label: "Current n", value: String(step.current) },
        { label: "Digit count", value: String(step.count) },
        { label: "Condition checks", value: String(step.comparisons) },
        { label: "Loop repetitions", value: String(step.bodyExecutions) }
      ],
      ...(details.length ? { details } : {})
    };
  },
  metrics(step) {
    return [
      { label: "Condition checks", value: step.comparisons, emphasis: true },
      { label: "Loop repetitions", value: step.bodyExecutions }
    ];
  },
  analysis: [
    { term: "Input size", value: "The positive integer n" },
    { term: "Basic operation", value: "The comparison n > 1" },
    { term: "Case behavior", value: "For a fixed n, the execution path is determined" },
    { term: "Pattern", value: "n, n/2, n/4, n/8, …, 1" },
    { term: "Growth", value: "The number of halvings is logarithmic: Θ(log n)" }
  ],
  model(step) {
    return {
      latex: "n \\to \\frac{n}{2} \\to \\frac{n}{4} \\to \\cdots \\to 1 \\implies \\text{total checks} \\approx \\log_2 n",
      notes: [
        "The condition is checked once more after the final loop-body execution, so comparisons = repetitions + 1."
      ]
    };
  }
};
