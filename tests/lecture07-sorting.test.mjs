import assert from "node:assert/strict";
import { buildMergeTrace, mergeModule, parseMergeInput } from "../src/lectures/07-divide-conquer/merge.js";
import { buildMergesortTrace, mergesortModule, parseMergesortInput } from "../src/lectures/07-divide-conquer/mergesort.js";

const sorted = (values) => [...values].sort((a, b) => a - b);
const rows = (module, step) => Object.fromEntries(module.describe(step).state.map(({ label, value }) => [label, value]));

function checkContract(module, trace) {
  const labels = module.describe(trace[0]).state.map((row) => row.label);
  assert.equal(new Set(labels).size, labels.length);
  const codeLines = new Set(module.pseudocode.map((line) => line.line));
  for (const step of trace) {
    assert.ok(step.message.length > 0);
    assert.ok(step.activeLine == null || codeLines.has(step.activeLine));
    const description = module.describe(step);
    assert.equal(description.summary, step.message);
    assert.deepEqual(description.state.map((row) => row.label), labels);
    assert.ok(description.state.every(({ label, value }) => typeof label === "string" && typeof value === "string"));
    assert.equal(rows(module, step)["Key comparisons"], String(step.comparisons));
    assert.deepEqual(module.metrics(step), [{ label: "Key comparisons", value: step.comparisons, emphasis: true }]);
  }
}

function checkMerge(input) {
  const before = structuredClone(input), trace = buildMergeTrace(input);
  assert.deepEqual(input, before);
  assert.deepEqual(trace, buildMergeTrace(input));
  const expected = [...input.B.map((value, index) => ({ value, origin: `B[${index}]`, run: 0, index })), ...input.C.map((value, index) => ({ value, origin: `C[${index}]`, run: 1, index }))]
    .sort((a, b) => a.value - b.value || a.run - b.run || a.index - b.index);
  const final = trace.at(-1);
  assert.deepEqual(final.A, expected.map((entry) => entry.value));
  assert.deepEqual(final.AOrigins, expected.map((entry) => entry.origin));
  // Independent count oracle: comparison stops when either run's last key is emitted.
  const lastB = expected.findIndex((entry) => entry.origin === `B[${input.B.length - 1}]`);
  const lastC = expected.findIndex((entry) => entry.origin === `C[${input.C.length - 1}]`);
  const expectedCount = input.B.length && input.C.length ? Math.min(lastB, lastC) + 1 : 0;
  assert.equal(final.comparisons, expectedCount);
  let previousCount = 0;
  for (const step of trace) {
    assert.deepEqual(step.B, input.B); assert.deepEqual(step.C, input.C);
    assert.equal(step.comparisons - previousCount, step.phase === "compare" ? 1 : 0);
    previousCount = step.comparisons;
    const written = step.A.filter((value) => value !== null);
    assert.deepEqual(written, sorted(written));
    assert.deepEqual(step.A.slice(0, written.length), written);
    assert.ok(step.A.slice(written.length).every((value) => value === null));
    const origins = step.AOrigins.filter((origin) => origin !== null);
    assert.equal(new Set(origins).size, origins.length);
    assert.deepEqual(origins, expected.slice(0, written.length).map((entry) => entry.origin));
    if (step.phase === "compare") {
      assert.equal(step.activeLine, 3);
      assert.ok(step.i < input.B.length && step.j < input.C.length);
      assert.equal(step.comparison.left, input.B[step.i]);
      assert.equal(step.comparison.right, input.C[step.j]);
      assert.equal(step.comparison.takeLeft, input.B[step.i] <= input.C[step.j]);
    }
    if (step.phase === "take") {
      const move = step.moves[0];
      assert.equal(step.moves.length, 1); assert.equal(step.A[move.to], move.value);
      assert.equal(step.AOrigins[move.to], `${move.run}[${move.from}]`);
      assert.equal(step.activeLine, move.run === "B" ? 3 : 4);
      assert.equal(move.to, step.k);
    }
    if (step.phase === "tail") {
      assert.ok(step.i === input.B.length || step.j === input.C.length);
      assert.equal(step.moves[0].to, step.k);
      assert.equal(step.activeLine, step.moves[0].run === "B" ? 7 : 6);
      assert.deepEqual(step.A, expected.map((entry) => entry.value));
      assert.ok(rows(mergeModule, step)[step.moves[0].run === "B" ? "Left head i" : "Right head j"].includes("already been copied"));
    }
  }
  checkContract(mergeModule, trace);
  return trace;
}

const lectureMerge = checkMerge(mergeModule.input.parse(mergeModule.input.default));
assert.equal(lectureMerge.at(-1).comparisons, 10);
assert.equal(lectureMerge.at(-1).A.at(-1), 21);
const tail = lectureMerge.find((step) => step.phase === "tail");
assert.deepEqual(tail.moves.map(({ value }) => value), [19, 21]);
assert.deepEqual([tail.i, tail.j, tail.k], [4, 6, 10]);
assert.deepEqual([lectureMerge.at(-1).i, lectureMerge.at(-1).j, lectureMerge.at(-1).k], [4, 6, 10]);
assert.equal(tail.comparisons, lectureMerge.at(-1).comparisons);
for (const B of [[], [2], [2, 2], [2, 6, 8], [-3, 0, 2], [1e-9, 2e-9]]) {
  for (const C of [[], [2], [2, 2], [3, 7, 10], [-2, 0, 3], [1e-9, 3e-9]]) {
    if (B.length + C.length) checkMerge({ B, C });
  }
}

function checkMergesort(values) {
  const before = [...values], trace = buildMergesortTrace(values);
  assert.deepEqual(values, before); assert.deepEqual(trace, buildMergesortTrace(values));
  const final = trace.at(-1), root = final.nodes[0];
  assert.deepEqual(root.result, sorted(values));
  const expectedOrigins = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value || a.index - b.index).map(({ index }) => `A[${index}]`);
  assert.deepEqual(root.resultOrigins, expectedOrigins);
  assert.equal(final.nodes.length, 2 * values.length - 1);
  assert.equal(final.mergeCounts.length, values.length - 1);
  assert.equal(final.comparisons, final.mergeCounts.reduce((sum, entry) => sum + entry.comparisons, 0));
  let previousCount = 0;
  for (const step of trace) {
    assert.equal(step.comparisons - previousCount, step.phase === "merge-compare" ? 1 : 0);
    previousCount = step.comparisons;
    assert.ok(step.nodes.some((node) => node.id === step.activeId));
    for (const node of step.nodes) {
      assert.deepEqual(node.input, values.slice(node.start, node.end + 1));
      if (node.result) {
        assert.equal(node.status, "returned");
        assert.deepEqual(node.result, sorted(node.input));
        assert.deepEqual(node.resultOrigins, node.input.map((value, offset) => ({ value, index: node.start + offset })).sort((a, b) => a.value - b.value || a.index - b.index).map(({ index }) => `A[${index}]`));
      } else assert.notEqual(node.status, "returned");
      if (node.leftId) {
        const left = step.nodes.find((entry) => entry.id === node.leftId), right = step.nodes.find((entry) => entry.id === node.rightId);
        assert.equal(left.input.length, Math.floor(node.input.length / 2));
        assert.equal(right.input.length, Math.ceil(node.input.length / 2));
        assert.equal(left.parentId, node.id); assert.equal(right.parentId, node.id);
        assert.equal(left.start, node.start); assert.equal(right.start, left.end + 1); assert.equal(right.end, node.end);
      }
    }
    if (step.phase === "call-right") {
      const parent = step.nodes.find((node) => node.id === step.activeId);
      assert.ok(step.nodes.find((node) => node.id === parent.leftId).result);
      assert.equal(step.nodes.find((node) => node.id === parent.rightId).result, null);
    }
    if (step.merge) {
      const node = step.nodes.find((entry) => entry.id === step.activeId);
      assert.equal(node.status, "merging"); assert.equal(node.result, null);
      assert.ok(step.nodes.find((entry) => entry.id === node.leftId).result);
      assert.ok(step.nodes.find((entry) => entry.id === node.rightId).result);
      assert.equal(step.merge.comparisons, step.comparisons);
      if (step.phase === "merge-compare") assert.equal(step.activeLine, 10);
    }
  }
  checkContract(mergesortModule, trace);
  return trace;
}

const lectureSort = checkMergesort(mergesortModule.input.parse(mergesortModule.input.default));
assert.equal(rows(mergesortModule, lectureSort[0])["Call path"], "none; recursion has not started");
assert.equal(lectureSort.at(-1).comparisons, 16);
assert.deepEqual(lectureSort.at(-1).mergeCounts.map((entry) => entry.comparisons), [1, 1, 3, 1, 1, 3, 6]);
const worstPreset = mergesortModule.input.presets.find((preset) => preset.label === "Lecture keys: worst comparisons");
const worstSort = checkMergesort(mergesortModule.input.parse(worstPreset.value));
assert.deepEqual(worstSort.at(-1).nodes[0].result, [1, 2, 3, 4, 5, 7, 8, 9]);
assert.equal(worstSort.at(-1).comparisons, 17);
assert.deepEqual(worstSort.at(-1).mergeCounts.map((entry) => entry.comparisons), [1, 1, 3, 1, 1, 3, 7]);
assert.ok(lectureSort.find((step) => step.phase === "call-right" && step.activeId === "root").nodes.find((node) => node.id === "rootL").result);
for (const values of [[8], [8, 3], [8, 3, 2], [8, 3, 2, 9, 7], [2, 1, 2, 1, 2], [3, 3, 3, 3], [1e-9, 0, 2e-9, 1e-9], [-1_000_000, 1_000_000, 0]]) checkMergesort(values);
for (const n of [3, 5, 6, 10]) assert.ok(mergesortModule.model(buildMergesortTrace(Array.from({ length: n }, (_, index) => index)).at(-1)).latex.includes("\\lfloor n/2\\rfloor"));
assert.ok(!mergesortModule.model(lectureSort.at(-1)).latex.includes("\\lfloor n/2\\rfloor"));
function permutations(values) {
  return values.length <= 1 ? [values] : values.flatMap((value, index) => permutations(values.filter((_, at) => at !== index)).map((rest) => [value, ...rest]));
}
for (const values of permutations([1, 2, 3, 4])) {
  const final = buildMergesortTrace(values).at(-1);
  assert.deepEqual(final.nodes[0].result, [1, 2, 3, 4]);
  assert.ok(final.comparisons >= 4 && final.comparisons <= 5);
}
assert.equal(Math.max(...permutations([1, 2, 3, 4]).map((values) => buildMergesortTrace(values).at(-1).comparisons)), 5);

// Snapshots must not share mutable arrays or node objects with other steps.
const isolated = buildMergesortTrace([8, 3, 2]);
const saved = structuredClone(isolated[1]); isolated[0].nodes[0].input[0] = 999; isolated[0].original[0] = 999;
assert.deepEqual(isolated[1], saved);
const mergeIsolated = buildMergeTrace({ B: [2, 6], C: [3, 7] });
const mergeSaved = structuredClone(mergeIsolated[1]); mergeIsolated[0].B[0] = 999; mergeIsolated[0].A[0] = 999;
assert.deepEqual(mergeIsolated[1], mergeSaved);

assert.deepEqual(parseMergeInput(" | 2, 3"), { B: [], C: [2, 3] });
assert.throws(() => parseMergeInput(" | "), /At least one/);
assert.throws(() => parseMergeInput("6, 2 | 3"), /Run B/);
assert.throws(() => parseMergeInput("2 | 7, 3"), /Run C/);
assert.throws(() => parseMergeInput("2, 3"), /Separate/);
assert.throws(() => parseMergeInput("2 | NaN"), /valid number/);
assert.throws(() => parseMergeInput("1000001 | 2"), /between/);
assert.throws(() => parseMergeInput("1,2,3,4,5,6,7 | 1,2,3,4,5,6"), /at most 12/);
assert.throws(() => parseMergesortInput(""), /between 1 and 10/);
assert.throws(() => parseMergesortInput("1000001"), /between/);
assert.throws(() => parseMergesortInput("1,2,3,4,5,6,7,8,9,10,11"), /between 1 and 10/);
assert.ok(mergeModule.render(buildMergeTrace({ B: [1e-9], C: [2e-9] })[1]).includes("1e-9"));
assert.ok(mergesortModule.describe(buildMergesortTrace([1e-9]).at(-1)).state.some((row) => row.value.includes("1e-9")));
console.log("Lecture 07 sorting: source examples, independent merge counts, stable origins, odd splits, recursion retention, immutable snapshots, and parsers pass.");
