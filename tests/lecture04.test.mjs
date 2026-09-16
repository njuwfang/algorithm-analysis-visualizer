import test from "node:test";
import assert from "node:assert/strict";
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
