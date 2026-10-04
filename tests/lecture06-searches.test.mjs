import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import {
  binarySearchModule,
  buildBinarySearchTrace,
  parseBinarySearchInput
} from "../src/lectures/06-decrease-conquer/binary-search.js";
import {
  interpolationSearchModule,
  buildInterpolationSearchTrace,
  parseInterpolationSearchInput
} from "../src/lectures/06-decrease-conquer/interpolation-search.js";

function stateValue(module, step, label) {
  return module.describe(step).state.find((row) => row.label === label)?.value;
}

function assertCountedEvents(trace, phase, countField, countedLine) {
  let previous = 0;
  for (const step of trace) {
    const delta = step[countField] - previous;
    assert.equal(delta, step.phase === phase ? 1 : 0, `${step.phase}: ${step.message}`);
    if (delta) assert.equal(step.activeLine, countedLine);
    previous = step[countField];
  }
}

test("binary search reproduces lecture bounds, floor midpoints, and three comparisons", () => {
  const input = binarySearchModule.input.parse(binarySearchModule.input.default);
  const trace = buildBinarySearchTrace(input);
  const probes = trace.filter((step) => step.phase === "compare");
  assert.deepEqual(probes.map((step) => [step.l, step.m, step.r]), [[0, 6, 12], [7, 9, 12], [7, 7, 8]]);
  assert.deepEqual(probes.map((step) => step.comparison), [">", "<", "="]);
  assert.equal(trace.at(-1).result, 7);
  assert.equal(trace.at(-1).comparisons, 3);
  assertCountedEvents(trace, "compare", "comparisons", 4);
  assert.doesNotMatch(binarySearchModule.model(trace[0]).latex, /Theta/);
  assert.match(binarySearchModule.model(trace.at(-1)).latex, /lfloor\\log_2 n/);
});

test("binary drawings show the retained interval and only completed size reductions", () => {
  const trace = buildBinarySearchTrace(binarySearchModule.input.parse(binarySearchModule.input.default));
  const firstCompare = trace.find((step) => step.phase === "compare");
  const firstReduction = trace.find((step) => step.phase === "reduce");
  assert.equal(stateValue(binarySearchModule, firstCompare, "Interval sizes"), "13");
  assert.equal(stateValue(binarySearchModule, firstReduction, "Interval sizes"), "13 → 6");
  assert.equal(stateValue(binarySearchModule, trace.at(-1), "Interval sizes"), "13 → 6 → 2");
  assert.match(binarySearchModule.render(firstCompare), /binary-search-pointer is-midpoint/);
  assert.match(binarySearchModule.render(firstReduction), /Candidate interval A\[7\.\.12\]/);
  assert.match(binarySearchModule.render(firstReduction), /is-retained" style="grid-column:8\/span 6/);
  assert.match(binarySearchModule.render(firstReduction), /× discarded/);
});

test("binary search returns matching indices and attains its exact worst-case bound", () => {
  for (let n = 1; n <= 13; n += 1) {
    const array = Array.from({ length: n }, (_, i) => 2 * i);
    let maximum = 0;
    for (let key = -1; key <= 2 * n; key += 1) {
      const trace = buildBinarySearchTrace({ array, key });
      const result = trace.at(-1).result;
      if (array.includes(key)) assert.equal(array[result], key, `n=${n}, key=${key}`);
      else assert.equal(result, -1, `n=${n}, key=${key}`);
      for (const step of trace.filter((event) => event.phase === "compare")) {
        assert.equal(step.m, Math.floor((step.l + step.r) / 2));
        assert.ok(step.m >= step.l && step.m <= step.r);
      }
      assertCountedEvents(trace, "compare", "comparisons", 4);
      maximum = Math.max(maximum, trace.at(-1).comparisons);
    }
    assert.equal(maximum, Math.floor(Math.log2(n)) + 1, `n=${n}`);
  }
  const duplicateTrace = buildBinarySearchTrace({ array: [3, 14, 14, 14, 70], key: 14 });
  assert.equal(duplicateTrace.at(-1).result, 2);
  const missing = buildBinarySearchTrace({ array: [70], key: 71 }).at(-1);
  assert.equal(missing.result, -1);
  assert.equal(missing.comparisons, 1);
});

test("search parsers require bounded sorted integers and an explicit key", () => {
  for (const parse of [parseBinarySearchInput, parseInterpolationSearchInput]) {
    assert.throws(() => parse("3,14,70"), /separated by \|/);
    assert.throws(() => parse("3,14,70 |"), /search key/);
    assert.throws(() => parse("70,14,3 | 14"), /sorted/);
    assert.throws(() => parse("3,14.5,70 | 14"), /integers/);
    assert.throws(() => parse("3,14,70 | Infinity"), /search key/);
    assert.throws(() => parse("-1000001,70 | 70"), /integers/);
    assert.throws(() => parse("3,70 | 1000001"), /search key/);
    assert.throws(() => parse(Array.from({ length: 14 }, (_, i) => i).join(",") + " | 7"), /between 1 and 13/);
  }
});

test("interpolation uses the lecture formula and makes integer rounding explicit", () => {
  const trace = interpolationSearchModule.buildTrace(interpolationSearchModule.input.parse(interpolationSearchModule.input.default));
  const estimates = trace.filter((step) => step.phase === "estimate");
  const probes = trace.filter((step) => step.phase === "probe");
  assert.equal(estimates[0].estimate, (70 - 3) * 12 / (98 - 3));
  assert.equal(estimates[0].x, 8);
  assert.deepEqual(probes.map((step) => step.x), [8, 7]);
  assert.equal(trace.at(-1).result, 7);
  assert.equal(trace.at(-1).probes, 2);
  assertCountedEvents(trace, "probe", "probes", 5);
  assert.match(stateValue(interpolationSearchModule, estimates[0], "Line endpoints"), /\(0, 3\) and \(12, 98\)/);
  assert.match(stateValue(interpolationSearchModule, estimates[0], "Real-valued estimate"), /≈ 8\.4632/);
  assert.match(interpolationSearchModule.render(estimates[0]), /decrease-search-guide/);
  assert.match(interpolationSearchModule.render(estimates[0]), /x≈8\.4632 → index 8/);
  assert.match(interpolationSearchModule.render(probes[0]), /decrease-search-probe/);
});

test("interpolation drawings distinguish a remembered probe's origin from reduced current bounds", () => {
  const trace = buildInterpolationSearchTrace(interpolationSearchModule.input.parse(interpolationSearchModule.input.default));
  const reduction = trace.find((step) => step.phase === "reduce");
  assert.equal(reduction.x, 8);
  assert.deepEqual([reduction.l, reduction.r], [0, 7]);
  assert.equal(stateValue(interpolationSearchModule, reduction, "Probe origin range"), "[0..12]");
  assert.equal(stateValue(interpolationSearchModule, reduction, "Probe role"), "previous probe");
  const html = interpolationSearchModule.render(reduction);
  assert.match(html, /Candidates lst\[0\.\.7\]/);
  assert.match(html, /x\*: Last x = 8, from \[0\.\.12\]/);
  assert.match(html, /is-previous-probe/);
  assert.doesNotMatch(html, /decrease-search-guide|decrease-search-estimate/);
  assert.match(html, /is-retained" style="grid-column:1\/span 8/);
  const nextEstimate = trace.find((step) => step.phase === "estimate" && step.probes === 1);
  assert.equal(stateValue(interpolationSearchModule, nextEstimate, "Probe origin range"), "[0..7]");
  assert.equal(stateValue(interpolationSearchModule, nextEstimate, "Probe role"), "current estimate");
});

test("interpolation handles equal endpoints, duplicates, out-of-range keys, and missing keys", () => {
  const cases = [
    { lst: [70], key: 70, result: 0, probes: 1 },
    { lst: [70, 70, 70], key: 70, result: 0, probes: 1 },
    { lst: [70, 70, 70], key: 71, result: -1, probes: 0 },
    { lst: [3, 3, 14, 14, 70, 70], key: 14, result: 2 },
    { lst: [3, 14, 70], key: 2, result: -1, probes: 0 },
    { lst: [3, 14, 70], key: 71, result: -1, probes: 0 },
    { lst: [3, 14, 70], key: 13, result: -1 },
    { lst: [-1_000_000, -70, 0, 70, 1_000_000], key: -70, result: 1 },
    { lst: [-1_000_000, -70, 0, 70, 1_000_000], key: 1_000_000, result: 4 }
  ];
  for (const input of cases) {
    const trace = buildInterpolationSearchTrace(input);
    const final = trace.at(-1);
    assert.equal(final.result, input.result, JSON.stringify(input));
    if (input.probes !== undefined) assert.equal(final.probes, input.probes);
    assertCountedEvents(trace, "probe", "probes", 5);
    for (const step of trace.filter((event) => event.phase === "estimate")) {
      assert.ok(Number.isFinite(step.estimate));
      assert.ok(Number.isInteger(step.x) && step.x >= step.l && step.x <= step.r);
    }
  }
  const equal = buildInterpolationSearchTrace({ lst: [70, 70, 70], key: 70 }).find((step) => step.phase === "estimate");
  assert.equal(equal.activeLine, 3);
  assert.match(equal.message, /without dividing by zero/);
  assert.match(interpolationSearchModule.render(equal), /x = l = 0 \(equal endpoints\)/);
  assert.doesNotMatch(interpolationSearchModule.render(equal), /decrease-search-guide|x≈/);
  assert.match(stateValue(interpolationSearchModule, equal, "Real-valued estimate"), /not used/);
});

test("interpolation terminates and returns correct results over small sorted lists", () => {
  function lists(prefix, remaining, minimum = 0) {
    if (remaining === 0) return [prefix];
    return [0, 1, 3].filter((value) => value >= minimum)
      .flatMap((value) => lists([...prefix, value], remaining - 1, value));
  }
  for (let n = 1; n <= 6; n += 1) {
    for (const lst of lists([], n)) {
      for (let key = -1; key <= 4; key += 1) {
        const trace = buildInterpolationSearchTrace({ lst, key });
        const final = trace.at(-1);
        assert.ok(final.probes <= n);
        if (lst.includes(key)) assert.equal(lst[final.result], key, `${lst} | ${key}`);
        else assert.equal(final.result, -1, `${lst} | ${key}`);
        const probes = trace.filter((step) => step.phase === "probe");
        probes.forEach((step, index) => {
          assert.ok(step.x >= step.l && step.x <= step.r);
          if (index > 0) assert.ok(step.r - step.l < probes[index - 1].r - probes[index - 1].l);
        });
      }
    }
  }
});

test("search traces preserve input and provide stable complete descriptions", () => {
  for (const module of [binarySearchModule, interpolationSearchModule]) {
    assert.equal(validateModule(module, "06-decrease-conquer"), true);
    for (const raw of new Set([module.input.default, ...module.input.presets.map((preset) => preset.value)])) {
      const input = module.input.parse(raw);
      const before = structuredClone(input);
      const trace = module.buildTrace(input);
      assert.deepEqual(input, before);
      assert.deepEqual(trace, module.buildTrace(input));
      const labels = module.describe(trace[0]).state.map((row) => row.label);
      for (const step of trace) {
        assert.deepEqual(module.describe(step).state.map((row) => row.label), labels);
        const metric = module.metrics(step)[0];
        assert.equal(stateValue(module, step, metric.label), String(metric.value));
      }
    }
  }
});
