import { escapeHtml, formatNumber, parseArray } from "../../core/utils.js?v=20260915-5";

export function buildUniqueElementTrace(values) {
  const trace = [];
  const visitedPairs = [];
  let comparisons = 0;

  trace.push({
    activeLine: 1,
    phase: "initial",
    values: [...values],
    currentPair: null,
    visitedPairs: [],
    comparisons,
    result: null,
    message: "Begin with the first possible pair of positions."
  });

  for (let i = 0; i <= values.length - 2; i += 1) {
    for (let j = i + 1; j <= values.length - 1; j += 1) {
      const equal = values[i] === values[j];
      comparisons += 1;
      visitedPairs.push({ i, j, equal });

      trace.push({
        activeLine: 3,
        phase: "compare",
        values: [...values],
        currentPair: [i, j],
        visitedPairs: visitedPairs.map((pair) => ({ ...pair })),
        comparisons,
        equal,
        result: null,
        message: `Compare A[${i}] = ${formatNumber(values[i])} with A[${j}] = ${formatNumber(values[j])}: ${equal ? "equal" : "different"}.`
      });

      if (equal) {
        trace.push({
          activeLine: 3,
          phase: "complete",
          values: [...values],
          currentPair: [i, j],
          visitedPairs: visitedPairs.map((pair) => ({ ...pair })),
          comparisons,
          equal,
          result: false,
          message: "Return False because two equal elements were found."
        });
        return trace;
      }
    }
  }

  trace.push({
    activeLine: 4,
    phase: "complete",
    values: [...values],
    currentPair: null,
    visitedPairs: visitedPairs.map((pair) => ({ ...pair })),
    comparisons,
    result: true,
    message: "Return True after examining every possible pair."
  });

  return trace;
}

function renderUnique(step) {
  const values = step.values;
  const n = values.length;
  const currentPair = step.currentPair || [];
  const visitedMap = new Map(step.visitedPairs.map((pair) => [`${pair.i}-${pair.j}`, pair]));

  const arrayHtml = values.map((value, index) => {
    const classes = ["compact-array-item"];
    if (currentPair.includes(index)) classes.push("is-current");
    if (step.equal && currentPair.includes(index)) classes.push("is-duplicate");
    return `
      <div class="${classes.join(" ")}">
        <small>A[${index}]</small>
        ${escapeHtml(formatNumber(value))}
      </div>`;
  }).join("");

  let matrixHtml = `<div class="matrix-label"></div>`;
  for (let column = 0; column < n; column += 1) {
    matrixHtml += `<div class="matrix-label">${column}</div>`;
  }
  for (let row = 0; row < n; row += 1) {
    matrixHtml += `<div class="matrix-label">${row}</div>`;
    for (let column = 0; column < n; column += 1) {
      const key = `${row}-${column}`;
      const pair = visitedMap.get(key);
      const classes = ["matrix-cell"];
      let label = "";
      if (column <= row) {
        classes.push("is-unused");
      } else {
        label = `${row},${column}`;
        if (pair) classes.push("is-visited");
        if (currentPair[0] === row && currentPair[1] === column) classes.push("is-current");
        if (pair?.equal) classes.push("is-duplicate");
      }
      matrixHtml += `<div class="${classes.join(" ")}" aria-label="pair ${row}, ${column}">${label}</div>`;
    }
  }

  const resultBanner = step.result === null
    ? ""
    : `<div class="result-banner ${step.result ? "is-true" : "is-false"}">Return ${step.result ? "True — all elements are distinct" : "False — duplicate found"}</div>`;

  const pairText = step.currentPair
    ? `Current pair: A[${step.currentPair[0]}] and A[${step.currentPair[1]}]`
    : "Pair-comparison matrix";

  return `
    <div class="unique-layout">
      <div>
        <div class="viz-caption"><span>${pairText}</span></div>
        <div class="compact-array">${arrayHtml}</div>
        ${resultBanner}
      </div>
      <div class="matrix-wrapper">
        <div class="viz-caption">
          <span>Rows are i; columns are j</span>
        </div>
        <div class="pair-matrix" style="--matrix-size:${n}">${matrixHtml}</div>
      </div>
    </div>`;
}

export const uniqueElementModule = {
  id: "unique-element",
  shortTitle: "Uniqueness",
  title: "Element Uniqueness",
  summary: "Watch the nested loops enumerate pairs and see how duplicate positions determine early termination or the worst case.",
  complexity: "Θ(n²) worst case",
  source: { slides: "5–7" },
  tags: ["nonrecursive", "quadratic", "nested-loops"],
  objective: "Connect the pairs visited by the nested loops to a worst-case comparison count.",
  input: {
    label: "Array A",
    hint: "Enter 2–9 numbers. Equal numeric values count as duplicates.",
    default: "5, 8, 11, 14",
    presets: [
      { label: "Distinct", value: "5, 8, 11, 14" },
      { label: "Early duplicate", value: "5, 5, 8, 11" },
      { label: "Middle duplicate", value: "5, 8, 5, 11" },
      { label: "Last pair equal", value: "5, 8, 11, 11" }
    ],
    parse: (raw) => parseArray(raw, { min: 2, max: 9 })
  },
  pseudocode: [
    { line: 1, text: "for i ← 0 to n − 2 do" },
    { line: 2, text: "for j ← i + 1 to n − 1 do", indent: 1 },
    { line: 3, text: "if A[i] = A[j] return False", indent: 2, basic: true },
    { line: 4, text: "return True" }
  ],
  buildTrace: buildUniqueElementTrace,
  render: renderUnique,
  metrics(step) {
    return [
      { label: "Comparisons", value: step.comparisons, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, the number of elements in the array" },
    { term: "Basic operation", value: "The equality comparison in the innermost loop" },
    { term: "Case behavior", value: "Depends on whether equal elements exist and where they occur" },
    { term: "Worst case", value: "No equal elements, or only the final compared pair is equal" },
    { term: "Growth", value: "n(n − 1) / 2 ∈ Θ(n²)" }
  ],
  model(step) {
    return {
      latex: "C_{\\text{worst}}(n) = (n-1) + \\cdots + 1 = \\frac{n(n-1)}{2} \\in \\Theta(n^2)",
      notes: [
        "The triangular pair matrix is the visual form of the nested summation."
      ]
    };
  }
};
