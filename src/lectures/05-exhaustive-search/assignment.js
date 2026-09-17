import { formatNumber } from "../../core/utils.js?v=20260916-1";
import { factorial, permutations } from "./search-utils.js?v=20260916-1";

const MAX_SIZE = 4;

export function parseAssignmentMatrix(raw) {
  const rowStrings = String(raw).split(";").map((row) => row.trim()).filter(Boolean);
  if (rowStrings.length < 2 || rowStrings.length > MAX_SIZE) {
    throw new Error(`Enter a square matrix with 2–${MAX_SIZE} rows.`);
  }

  const matrix = rowStrings.map((row, rowIndex) => {
    const entries = row.split(/[\s,]+/).filter(Boolean);
    if (entries.length !== rowStrings.length) {
      throw new Error(`Row ${rowIndex + 1} must contain exactly ${rowStrings.length} costs.`);
    }
    const values = entries.map(Number);
    if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 1000)) {
      throw new Error(`Row ${rowIndex + 1} costs must be whole numbers from 0 to 1,000.`);
    }
    return values;
  });

  return matrix;
}

function assignmentCost(matrix, assignment) {
  return assignment.reduce((sum, job, person) => sum + matrix[person][job], 0);
}

export function buildAssignmentTrace(matrix) {
  const size = matrix.length;
  const candidates = permutations(Array.from({ length: size }, (_, index) => index));
  const sharedMatrix = matrix.map((row) => [...row]);
  const trace = [{
    matrix: sharedMatrix,
    phase: "initial",
    activeLine: 1,
    currentAssignment: null,
    currentCost: null,
    bestAssignment: null,
    bestCost: null,
    candidatesEvaluated: 0,
    totalCandidates: factorial(size),
    message: "Initialize the best assignment cost to infinity."
  }];

  let bestAssignment = null;
  let bestCost = Infinity;
  candidates.forEach((assignment, index) => {
    const cost = assignmentCost(matrix, assignment);
    const improves = cost < bestCost;
    if (improves) {
      bestAssignment = [...assignment];
      bestCost = cost;
    }
    trace.push({
      matrix: sharedMatrix,
      phase: "candidate",
      activeLine: 3,
      currentAssignment: [...assignment],
      currentCost: cost,
      bestAssignment: [...bestAssignment],
      bestCost,
      improves,
      candidatesEvaluated: index + 1,
      totalCandidates: factorial(size),
      message: `Assign jobs ⟨${assignment.map((job) => job + 1).join(", ")}⟩ for cost ${formatNumber(cost)}${improves ? "; retain it as the least-cost assignment" : "; it does not improve the current best"}.`
    });
  });

  trace.push({
    matrix: sharedMatrix,
    phase: "complete",
    activeLine: 4,
    currentAssignment: [...bestAssignment],
    currentCost: bestCost,
    bestAssignment: [...bestAssignment],
    bestCost,
    candidatesEvaluated: candidates.length,
    totalCandidates: factorial(size),
    message: `Return jobs ⟨${bestAssignment.map((job) => job + 1).join(", ")}⟩ with minimum cost ${formatNumber(bestCost)}.`
  });
  return trace;
}

function assignmentLabel(assignment) {
  return assignment ? `⟨${assignment.map((job) => job + 1).join(", ")}⟩` : "—";
}

function renderAssignment(step) {
  const size = step.matrix.length;
  const columnHeaders = Array.from(
    { length: size },
    (_, job) => `<th class="assignment-column-label" scope="col">Job ${job + 1}</th>`
  ).join("");
  const rows = [];
  for (let person = 0; person < size; person += 1) {
    const cells = [];
    for (let job = 0; job < size; job += 1) {
      const isCurrent = step.currentAssignment?.[person] === job;
      const isBest = step.bestAssignment?.[person] === job;
      const classes = [
        "assignment-cell",
        isCurrent ? "is-current" : "",
        isBest ? "is-best" : "",
        step.phase === "complete" && isBest ? "is-complete" : ""
      ].filter(Boolean).join(" ");
      const stateLabel = isCurrent ? ", selected by the current assignment" : isBest ? ", selected by the best assignment" : "";
      cells.push(`<td class="${classes}" aria-label="Person ${person + 1}, job ${job + 1}, cost ${formatNumber(step.matrix[person][job])}${stateLabel}" ${isCurrent && person === 0 ? 'data-active-visual="true"' : ""}>
        ${formatNumber(step.matrix[person][job])}
      </td>`);
    }
    rows.push(`<tr><th class="assignment-row-label" scope="row" aria-label="Person ${person + 1}">P${person + 1}</th>${cells.join("")}</tr>`);
  }

  const expression = step.currentAssignment
    ? step.currentAssignment.map((job, person) => step.matrix[person][job]).join(" + ")
    : "Choose one cost in each row and column";

  return `
    <div class="assignment-visual">
      <table class="assignment-matrix" style="--assignment-size:${size}" aria-label="Assignment cost matrix">
        <thead><tr><th class="assignment-corner" aria-hidden="true"></th>${columnHeaders}</tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
      <aside class="assignment-reading">
        <div class="assignment-current">
          <span>Current assignment</span>
          <strong>${assignmentLabel(step.currentAssignment)}</strong>
          <small>${expression}${step.currentCost === null ? "" : ` = ${formatNumber(step.currentCost)}`}</small>
        </div>
        <div class="assignment-best">
          <span>Best so far</span>
          <strong>${assignmentLabel(step.bestAssignment)}</strong>
          <small>cost ${step.bestCost === null ? "—" : formatNumber(step.bestCost)}</small>
        </div>
      </aside>
    </div>`;
}

function describeAssignment(step) {
  const progress = `${step.candidatesEvaluated} of ${step.totalCandidates} candidate assignments evaluated`;
  const matrix = step.matrix.map((row, person) => (
    `Person ${person + 1}: ${row.map((cost, job) => `job ${job + 1} costs ${formatNumber(cost)}`).join(", ")}`
  )).join("; ");
  const describeMapping = (assignment) => assignment.map((job, person) => (
    `Person ${person + 1} to job ${job + 1}, cost ${formatNumber(step.matrix[person][job])}`
  )).join("; ");
  const currentAssignment = step.currentAssignment;
  const bestAssignment = step.bestAssignment;
  const currentCosts = currentAssignment
    ? currentAssignment.map((job, person) => step.matrix[person][job])
    : [];
  const decision = step.phase === "initial"
    ? "Search not started"
    : step.phase === "complete"
      ? "Search complete; return the least-cost assignment"
      : step.improves
        ? "Retain as the new least-cost assignment"
        : "Keep the previous best assignment";

  return {
    summary: step.message,
    state: [
      { label: "Progress", value: progress },
      { label: "People and jobs", value: String(step.matrix.length) },
      { label: "Cost matrix", value: matrix },
      { label: "Assignment rule", value: "Each candidate gives every person one distinct job" },
      { label: "Current assignment", value: currentAssignment ? assignmentLabel(currentAssignment) : "None" },
      { label: "Current mapping", value: currentAssignment ? describeMapping(currentAssignment) : "None" },
      { label: "Current cost calculation", value: currentAssignment ? `${currentCosts.map(formatNumber).join(" + ")} = ${formatNumber(step.currentCost)}` : "Not evaluated" },
      { label: "Current cost", value: currentAssignment ? formatNumber(step.currentCost) : "Not evaluated" },
      { label: "Best assignment so far", value: bestAssignment ? assignmentLabel(bestAssignment) : "None" },
      { label: "Best mapping so far", value: bestAssignment ? describeMapping(bestAssignment) : "None" },
      { label: "Best cost so far", value: bestAssignment ? formatNumber(step.bestCost) : "Not evaluated" },
      { label: "Decision", value: decision }
    ]
  };
}

export const assignmentModule = {
  id: "assignment",
  shortTitle: "Assignment",
  title: "Assignment — Exhaustive Permutations",
  summary: "Try every one-to-one assignment of jobs to people and retain the permutation with least total cost.",
  complexity: "O(n!)",
  source: { slides: "22–26" },
  objective: "See why assigning every job exactly once creates n! candidate permutations.",
  input: {
    label: "Cost matrix rows",
    hint: "Separate rows with ; and costs with commas. Use a 2×2 to 4×4 square matrix.",
    default: "9,7,2,8; 6,4,3,7; 5,8,1,8; 7,6,9,4",
    presets: [
      { label: "Lecture matrix", value: "9,7,2,8; 6,4,3,7; 5,8,1,8; 7,6,9,4" }
    ],
    parse: parseAssignmentMatrix
  },
  codeTitle: "Exhaustive-search process",
  pseudocode: [
    { line: 1, text: "bestCost ← ∞" },
    { line: 2, text: "for each permutation p of the n jobs do" },
    {
      line: 3,
      latex: "\\mathit{cost} \\gets \\sum_{i=1}^{n} C[i,p[i]];\\; \\text{retain }p\\text{ if smaller}",
      spoken: "cost gets the sum from i equals 1 through n of C at row i and column p of i; retain p if the cost is smaller",
      indent: 1,
      basic: true,
      basicLabel: "candidate assignment"
    },
    { line: 4, text: "return the retained assignment" }
  ],
  buildTrace: buildAssignmentTrace,
  render: renderAssignment,
  describe: describeAssignment,
  metrics(step) {
    return [{ label: "Candidate assignments", value: step.candidatesEvaluated, emphasis: true }];
  },
  model(step) {
    if (step.phase !== "complete") {
      return {
        latex: `A_{\\text{checked}}=${step.candidatesEvaluated}`,
        notes: ["A permutation assigns one distinct job to each person."]
      };
    }
    return {
      latex: "N_{\\text{assignments}}(n)=n!\\in\\mathrm{O}(n!)",
      notes: ["There are n choices for the first person, then n − 1, continuing to one; the lecture reports factorial growth."]
    };
  },
  analysis: [
    { term: "Input size", value: "The number n of people and jobs" },
    { term: "Counted quantity", value: "Candidate one-to-one assignments evaluated" },
    { term: "Candidate form", value: "A permutation p where person i receives job p[i]" },
    { term: "Candidate count", value: "n · (n − 1) · … · 1 = n!" },
    { term: "Growth", value: "The lecture reports exhaustive assignment as O(n!)" }
  ]
};
