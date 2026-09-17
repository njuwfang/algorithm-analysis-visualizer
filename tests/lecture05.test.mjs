import test from "node:test";
import assert from "node:assert/strict";
import { factorial, permutations, subsets } from "../src/lectures/05-exhaustive-search/search-utils.js";
import {
  buildTravelingSalesmanTrace,
  parseTravelingSalesmanInput,
  travelingSalesmanModule
} from "../src/lectures/05-exhaustive-search/traveling-salesman.js";
import {
  buildKnapsackTrace,
  knapsackModule,
  parseKnapsackInput
} from "../src/lectures/05-exhaustive-search/knapsack.js";
import {
  assignmentModule,
  buildAssignmentTrace,
  parseAssignmentMatrix
} from "../src/lectures/05-exhaustive-search/assignment.js";

function describedValue(description, label) {
  return description.state.find((item) => item.label === label)?.value;
}

test("exhaustive-search helpers are deterministic and do not mutate input", () => {
  const values = [1, 2, 3];
  assert.deepEqual(permutations(values), [
    [1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]
  ]);
  assert.deepEqual(subsets(values), [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]);
  assert.deepEqual(values, [1, 2, 3]);
  assert.equal(factorial(0), 1);
  assert.equal(factorial(4), 24);
});

test("Traveling Salesman evaluates the three canonical lecture tours", () => {
  const input = parseTravelingSalesmanInput("2, 5, 7, 8, 3, 1");
  const trace = buildTravelingSalesmanTrace(input);
  const candidates = trace.filter((step) => step.phase === "candidate");
  const final = trace.at(-1);

  assert.equal(trace.length, 5);
  assert.deepEqual(candidates.map((step) => step.currentCandidate.cost), [18, 11, 23]);
  assert.deepEqual(final.best.tour, ["a", "b", "d", "c", "a"]);
  assert.equal(final.best.cost, 11);
  assert.equal(final.evaluatedCount, 3);
  assert.doesNotMatch(travelingSalesmanModule.model(candidates[0]).latex, /\\mathrm\{O\}/);
  assert.match(travelingSalesmanModule.model(final).latex, /\\mathrm\{O\}\(n!\)/);
  assert.match(travelingSalesmanModule.render(candidates[0]), /data-active-visual/);
});

test("Traveling Salesman rejects missing or invalid edge weights", () => {
  assert.throws(() => parseTravelingSalesmanInput("1, 2, 3"), /six edge weights/);
  assert.throws(() => parseTravelingSalesmanInput("1, 2, 3, 4, 5, 0"), /positive finite/);
});

test("Traveling Salesman describes routes and costs without the graph", () => {
  const trace = buildTravelingSalesmanTrace(parseTravelingSalesmanInput("2, 5, 7, 8, 3, 1"));
  const candidate = travelingSalesmanModule.describe(trace[2]);
  const complete = travelingSalesmanModule.describe(trace.at(-1));

  assert.equal(describedValue(candidate, "Progress"), "2 of 3 candidate tours evaluated");
  assert.equal(describedValue(candidate, "Current tour"), "a → b → d → c → a");
  assert.equal(describedValue(candidate, "Current cost"), "11");
  assert.equal(describedValue(candidate, "Best cost so far"), "11");
  assert.match(describedValue(candidate, "Current edge costs"), /a to b costs 2/);
  assert.equal(describedValue(complete, "Best tour so far"), "a → b → d → c → a");
  assert.match(describedValue(complete, "Decision"), /Search complete/);
});

test("Knapsack includes the empty subset and follows the lecture table grouping", () => {
  const input = parseKnapsackInput("16 | 2:20, 5:30, 10:50, 5:10");
  const trace = buildKnapsackTrace(input);
  const candidates = trace.filter((step) => step.phase === "candidate");
  const final = trace.at(-1);

  assert.equal(trace.length, 18);
  assert.equal(candidates.length, 16);
  assert.deepEqual(candidates.slice(0, 5).map((step) => step.currentSubset), [[], [0], [1], [2], [3]]);
  assert.deepEqual(final.bestSubset, [1, 2]);
  assert.equal(final.bestWeight, 15);
  assert.equal(final.bestValue, 80);
  assert.equal(final.candidatesEvaluated, 16);
  assert.match(knapsackModule.model(final).latex, /N_\{\\text\{subsets\}\}\(n\)=2\^n/);
  assert.doesNotMatch(knapsackModule.model(trace[0]).latex, /Omega|\\Omega/);
});

test("Knapsack gives explicit format and capacity errors", () => {
  assert.throws(() => parseKnapsackInput("16 2:20"), /separated by \|/);
  assert.throws(() => parseKnapsackInput("0 | 2:20"), /Capacity/);
  assert.throws(() => parseKnapsackInput("16 | 2-20"), /weight:value/);
});

test("Knapsack describes feasibility, totals, and the retained subset", () => {
  const trace = buildKnapsackTrace(parseKnapsackInput("16 | 2:20, 5:30, 10:50, 5:10"));
  const overweightStep = trace.find((step) => step.phase === "candidate" && !step.feasible);
  const candidate = knapsackModule.describe(overweightStep);
  const complete = knapsackModule.describe(trace.at(-1));

  assert.equal(describedValue(candidate, "Feasibility"), "Over capacity");
  assert.match(describedValue(candidate, "Current weight"), /of capacity 16$/);
  assert.match(describedValue(candidate, "Decision"), /Disqualify/);
  assert.match(describedValue(candidate, "Available items"), /Item 1: weight 2, value 20/);
  assert.equal(describedValue(complete, "Best subset so far"), "{2, 3}");
  assert.equal(describedValue(complete, "Current value"), "80");
  assert.equal(describedValue(complete, "Progress"), "16 of 16 candidate subsets evaluated");
});

test("Assignment exhausts all 24 permutations and finds the true lecture-matrix optimum", () => {
  const matrix = parseAssignmentMatrix("9,7,2,8; 6,4,3,7; 5,8,1,8; 7,6,9,4");
  const trace = buildAssignmentTrace(matrix);
  const candidates = trace.filter((step) => step.phase === "candidate");
  const final = trace.at(-1);

  assert.equal(trace.length, 26);
  assert.equal(candidates.length, 24);
  assert.deepEqual(final.bestAssignment, [2, 1, 0, 3]);
  assert.equal(final.bestCost, 15);
  assert.equal(final.candidatesEvaluated, 24);
  assert.ok(candidates.every((step) => !step.message.includes("remains cheaper")));
  assert.match(assignmentModule.model(final).latex, /N_\{\\text\{assignments\}\}\(n\)=n!/);
  assert.match(assignmentModule.render(candidates[0]), /<table class="assignment-matrix"/);
  assert.match(assignmentModule.render(candidates[0]), /scope="col"/);
  assert.match(assignmentModule.render(candidates[0]), /Person 1, job 1, cost 9/);
});

test("Assignment validates square matrices", () => {
  assert.throws(() => parseAssignmentMatrix("1,2,3"), /2–4 rows/);
  assert.throws(() => parseAssignmentMatrix("1,2; 3,4,5"), /exactly 2 costs/);
  assert.throws(() => parseAssignmentMatrix("1,x; 3,4"), /whole numbers/);
});

test("Assignment describes each mapping, matrix cost, and search progress", () => {
  const trace = buildAssignmentTrace(parseAssignmentMatrix("9,7,2,8; 6,4,3,7; 5,8,1,8; 7,6,9,4"));
  const candidate = assignmentModule.describe(trace[1]);
  const complete = assignmentModule.describe(trace.at(-1));

  assert.equal(describedValue(candidate, "Progress"), "1 of 24 candidate assignments evaluated");
  assert.match(describedValue(candidate, "Current mapping"), /Person 1 to job 1, cost 9/);
  assert.equal(describedValue(candidate, "Assignment rule"), "Each candidate gives every person one distinct job");
  assert.match(describedValue(candidate, "Current cost calculation"), /9 \+ 4 \+ 1 \+ 4 = 18/);
  assert.equal(describedValue(complete, "Best assignment so far"), "⟨3, 2, 1, 4⟩");
  assert.equal(describedValue(complete, "Best cost so far"), "15");
  assert.match(describedValue(complete, "Cost matrix"), /Person 4:/);
});
