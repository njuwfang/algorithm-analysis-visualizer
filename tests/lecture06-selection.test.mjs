import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import {
  buildLomutoPartitionTrace, lomutoPartitionModule, traceLomutoPartition
} from "../src/lectures/06-decrease-conquer/lomuto-partition.js";
import {
  buildQuickselectTrace, candidateSizes, parseQuickselectInput, quickselectModule
} from "../src/lectures/06-decrease-conquer/quickselect.js";

const lectureArray = [4, 1, 10, 8, 7, 12, 9, 2, 15];
const descriptionValue = (module, step, label) => module.describe(step).state.find((row) => row.label === label)?.value;

function permutations(values) {
  if (values.length < 2) return [values];
  const unique = new Map();
  for (let i = 0; i < values.length; i += 1) {
    const rest = [...values.slice(0, i), ...values.slice(i + 1)];
    for (const suffix of permutations(rest)) {
      const result = [values[i], ...suffix];
      unique.set(result.join(","), result);
    }
  }
  return [...unique.values()];
}

function assertPartitionRegions(step) {
  if (step.p === null) return;
  const leftStart = step.partitioned ? step.l : step.l + 1;
  const leftEnd = step.partitioned ? step.m - 1 : step.m;
  const rightEnd = step.partitioned ? step.r : step.processedThrough;
  assert.ok(step.values.slice(leftStart, leftEnd + 1).every((value) => value < step.p), `invalid < p segment during ${step.phase}`);
  assert.ok(step.values.slice(step.m + 1, rightEnd + 1).every((value) => value >= step.p), `invalid ≥ p segment during ${step.phase}`);
  assert.equal(step.values[step.partitioned ? step.m : step.l], step.p);
}

function assertComparisonEvents(trace) {
  for (let index = 0; index < trace.length; index += 1) {
    const step = trace[index];
    const previousCount = index === 0 ? 0 : trace[index - 1].comparisons;
    assert.equal(step.comparisons - previousCount, step.phase === "compare" ? 1 : 0, `incorrect counted event ${step.phase}`);
    assertPartitionRegions(step);
    assert.ok(step.message.trim());
  }
}

test("Lomuto reproduces the lecture first partition, including self-swaps", () => {
  const trace = buildLomutoPartitionTrace(lectureArray);
  const final = trace.at(-1);
  assert.equal(final.m, 2);
  assert.equal(final.p, 4);
  assert.equal(final.comparisons, 8);
  assert.deepEqual(final.values, [2, 1, 4, 8, 7, 12, 9, 10, 15]);
  assert.deepEqual(trace.filter((step) => step.phase === "compare").map((step) => step.i), [1, 2, 3, 4, 5, 6, 7, 8]);
  const swaps = trace.filter((step) => step.phase === "smaller-swap");
  assert.deepEqual(swaps.map((step) => step.swapIndices), [[1], [2, 7]]);
  assert.match(swaps[0].message, /with itself/);
  assertComparisonEvents(trace);
});

test("Lomuto preserves its three-region invariant for all small permutations", () => {
  for (const values of [...permutations([1, 2, 3, 4]), ...permutations([1, 2, 2, 3])]) {
    const trace = buildLomutoPartitionTrace(values);
    const final = trace.at(-1);
    assert.equal(final.comparisons, values.length - 1);
    assert.equal(final.m, values.filter((value) => value < values[0]).length);
    assert.deepEqual([...final.values].sort((a, b) => a - b), [...values].sort((a, b) => a - b));
    assertComparisonEvents(trace);
  }
});

test("Lomuto's reusable subarray trace uses absolute indices and leaves other elements intact", () => {
  const values = [100, 4, 1, 4, 2, -100];
  const result = traceLomutoPartition(values, 1, 4);
  assert.equal(result.pivotIndex, 3);
  assert.equal(result.comparisons, 3);
  assert.equal(result.values[0], 100);
  assert.equal(result.values[5], -100);
  assert.deepEqual(values, [100, 4, 1, 4, 2, -100]);
  assertComparisonEvents(result.trace);
});

test("Quickselect follows the worked global-rank example and exposes all 13 comparisons", () => {
  const trace = buildQuickselectTrace({ values: lectureArray, k: 5 });
  const final = trace.at(-1);
  assert.equal(final.result, 8);
  assert.equal(final.resultIndex, 4);
  assert.equal(final.comparisons, 13);
  assert.deepEqual(final.completedPartitionSizes, [9, 6]);
  assert.deepEqual(final.values, [2, 1, 4, 7, 8, 12, 9, 10, 15]);
  const calls = trace.filter((step) => step.phase === "call");
  assert.deepEqual(calls.map((step) => [step.l, step.r, step.k]), [[0, 8, 5], [3, 8, 5]]);
  assert.deepEqual(trace.filter((step) => step.phase === "compare").map((step) => step.activeLine), Array(13).fill(12));
  assertComparisonEvents(trace);
  assert.match(quickselectModule.model(final).latex, /8\+5=13/);
});

test("Quickselect finds every rank for all small distinct and repeated-key permutations", () => {
  const cases = [
    ...permutations([1, 2, 3, 4, 5]),
    ...permutations([1, 2, 2, 3, 3]),
    [5], [4, 4, 4, 4], [-3, 0.5, -3, 0, 0.5]
  ];
  for (const values of cases) {
    const sorted = [...values].sort((a, b) => a - b);
    for (let k = 1; k <= values.length; k += 1) {
      const trace = buildQuickselectTrace({ values, k });
      const final = trace.at(-1);
      assert.equal(final.result, sorted[k - 1], `${values}, rank ${k}`);
      assert.equal(final.resultIndex, k - 1);
      assert.equal(final.retainedL, k - 1);
      assert.equal(final.retainedR, k - 1);
      assert.ok(trace.every((step) => step.k === k && step.targetIndex === k - 1));
      assert.equal(final.comparisons, final.completedPartitionSizes.reduce((sum, size) => sum + size - 1, 0));
      assertComparisonEvents(trace);
    }
  }
});

test("Quickselect best and worst cases match the lecture counts", () => {
  const best = buildQuickselectTrace({ values: lectureArray, k: 3 }).at(-1);
  assert.equal(best.comparisons, lectureArray.length - 1);
  assert.deepEqual(best.completedPartitionSizes, [9]);

  for (let n = 1; n <= 10; n += 1) {
    const sorted = Array.from({ length: n }, (_, index) => index + 1);
    const final = buildQuickselectTrace({ values: sorted, k: n }).at(-1);
    assert.equal(final.comparisons, n * (n - 1) / 2);
    assert.equal(final.result, n);
    const equalKeys = buildQuickselectTrace({ values: Array(n).fill(4), k: n }).at(-1);
    assert.equal(equalKeys.comparisons, n * (n - 1) / 2);
  }
});

test("singleton and equal-key traces reveal the strict comparison and base case", () => {
  const singleton = buildQuickselectTrace({ values: [4], k: 1 });
  assert.deepEqual(singleton.map((step) => step.phase), ["call", "singleton", "complete"]);
  assert.equal(singleton.at(-1).comparisons, 0);
  const equal = buildLomutoPartitionTrace([4, 4, 4]);
  assert.equal(equal.at(-1).m, 0);
  assert.ok(equal.filter((step) => step.phase === "compare").every((step) => step.comparisonResult === false));
  assert.deepEqual(equal.find((step) => step.phase === "pivot-swap").swapIndices, [0]);
});

test("selection parsers reject invalid arrays, missing ranks, and out-of-range ranks", () => {
  assert.throws(() => parseQuickselectInput("4, 1, 2"), /array values \| k/);
  assert.throws(() => parseQuickselectInput("4, 1, 2 |"), /rank k/);
  for (const raw of ["1,2|0", "1,2|3", "1,2|1.5", "1,2|NaN", "1,2|Infinity"]) {
    assert.throws(() => parseQuickselectInput(raw), /rank k/);
  }
  assert.throws(() => parseQuickselectInput("1, nope | 1"), /valid number/);
  assert.throws(() => lomutoPartitionModule.input.parse(""), /between 1 and 10/);
  assert.throws(() => lomutoPartitionModule.input.parse("1, Infinity"), /valid number/);
  assert.throws(() => lomutoPartitionModule.input.parse("1,2,3,4,5,6,7,8,9,10,11"), /between 1 and 10/);
});

test("selection descriptions expose indexed segments, comparison results, retention, and returned values", () => {
  const partition = buildLomutoPartitionTrace(lectureArray);
  const comparison = partition.find((step) => step.phase === "compare");
  assert.match(descriptionValue(lomutoPartitionModule, comparison, "Array A"), /A\[8\]=15/);
  assert.equal(descriptionValue(lomutoPartitionModule, comparison, "Less than p"), "none");
  assert.match(descriptionValue(lomutoPartitionModule, comparison, "Unprocessed"), /A\[1\] = 1/);
  assert.equal(descriptionValue(lomutoPartitionModule, comparison, "Comparison this step"), "A[1] = 1 < 4 is true");
  const complete = partition.at(-1);
  assert.equal(descriptionValue(lomutoPartitionModule, complete, "Less than p"), "A[0] = 2; A[1] = 1");
  assert.match(descriptionValue(lomutoPartitionModule, complete, "Greater than or equal to p"), /A\[3\] = 8/);
  assert.equal(descriptionValue(lomutoPartitionModule, complete, "Unprocessed"), "none");

  const selection = buildQuickselectTrace({ values: lectureArray, k: 5 });
  const right = selection.find((step) => step.phase === "recurse-right");
  assert.match(descriptionValue(quickselectModule, right, "Retained candidates"), /^A\[3\] = 8/);
  assert.equal(descriptionValue(quickselectModule, right, "Discarded positions"), "A[0] = 2; A[1] = 1; A[2] = 4");
  assert.equal(descriptionValue(quickselectModule, selection.at(-1), "Returned value"), "A[4] = 8, rank 5");
});

test("candidate-size progression records only the algorithm's retained candidates", () => {
  const trace = buildQuickselectTrace({ values: lectureArray, k: 5 });
  assert.deepEqual(candidateSizes(trace[0]), [9]);
  const returnedFirstPartition = trace.find((step) => step.phase === "partition-return");
  assert.deepEqual(candidateSizes(returnedFirstPartition), [9]);
  const right = trace.find((step) => step.phase === "recurse-right");
  assert.deepEqual(candidateSizes(right), [9, 6]);
  assert.deepEqual(candidateSizes(trace.at(-1)), [9, 6, 1]);
  assert.equal(descriptionValue(quickselectModule, trace.at(-1), "Candidate-size progression"), "9 → 6 → 1");
  assert.deepEqual(candidateSizes(buildQuickselectTrace({ values: [4], k: 1 }).at(-1)), [1]);
});

test("near-equal custom keys remain distinguishable in the trace and text", () => {
  const trace = buildLomutoPartitionTrace([1.00002, 1.00001, 1.00003]);
  const comparison = trace.find((step) => step.phase === "compare");
  assert.equal(comparison.comparisonResult, true);
  assert.match(comparison.message, /1\.00001 < p = 1\.00002/);
  assert.equal(descriptionValue(lomutoPartitionModule, comparison, "Comparison this step"), "A[1] = 1.00001 < 1.00002 is true");
  assert.match(lomutoPartitionModule.render(comparison), /1\.00001/);
  assert.match(lomutoPartitionModule.render(comparison), /1\.00002/);
});

test("selection modules meet schema, stable-description, deterministic, and input-purity contracts", () => {
  for (const module of [lomutoPartitionModule, quickselectModule]) {
    assert.equal(validateModule(module, "06-decrease-conquer"), true);
    for (const preset of module.input.presets) {
      const input = module.input.parse(preset.value);
      const before = structuredClone(input);
      const trace = module.buildTrace(input);
      assert.deepEqual(input, before);
      assert.deepEqual(trace, module.buildTrace(input));
      const labels = module.describe(trace[0]).state.map(({ label }) => label);
      for (const step of trace) {
        assert.deepEqual(module.describe(step), module.describe(step));
        assert.deepEqual(module.describe(step).state.map(({ label }) => label), labels);
        assert.equal(descriptionValue(module, step, "Key comparisons"), String(step.comparisons));
        assert.equal(module.metrics(step)[0].label, "Key comparisons");
        assert.equal(module.metrics(step)[0].value, step.comparisons);
        assert.equal(typeof module.render(step), "string");
      }
    }
  }
});
