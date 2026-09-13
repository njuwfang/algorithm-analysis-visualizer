// This template is copied into src/lectures/NN-topic/.
import { escapeHtml, parseArray } from "../../core/utils.js";

export function buildExampleTrace(values) {
  const trace = [];

  trace.push({
    activeLine: 1,
    values: [...values],
    operations: 0,
    message: "Describe the initial state."
  });

  // Add one trace state per meaningful algorithm event.
  // Increment the counter exactly where the lecture's basic operation occurs.

  trace.push({
    activeLine: null,
    activeLabel: "Complete",
    values: [...values],
    operations: 0,
    message: "State the returned result and exact operation count."
  });

  return trace;
}

function renderExample(step) {
  return `
    <div class="viz-stack">
      <div class="viz-caption">
        <span>Replace with a meaningful state description</span>
        <span class="state-chip">operations = ${step.operations}</span>
      </div>
      <div class="empty-state">${escapeHtml(step.message)}</div>
    </div>`;
}

export const exampleModule = {
  id: "example-algorithm",
  shortTitle: "Example",
  title: "Example Algorithm",
  summary: "One sentence explaining what the visualization reveals.",
  complexity: "Θ(?)",
  source: { slides: "1–2" },
  tags: ["replace-me"],
  objective: "A measurable learning target for this module.",
  input: {
    label: "Array A",
    hint: "Describe valid input and a classroom-friendly size.",
    default: "4, 2, 7, 1",
    presets: [
      { label: "Typical", value: "4, 2, 7, 1" },
      { label: "Best case", value: "1, 2, 4, 7" },
      { label: "Worst case", value: "7, 4, 2, 1" }
    ],
    parse: (raw) => parseArray(raw, { min: 2, max: 10 })
  },
  pseudocode: [
    { line: 1, text: "replace with lecture pseudocode" },
    { line: 2, text: "mark the counted operation", indent: 1, basic: true }
  ],
  buildTrace: buildExampleTrace,
  render: renderExample,
  metrics(step) {
    return [
      { label: "Basic operations", value: step.operations, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "Define the parameter" },
    { term: "Basic operation", value: "Name the counted event" },
    { term: "Case behavior", value: "Explain whether inputs of the same size differ" },
    { term: "Model", value: "Write the sum or recurrence" },
    { term: "Growth", value: "State the asymptotic class" }
  ],
  model(step) {
    return {
      latex: "T(n) = \\text{replace} \\in \\Theta(?)",
      notes: [
        "Explain how the trace corresponds to the mathematical model."
      ]
    };
  }
};
