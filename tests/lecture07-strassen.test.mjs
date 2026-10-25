import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import {
  parseStrassenInput, buildStrassenTrace, strassenFormalProductTerms, productRules, outputRules
} from "../src/lectures/07-divide-conquer/strassen-trace.js";
import {
  strassenModule, parseStrassenInput as parseViaFacade, buildStrassenTrace as buildViaFacade
} from "../src/lectures/07-divide-conquer/strassen.js";

function classical(A, B) {
  return A.map((row) => B.map((_, col) => row.reduce((sum, value, k) => sum + value * B[k][col], 0)));
}
const activeCall = (step) => step.calls.find((call) => call.id === step.activeCallId);
const stateValue = (step, label) => strassenModule.describe(step).state.find((row) => row.label === label)?.value;
const defaultInput = () => ({ A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]] });

function assertCountedEvents(trace) {
  for (let index = 0; index < trace.length; index += 1) {
    const step = trace[index];
    assert.equal(step.scalarMultiplications - (trace[index - 1]?.scalarMultiplications ?? 0), step.phase === "multiply" ? 1 : 0);
    if (step.phase === "multiply") {
      const call = activeCall(step);
      assert.equal(step.activeLine, 2);
      assert.equal(call.n, 1);
      assert.equal(call.C[0][0], call.A[0][0] * call.B[0][0] || 0);
    }
  }
}

function blockAt(matrix, output) {
  const h = matrix.length / 2;
  return matrix.slice(output >= 2 ? h : 0, output >= 2 ? 2 * h : h)
    .map((row) => row.slice(output % 2 ? h : 0, output % 2 ? 2 * h : h));
}

test("Strassen executes M1 through M7, then writes C00, C01, C10, C11 in lecture order", () => {
  const trace = buildStrassenTrace(defaultInput());
  const final = trace.at(-1);
  assert.equal(trace.length, 37);
  assert.deepEqual(final.result, [[19, 22], [43, 50]]);
  assert.deepEqual(final.calls[0].products, [[[65]], [[35]], [[-2]], [[8]], [[24]], [[22]], [[-30]]]);
  const prepares = trace.filter((step) => step.phase === "prepare");
  const retains = trace.filter((step) => step.phase === "retain");
  assert.deepEqual(prepares.map((step) => activeCall(step).selectedProduct), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(retains.map((step) => activeCall(step).selectedProduct), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(prepares.map((step) => step.activeLine), [4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(prepares.map((step) => activeCall(step).operands), [
    { left: [[5]], right: [[13]] }, { left: [[7]], right: [[5]] },
    { left: [[1]], right: [[-2]] }, { left: [[4]], right: [[2]] },
    { left: [[3]], right: [[8]] }, { left: [[2]], right: [[11]] },
    { left: [[-2]], right: [[15]] }
  ]);
  const firstWrite = trace.findIndex((step) => step.phase === "combine");
  assert.ok(trace.slice(0, firstWrite).every((step) => step.calls[0].C.flat().every((value) => value === null)), "output values are not shown before their assignments");
  const writes = trace.filter((step) => step.phase === "combine");
  assert.deepEqual(writes.map((step) => activeCall(step).selectedOutput), [0, 1, 2, 3]);
  assert.deepEqual(writes.map((step) => step.activeLine), [11, 12, 13, 14]);
  assert.deepEqual(writes.map((step) => activeCall(step).C), [
    [[19, null], [null, null]], [[19, 22], [null, null]], [[19, 22], [43, null]], [[19, 22], [43, 50]]
  ]);
  assert.ok(writes.every((step) => step.scalarMultiplications === 7));
  assert.ok(trace.every((step) => !["goal", "combine-term"].includes(step.phase)), "the algorithm has no mandatory teaching detours");
  assertCountedEvents(trace);
});

test("every recursive call keeps canonical seven-product and four-output order", () => {
  const preset = strassenModule.input.presets.find(({ label }) => label === "4 × 4 blocks");
  const trace = buildStrassenTrace(parseStrassenInput(preset.value));
  const final = trace.at(-1);
  assert.equal(trace.length, 268);
  assert.equal(final.scalarMultiplications, 49);
  assert.equal(final.calls.length, 1 + 7 + 49);
  assert.deepEqual(final.calls.reduce((counts, call) => ({ ...counts, [call.n]: (counts[call.n] ?? 0) + 1 }), {}), { 1: 49, 2: 7, 4: 1 });
  for (const call of final.calls) {
    assert.equal(call.status, "returned");
    assert.equal(call.scalarMultiplications, 7 ** Math.log2(call.n));
    assert.deepEqual(call.C, classical(call.A, call.B));
    assert.equal("goalOutput" in call, false);
    if (call.parentId) {
      const parent = final.calls.find((entry) => entry.id === call.parentId);
      assert.equal(call.n, parent.n / 2);
      assert.equal(call.depth, parent.depth + 1);
      assert.equal(call.id, `${call.parentId}.M${call.parentProduct + 1}`);
      assert.deepEqual(parent.products[call.parentProduct], call.C);
    }
    if (call.n === 1) continue;
    const local = trace.filter((step) => step.activeCallId === call.id);
    const prepares = local.filter((step) => step.phase === "prepare");
    const retains = local.filter((step) => step.phase === "retain");
    const writes = local.filter((step) => step.phase === "combine");
    assert.deepEqual(prepares.map((step) => activeCall(step).selectedProduct), [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(retains.map((step) => activeCall(step).selectedProduct), [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(writes.map((step) => activeCall(step).selectedOutput), [0, 1, 2, 3]);
    assert.ok(writes.every((step) => activeCall(step).products.every((product) => product !== null)), "all seven products precede the four output assignments");
    for (let written = 0; written < 4; written += 1) {
      const step = writes[written];
      const current = activeCall(step);
      for (let output = 0; output < 4; output += 1) {
        if (output <= written) assert.deepEqual(blockAt(current.C, output), blockAt(call.C, output));
        else assert.ok(blockAt(current.C, output).flat().every((value) => value === null));
      }
    }
  }
  assertCountedEvents(trace);
});

test("scalar counts and results agree with a classical oracle for negative, zero, identity, and deterministic random matrices", () => {
  let seed = 739;
  const integer = () => { seed = seed * 48271 % 2147483647; return seed % 19 - 9; };
  for (const n of [1, 2, 4]) {
    const inputs = [
      { A: Array.from({ length: n }, () => Array(n).fill(0)), B: Array.from({ length: n }, () => Array(n).fill(0)) },
      { A: Array.from({ length: n }, () => Array(n).fill(-99)), B: Array.from({ length: n }, () => Array(n).fill(99)) },
      { A: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r === c ? 1 : 0)), B: Array.from({ length: n }, () => Array.from({ length: n }, integer)) },
      ...Array.from({ length: 8 }, () => ({ A: Array.from({ length: n }, () => Array.from({ length: n }, integer)), B: Array.from({ length: n }, () => Array.from({ length: n }, integer)) }))
    ];
    for (const input of inputs) {
      const before = structuredClone(input);
      const trace = buildStrassenTrace(input);
      assert.deepEqual(input, before);
      assert.deepEqual(trace.at(-1).result, classical(input.A, input.B));
      assert.equal(trace.at(-1).scalarMultiplications, 7 ** Math.log2(n));
      assert.equal(trace.filter((step) => step.phase === "multiply").length, 7 ** Math.log2(n));
      assertCountedEvents(trace);
      for (const step of trace) {
        for (const call of step.calls) {
          const expected = classical(call.A, call.B);
          for (let row = 0; row < call.n; row += 1) {
            for (let col = 0; col < call.n; col += 1) {
              if (call.C[row][col] !== null) assert.equal(call.C[row][col], expected[row][col]);
            }
          }
        }
      }
    }
  }
  const scalar = buildStrassenTrace({ A: [[0]], B: [[-99]] });
  assert.deepEqual(scalar.map((step) => step.phase), ["ready", "call", "multiply", "complete"]);
  assert.match(scalar[0].message, /one scalar multiplication/);
  assert.doesNotMatch(scalar[0].message, /seven products/);
  assert.equal(scalar.at(-1).scalarMultiplications, 1, "even a zero scalar product is counted");
});

test("block multiplication preserves A-before-B order and does not mutate frozen operands", () => {
  const A = [[0, 0, 1, 1], [0, 0, 0, 1], [0, 0, 0, 0], [0, 0, 0, 0]];
  const B = [[0, 0, 0, 0], [0, 0, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0]];
  assert.notDeepEqual(classical([[1, 1], [0, 1]], [[1, 0], [1, 1]]), classical([[1, 0], [1, 1]], [[1, 1], [0, 1]]));
  for (const matrix of [A, B]) { matrix.forEach(Object.freeze); Object.freeze(matrix); }
  const trace = buildStrassenTrace({ A, B });
  assert.deepEqual(trace.at(-1).result, [[2, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  assert.equal(trace.at(-1).scalarMultiplications, 49);
});

const sourceProductTerms = [
  [[0, 1], [3, 1], [12, 1], [15, 1]], [[8, 1], [12, 1]], [[1, 1], [3, -1]],
  [[14, 1], [12, -1]], [[3, 1], [7, 1]], [[8, 1], [9, 1], [0, -1], [1, -1]],
  [[6, 1], [7, 1], [14, -1], [15, -1]]
];
const sourceOutputs = [
  { contributions: [[0, 1], [3, 1], [4, -1], [6, 1]], survivors: [0, 6], occurrences: 12, pairs: 5 },
  { contributions: [[2, 1], [4, 1]], survivors: [1, 7], occurrences: 4, pairs: 1 },
  { contributions: [[1, 1], [3, 1]], survivors: [8, 14], occurrences: 4, pairs: 1 },
  { contributions: [[0, 1], [2, 1], [1, -1], [5, 1]], survivors: [9, 15], occurrences: 12, pairs: 5 }
];

test("optional formal verification preserves the four source identities without extra trace events or products", () => {
  for (let product = 0; product < 7; product += 1) {
    const expected = Array(16).fill(0);
    for (const [term, coefficient] of sourceProductTerms[product]) expected[term] = coefficient;
    assert.deepEqual(strassenFormalProductTerms(product), expected);
    const changed = strassenFormalProductTerms(product); changed[0] = 123;
    assert.deepEqual(strassenFormalProductTerms(product), expected);
  }
  for (const invalid of [-1, 7, 1.5, "1"]) assert.throws(() => strassenFormalProductTerms(invalid), /index from 0 to 6/);
  const trace = buildStrassenTrace(defaultInput());
  for (const step of trace.filter((entry) => entry.phase === "combine")) {
    const call = activeCall(step), proof = call.proof, expected = sourceOutputs[call.selectedOutput];
    const balances = Array.from({ length: 16 }, () => ({ positive: 0, negative: 0 }));
    assert.deepEqual(proof.contributions.map(({ product, sign }) => [product, sign]), expected.contributions);
    for (const [product, sign] of expected.contributions) {
      for (const [term, coefficient] of sourceProductTerms[product]) balances[term][sign * coefficient > 0 ? "positive" : "negative"] += 1;
    }
    assert.deepEqual(proof.balances, balances);
    assert.deepEqual(balances.map(({ positive, negative }) => positive - negative), Array.from({ length: 16 }, (_, term) => expected.survivors.includes(term) ? 1 : 0));
    assert.equal(balances.reduce((sum, term) => sum + term.positive + term.negative, 0), expected.occurrences);
    assert.equal(balances.reduce((sum, term) => sum + Math.min(term.positive, term.negative), 0), expected.pairs);
    assert.deepEqual(proof.running, blockAt(call.C, call.selectedOutput));
    assert.equal(proof.complete, true);
    assert.equal(step.scalarMultiplications, 7);
  }
  assert.equal(trace.filter((step) => step.phase === "combine").length, 4);
});

test("Strassen parsing gives specific dimension, entry, and matrix-pair errors", () => {
  assert.deepEqual(parseStrassenInput("-1 2;3 0 | 4,5;6,-7"), { A: [[-1, 2], [3, 0]], B: [[4, 5], [6, -7]] });
  assert.deepEqual(parseStrassenInput("0 | -99"), { A: [[0]], B: [[-99]] });
  assert.throws(() => parseStrassenInput("1,2;3,4"), /matrix A \| matrix B/);
  assert.throws(() => parseStrassenInput("1 |"), /matrix A \| matrix B/);
  assert.throws(() => parseStrassenInput("1,2;3 | 1,0;0,1"), /Matrix A must be square/);
  assert.throws(() => parseStrassenInput("1,2,3;4,5,6;7,8,9 | 1"), /size 1, 2, or 4/);
  assert.throws(() => parseStrassenInput("1 | 1,0;0,1"), /same size/);
  for (const value of ["100", "-100", "Infinity", "NaN", "1.5", "1e1"]) assert.throws(() => parseStrassenInput(`1 | ${value}`), /Matrix B entries must be integers/);
});

test("facade, pseudocode, descriptions, and metrics agree with the pure canonical engine", () => {
  assert.equal(strassenModule.buildTrace, buildViaFacade);
  assert.equal(strassenModule.input.parse, parseViaFacade);
  assert.deepEqual(strassenModule.pseudocode.map((line) => line.line), Array.from({ length: 15 }, (_, index) => index + 1));
  assert.deepEqual(strassenModule.pseudocode.filter((line) => line.basic).map((line) => line.line), [2]);
  assert.deepEqual(productRules.map((rule) => rule.line), [4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(outputRules.map((rule) => rule.line), [11, 12, 13, 14]);
  for (const rule of productRules) assert.ok(strassenModule.pseudocode.find((line) => line.line === rule.line)?.text.includes(rule.name));
  for (const rule of outputRules) assert.ok(strassenModule.pseudocode.find((line) => line.line === rule.line)?.text.includes(rule.formula));
  assert.equal(validateModule(strassenModule, "07-divide-conquer"), true);
  for (const preset of strassenModule.input.presets) {
    const input = parseStrassenInput(preset.value), beforeInput = structuredClone(input);
    assert.deepEqual(parseViaFacade(preset.value), input);
    const trace = buildStrassenTrace(input);
    assert.deepEqual(trace, buildStrassenTrace(input));
    assert.deepEqual(trace, buildViaFacade(input));
    assert.deepEqual(input, beforeInput);
    const labels = strassenModule.describe(trace[0]).state.map(({ label }) => label);
    assert.equal(new Set(labels).size, labels.length);
    assert.equal(new Set(trace.map((step) => step.calls)).size, trace.length);
    for (let index = 0; index < trace.length; index += 1) {
      const step = trace[index], before = structuredClone(step), description = strassenModule.describe(step);
      assert.deepEqual(description.state.map(({ label }) => label), labels);
      assert.equal(description.summary, step.message);
      assert.equal(stateValue(step, "Scalar multiplications"), String(step.scalarMultiplications));
      assert.deepEqual(strassenModule.metrics(step), [{ label: "Scalar multiplications", value: step.scalarMultiplications, emphasis: true }]);
      assert.deepEqual([description, strassenModule.render(step), strassenModule.model(step)], [strassenModule.describe(step), strassenModule.render(step), strassenModule.model(step)]);
      assert.deepEqual(step, before);
      if (index) {
        const previous = trace[index - 1].calls[0];
        for (const field of ["A", "B", "C", "products"]) assert.notEqual(step.calls[0][field], previous[field]);
        if (step.calls[0].proof && previous.proof) {
          for (const field of ["contributions", "balances", "running"]) assert.notEqual(step.calls[0].proof[field], previous.proof[field]);
          assert.notEqual(step.calls[0].proof.balances[0], previous.proof.balances[0]);
        }
      }
    }
    assert.match(strassenModule.model(trace.at(-1)).latex, /7\^k/);
    assert.doesNotMatch(strassenModule.model(trace.at(-1)).latex, /3\^k/);
  }
});
