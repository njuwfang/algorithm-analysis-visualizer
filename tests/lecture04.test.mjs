import test from "node:test";
import assert from "node:assert/strict";
import { deriveTraceChanges } from "../src/core/trace-delta.js";
import { buildSelectionSortTrace, selectionSortModule } from "../src/lectures/04-brute-force/selection-sort.js";
import { buildBubbleSortTrace, bubbleSortModule } from "../src/lectures/04-brute-force/bubble-sort.js";
import {
  buildStringMatchingTrace,
  parseStringMatchingInput,
  stringMatchingModule
} from "../src/lectures/04-brute-force/string-matching.js";
import { buildClosestPairTrace, closestPairModule, parsePoints } from "../src/lectures/04-brute-force/closest-pair.js";

const lectureArray = [89, 45, 68, 90, 29, 34, 17];

test("Selection Sort reproduces the lecture trace and triangular comparison count", () => {
  const trace = buildSelectionSortTrace(lectureArray);
  const final = trace.at(-1);

  assert.equal(trace.length, 44);
  assert.equal(trace.filter((step) => step.phase === "compare").length, 21);
  assert.equal(trace.filter((step) => step.phase === "swap").length, 6);
  assert.equal(final.comparisons, 21);
  assert.equal(final.swaps, 6);
  assert.deepEqual(final.values, [17, 29, 34, 45, 68, 89, 90]);
  assert.doesNotMatch(selectionSortModule.model(trace[0]).latex, /Theta|\\Theta/);
  assert.match(selectionSortModule.model(final).latex, /\\Theta\(n\^2\)/);
});

test("Bubble Sort keeps the lecture's complete passes without an early exit", () => {
  const trace = buildBubbleSortTrace(lectureArray);
  const final = trace.at(-1);
  const ascending = buildBubbleSortTrace([1, 2, 3, 4]).at(-1);

  assert.equal(trace.length, 45);
  assert.equal(trace.filter((step) => step.phase === "compare").length, 21);
  assert.equal(trace.filter((step) => step.phase === "swap").length, 16);
  assert.equal(final.comparisons, 21);
  assert.equal(final.swaps, 16);
  assert.deepEqual(final.values, [17, 29, 34, 45, 68, 89, 90]);
  assert.equal(ascending.comparisons, 6);
  assert.equal(ascending.swaps, 0);
  assert.doesNotMatch(bubbleSortModule.model(trace[0]).latex, /Theta|\\Theta/);
  assert.match(bubbleSortModule.model(final).latex, /\\Theta\(n\^2\)/);
});

test("Brute-force string matching finds NOT at the lecture's zero-based position", () => {
  const input = parseStringMatchingInput("NOBODY_NOTICED_HIM | NOT");
  const trace = buildStringMatchingTrace(input);
  const comparisons = trace.filter((step) => step.phase === "compare");
  const advances = trace.filter((step) => step.phase === "advance");
  const final = trace.at(-1);

  assert.equal(trace.length, 27);
  assert.equal(comparisons.length, 12);
  assert.equal(advances.length, 5);
  assert.equal(final.comparisons, 12);
  assert.equal(final.found, 7);
  assert.ok(comparisons.every((step) => step.activeLine === 3));
  assert.ok(advances.every((step) => step.activeLine === 4));
  assert.deepEqual(
    stringMatchingModule.pseudocode.map(({ line, indent = 0 }) => [line, indent]),
    [[1, 0], [2, 1], [3, 1], [4, 2], [5, 1], [6, 0]]
  );
  assert.match(stringMatchingModule.render(comparisons[0]), /data-active-visual/);

  const absent = buildStringMatchingTrace(parseStringMatchingInput("ABC | Z")).at(-1);
  assert.equal(absent.found, -1);
  assert.equal(absent.comparisons, 3);
});

test("String-matching input errors state the missing precondition", () => {
  assert.throws(() => parseStringMatchingInput("TEXT"), /separated by \|/);
  assert.throws(() => parseStringMatchingInput("TEXT |"), /pattern cannot be empty/);
  assert.throws(() => parseStringMatchingInput("AB | ABC"), /cannot be longer/);
  assert.throws(() => parseStringMatchingInput("CAFÉ | F"), /ASCII/);
});

test("Closest Pair visits every unordered pair and counts two coordinate terms", () => {
  const points = parsePoints("1,1; 5,1; 2,4; 6,5; 4,3");
  const trace = buildClosestPairTrace(points);
  const pairStates = trace.filter((step) => step.phase === "pair");
  const final = trace.at(-1);

  assert.equal(trace.length, 12);
  assert.equal(pairStates.length, 10);
  assert.equal(final.pairsChecked, 10);
  assert.equal(final.coordinateTerms, 20);
  assert.equal(final.bestSquared, 5);
  assert.deepEqual(final.bestPair, [1, 4]);
  assert.match(closestPairModule.model(final).latex, /n\(n-1\).*\\Theta\(n\^2\)/);
  assert.doesNotMatch(closestPairModule.model(trace[0]).latex, /\\Theta/);
});

test("Closest Pair validates coordinate shape and bounds", () => {
  assert.throws(() => parsePoints("1,2"), /between 2 and 8 points/);
  assert.throws(() => parsePoints("1,2; 3"), /form x,y/);
  assert.throws(() => parsePoints("1,2; x,4"), /valid numbers/);
  assert.throws(() => parsePoints("1,2; 101,4"), /between −100 and 100/);
  const vertical = buildClosestPairTrace(parsePoints("2,1; 2,4; 2,9"));
  assert.doesNotMatch(closestPairModule.render(vertical[1]), /NaN|Infinity/);
});

function assertDescription(description) {
  assert.equal(typeof description.summary, "string");
  assert.ok(description.summary.length > 0);
  assert.ok(Array.isArray(description.state));
  assert.ok(description.state.length > 0);
  assert.ok(description.state.every(({ label, value }) => (
    typeof label === "string" && label.length > 0 && typeof value === "string" && value.length > 0
  )));
  assert.ok(description.details === undefined || (
    Array.isArray(description.details)
    && description.details.every((detail) => typeof detail === "string" && detail.length > 0)
  ));
}

test("Lecture 04 sorting descriptions expose indexed state without relying on color", () => {
  for (const [module, trace] of [
    [selectionSortModule, buildSelectionSortTrace(lectureArray)],
    [bubbleSortModule, buildBubbleSortTrace(lectureArray)]
  ]) {
    const representative = [trace[0], trace.find((step) => step.phase === "compare"), trace.at(-1)];
    representative.forEach((step) => assertDescription(module.describe(step)));

    const middle = module.describe(representative[1]);
    const final = module.describe(representative[2]);
    assert.match(middle.state.find(({ label }) => label === "Array A").value, /A\[0\] = 89/);
    assert.match(middle.summary, /Compare/);
    assert.match(final.state.find(({ label }) => label === "Array A").value, /A\[0\] = 17/);
    assert.match(final.state.find(({ label }) => label === "Order status").value, /nondecreasing order/);
  }
});

test("String Matching descriptions identify text, pattern, alignment, and compared indices", () => {
  const trace = buildStringMatchingTrace(parseStringMatchingInput("NOBODY_NOTICED_HIM | NOT"));
  const comparison = trace.find((step) => step.phase === "compare" && step.alignment === 7);

  for (const step of [trace[0], comparison, trace.at(-1)]) {
    assertDescription(stringMatchingModule.describe(step));
  }

  const middle = stringMatchingModule.describe(comparison);
  const final = stringMatchingModule.describe(trace.at(-1));
  assert.match(middle.state.find(({ label }) => label === "Text T").value, /T\[7\] = “N”/);
  assert.match(middle.state.find(({ label }) => label === "Current comparison").value, /P\[0\].*T\[7\]/);
  assert.equal(final.state.find(({ label }) => label === "Result").value, "Found at text index 7");
  assert.equal(final.state.find(({ label }) => label === "Matching text range").value, "T[7] through T[9]");
});

test("Closest Pair descriptions enumerate points and state the current and best pairs", () => {
  const trace = buildClosestPairTrace(parsePoints("1,1; 5,1; 2,4; 6,5; 4,3"));
  const pair = trace.find((step) => step.phase === "pair" && step.pairsChecked === 2);

  for (const step of [trace[0], pair, trace.at(-1)]) {
    assertDescription(closestPairModule.describe(step));
  }

  const middle = closestPairModule.describe(pair);
  const final = closestPairModule.describe(trace.at(-1));
  assert.match(middle.state.find(({ label }) => label === "Points").value, /P1 = \(1, 1\)/);
  assert.match(middle.state.find(({ label }) => label === "Current pair").value, /squared distance/);
  assert.match(middle.state.find(({ label }) => label === "Current distance calculation").value, /².*=/);
  assert.match(final.state.find(({ label }) => label === "Closest pair so far").value, /P2 .* P5 .*squared distance 5/);
  assert.match(final.state.find(({ label }) => label === "Decision").value, /All 10 unordered pairs/);
});

function stateLabels(module, trace) {
  return trace.map((step) => module.describe(step).state.map(({ label }) => label));
}

function changedLabels(module, trace, index) {
  return deriveTraceChanges(
    module.describe(trace[index - 1]).state,
    module.describe(trace[index]).state
  ).map(({ label }) => label);
}

test("Lecture 04 text states keep stable labels and expose consecutive algorithm decisions", () => {
  const selectionTrace = buildSelectionSortTrace(lectureArray);
  const bubbleTrace = buildBubbleSortTrace(lectureArray);
  const stringTrace = buildStringMatchingTrace(parseStringMatchingInput("NOBODY_NOTICED_HIM | NOT"));
  const closestTrace = buildClosestPairTrace(parsePoints("1,1; 5,1; 2,4; 6,5; 4,3"));
  const traces = [
    [selectionSortModule, selectionTrace],
    [bubbleSortModule, bubbleTrace],
    [stringMatchingModule, stringTrace],
    [closestPairModule, closestTrace]
  ];

  for (const [module, trace] of traces) {
    const [expected, ...remaining] = stateLabels(module, trace);
    remaining.forEach((labels) => assert.deepEqual(labels, expected, `${module.id} state labels`));
  }

  const selectionUpdate = selectionTrace.findIndex((step) => step.phase === "minimum");
  assert.ok(selectionUpdate > 0);
  assert.deepEqual(
    changedLabels(selectionSortModule, selectionTrace, selectionUpdate).filter((label) => (
      label === "Current minimum" || label === "Comparison result"
    )),
    ["Current minimum", "Comparison result"]
  );

  const bubbleSwap = bubbleTrace.findIndex((step) => step.phase === "swap");
  assert.ok(bubbleSwap > 0);
  assert.deepEqual(
    changedLabels(bubbleSortModule, bubbleTrace, bubbleSwap).filter((label) => (
      label === "Active pair" || label === "Comparison result" || label === "Swap this step"
    )),
    ["Active pair", "Comparison result", "Swap this step"]
  );

  const stringAdvance = stringTrace.findIndex((step) => step.phase === "advance");
  assert.ok(stringAdvance > 0);
  assert.deepEqual(
    changedLabels(stringMatchingModule, stringTrace, stringAdvance).filter((label) => (
      label === "Current comparison" || label === "Comparison result" || label === "Next comparison"
    )),
    ["Current comparison", "Comparison result", "Next comparison"]
  );

  const secondPair = closestTrace.findIndex((step) => step.phase === "pair" && step.pairsChecked === 2);
  assert.ok(secondPair > 1);
  assert.deepEqual(
    changedLabels(closestPairModule, closestTrace, secondPair).filter((label) => (
      label === "Current pair" || label === "Current distance calculation" || label === "Decision"
    )),
    ["Current pair", "Current distance calculation", "Decision"]
  );
});
