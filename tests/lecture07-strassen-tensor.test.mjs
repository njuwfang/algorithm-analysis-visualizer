import test from "node:test";
import assert from "node:assert/strict";
import { buildStrassenTrace } from "../src/lectures/07-divide-conquer/strassen-trace.js";
import {
  getStrassenTensorFactors, ordinaryMultiplicationTensor, strassenTensorTerm,
  sumStrassenTensorTerms, projectStrassenTensor
} from "../src/lectures/07-divide-conquer/strassen-tensor.js";

const expectedU = [[1, 0, 0, 1], [0, 0, 1, 1], [1, 0, 0, 0], [0, 0, 0, 1], [1, 1, 0, 0], [-1, 0, 1, 0], [0, 1, 0, -1]];
const expectedV = [[1, 0, 0, 1], [1, 0, 0, 0], [0, 1, 0, -1], [-1, 0, 1, 0], [0, 0, 0, 1], [1, 1, 0, 0], [0, 0, 1, 1]];
const expectedW = [[1, 0, 0, 1], [0, 0, 1, -1], [0, 1, 0, 1], [1, 0, 1, 0], [-1, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0]];
const zeros = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Array(4).fill(0)));
const input = { A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]] };
const active = (step) => step.calls.find((call) => call.id === step.activeCallId);

// Build the eight ordinary products by their original i,k,j indices rather
// than reusing the implementation's coefficient condition or output rules.
function ordinaryOracle() {
  const tensor = zeros();
  for (let i = 0; i < 2; i += 1) {
    for (let k = 0; k < 2; k += 1) {
      for (let j = 0; j < 2; j += 1) tensor[2 * i + j][2 * i + k][2 * k + j] = 1;
    }
  }
  return tensor;
}
function sumOracle(indices) {
  const tensor = zeros();
  for (const r of indices) {
    for (let c = 0; c < 4; c += 1) {
      for (let a = 0; a < 4; a += 1) {
        for (let b = 0; b < 4; b += 1) tensor[c][a][b] += expectedU[r][a] * expectedV[r][b] * expectedW[r][c];
      }
    }
  }
  return tensor;
}

test("the order-three tensor has four coordinates on each axis and seven rank-one factors", () => {
  const factors = getStrassenTensorFactors();
  assert.equal(factors.order, 3);
  assert.deepEqual(factors.shape, [4, 4, 4]);
  assert.deepEqual(factors.axisOrder, ["C", "A", "B"]);
  assert.equal(factors.termCount, 7);
  assert.equal(factors.targetRankBound, 7, "the displayed decomposition supplies an upper bound rather than a lower-bound proof");
  for (let r = 0; r < 7; r += 1) {
    assert.deepEqual(factors.U.map((row) => row[r]), expectedU[r]);
    assert.deepEqual(factors.V.map((row) => row[r]), expectedV[r]);
    assert.deepEqual(factors.W.map((row) => row[r]), expectedW[r]);
    assert.ok(expectedU[r].some(Boolean) && expectedV[r].some(Boolean) && expectedW[r].some(Boolean));
    assert.deepEqual(strassenTensorTerm(r), sumOracle([r]), "each nonzero summand is exactly u outer v outer w");
  }
  assert.deepEqual(factors.labels.A, ["A00", "A01", "A10", "A11"]);
  assert.deepEqual(factors.labels.C, ["C00", "C01", "C10", "C11"]);
});

test("all 64 coefficients of the seven-term sum equal the ordinary multiplication tensor", () => {
  const target = ordinaryOracle();
  assert.deepEqual(ordinaryMultiplicationTensor(), target);
  assert.deepEqual(sumStrassenTensorTerms([0, 1, 2, 3, 4, 5, 6]), target);
  assert.deepEqual(sumStrassenTensorTerms([6, 5, 4, 3, 2, 1, 0]), target);
  assert.equal(target.flat(2).filter((value) => value === 1).length, 8);
  const support = [];
  for (let a = 0; a < 4; a += 1) {
    for (let b = 0; b < 4; b += 1) {
      for (let c = 0; c < 4; c += 1) {
        let coefficient = 0;
        for (let r = 0; r < 7; r += 1) coefficient += expectedU[r][a] * expectedV[r][b] * expectedW[r][c];
        assert.equal(coefficient, target[c][a][b], `T[${a},${b},${c}]`);
        if (coefficient) support.push([a, b, c]);
      }
    }
  }
  assert.deepEqual(support, [[0, 0, 0], [0, 1, 1], [1, 2, 0], [1, 3, 1], [2, 0, 2], [2, 1, 3], [3, 2, 2], [3, 3, 3]]);
});

test("M1 previews eight coefficient positions: two wanted and six extra", () => {
  const trace = buildStrassenTrace(input);
  const prepared = trace.find((step) => step.phase === "prepare");
  const view = projectStrassenTensor(prepared);
  const current = view.cells.flat(2).filter((cell) => cell.current);
  assert.equal(current.length, 8);
  assert.equal(current.filter((cell) => cell.target === 1).length, 2);
  assert.equal(current.filter((cell) => cell.extra).length, 6);
  assert.deepEqual(current.map((cell) => [cell.c, cell.a, cell.b]), [
    [0, 0, 0], [0, 0, 3], [0, 3, 0], [0, 3, 3],
    [3, 0, 0], [3, 0, 3], [3, 3, 0], [3, 3, 3]
  ]);
  assert.deepEqual(view.u, [1, 0, 0, 1]);
  assert.deepEqual(view.v, [1, 0, 0, 1]);
  assert.deepEqual(view.w, [1, 0, 0, 1]);
  assert.deepEqual(view.destinations, [{ output: 0, name: "C00", coefficient: 1 }, { output: 3, name: "C11", coefficient: 1 }]);
});

test("prepared and computed-but-not-retained terms never advance the committed sum or fill C", () => {
  const trace = buildStrassenTrace(input);
  const prepared = projectStrassenTensor(trace.find((step) => step.phase === "prepare"));
  assert.equal(prepared.selectedState, "preview");
  assert.equal(prepared.afterState, "preview");
  assert.deepEqual(prepared.committedIndices, []);
  assert.equal(prepared.committedTermCount, 0);
  assert.equal(prepared.afterTermCount, 1);
  assert.deepEqual(prepared.committedSum, zeros());
  assert.deepEqual(prepared.cumulativeAfter, sumOracle([0]));
  const multiplied = projectStrassenTensor(trace.find((step) => step.phase === "multiply"));
  assert.equal(multiplied.selectedState, "computed-pending-retain");
  assert.equal(multiplied.selectedCommitted, false);
  assert.deepEqual(multiplied.selectedValue, [[65]]);
  assert.equal(multiplied.scalarMultiplications, 1);
  assert.equal(multiplied.committedTermCount, 0);
  const retained = projectStrassenTensor(trace.find((step) => step.phase === "retain"));
  assert.equal(retained.selectedState, "retained");
  assert.equal(retained.afterState, "committed");
  assert.deepEqual(retained.committedIndices, [0]);
  assert.deepEqual(retained.committedSum, sumOracle([0]));
  assert.deepEqual(retained.cumulativeBefore, zeros());
  for (const view of [prepared, multiplied, retained]) assert.ok(view.C.flat().every((value) => value === null));
  const lastMultiply = projectStrassenTensor(trace.filter((step) => step.phase === "multiply").at(-1));
  assert.equal(lastMultiply.committedTermCount, 6);
  assert.equal(lastMultiply.committedMatchesTarget, false);
  assert.equal(lastMultiply.afterMatchesTarget, true, "the algebraic preview may complete T while the numeric product is not yet retained");
  assert.equal(lastMultiply.afterState, "preview");
  const allRetained = projectStrassenTensor(trace.filter((step) => step.phase === "retain").at(-1));
  assert.equal(allRetained.committedTermCount, 7);
  assert.equal(allRetained.committedMatchesTarget, true);
  assert.ok(allRetained.C.flat().every((value) => value === null), "the tensor identity does not evaluate the four numeric output formulas");
});

test("every projection preserves local partial sums, residuals, signed occurrences, and new cancellations", () => {
  const cases = [input, { A: Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => r - c)), B: Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => r === c ? 1 : -1)) }];
  for (const numeric of cases) {
    const trace = buildStrassenTrace(numeric);
    const initialTrace = structuredClone(trace);
    for (const step of trace) {
      const view = projectStrassenTensor(step);
      const board = step.calls.find((call) => call.id === view.scope);
      const indices = board.products.flatMap((matrix, index) => matrix === null ? [] : [index]);
      assert.deepEqual(view.committedIndices, indices);
      assert.equal(view.committedTermCount, indices.length);
      assert.equal(view.committedRankBound, indices.length, "this bound belongs to the partial sum");
      assert.equal(view.targetRankBound, 7, "a partial sum does not establish a smaller rank bound for the target");
      assert.deepEqual(view.committedSum, sumOracle(indices));
      assert.deepEqual(view.cumulativeBefore, sumOracle(view.beforeIndices));
      assert.deepEqual(view.cumulativeAfter, sumOracle(view.afterIndices));
      assert.deepEqual(view.C, board.C);
      assert.equal(view.scalarMultiplications, step.scalarMultiplications);
      let pairs = 0;
      for (const cell of view.cells.flat(2)) {
        const { c, a, b } = cell;
        const counts = (terms) => terms.reduce((result, r) => {
          const value = expectedU[r][a] * expectedV[r][b] * expectedW[r][c];
          if (value > 0) result.positive += 1;
          if (value < 0) result.negative += 1;
          return result;
        }, { positive: 0, negative: 0 });
        const before = counts(view.beforeIndices), after = counts(view.afterIndices);
        assert.equal(cell.positive, after.positive);
        assert.equal(cell.negative, after.negative);
        assert.equal(cell.after, after.positive - after.negative);
        assert.equal(cell.cancelledPairCount, Math.min(after.positive, after.negative));
        assert.equal(cell.newlyCancelledPairCount, Math.min(after.positive, after.negative) - Math.min(before.positive, before.negative));
        assert.equal(cell.current, view.outer[c][a][b] !== 0);
        assert.equal(cell.residual, view.target[c][a][b] - view.committedSum[c][a][b]);
        assert.equal(cell.afterResidual, view.target[c][a][b] - view.cumulativeAfter[c][a][b]);
        pairs += cell.cancelledPairCount;
      }
      if (view.afterTermCount === 7) assert.equal(pairs, 12);
    }
    assert.deepEqual(trace, initialTrace, "projection must not add products, mutate outputs, or change counted events");
  }
  const trace = buildStrassenTrace(cases[1]);
  const rootFirst = projectStrassenTensor(trace.find((step) => step.activeCallId === "R" && step.phase === "retain"));
  assert.equal(rootFirst.n, 4);
  assert.equal(rootFirst.scalarMultiplications, 7);
  assert.equal(rootFirst.committedTermCount, 1, "one returned block product is distinct from its seven scalar leaves");
  const childMultiply = projectStrassenTensor(trace.find((step) => step.phase === "multiply"));
  assert.equal(childMultiply.scope, active(trace.find((step) => step.phase === "multiply")).parentId);
  assert.equal(childMultiply.n, 2);
  assert.equal(childMultiply.committedTermCount, 0);
});

test("zero, negative, and repeated numeric values do not alter tensor coefficients or suppress zero products", () => {
  const traces = [input, { A: [[0, 0], [0, 0]], B: [[0, 0], [0, 0]] }, { A: [[-2, -2], [-2, -2]], B: [[3, 3], [3, 3]] }, { A: [[-99, 99], [99, -99]], B: [[-99, -99], [-99, -99]] }].map(buildStrassenTrace);
  const algebra = (view) => [view.u, view.v, view.w, view.outer, view.cumulativeBefore, view.cumulativeAfter, view.committedSum, view.target, view.residual, view.cells, view.committedIndices];
  for (const trace of traces) {
    assert.equal(trace.length, traces[0].length);
    for (let index = 0; index < trace.length; index += 1) assert.deepEqual(algebra(projectStrassenTensor(trace[index])), algebra(projectStrassenTensor(traces[0][index])));
    const final = projectStrassenTensor(trace.at(-1));
    assert.equal(final.committedTermCount, 7);
    assert.equal(final.scalarMultiplications, 7);
    assert.deepEqual(final.committedSum, ordinaryOracle());
    assert.deepEqual(final.residual, zeros());
  }
  const negativeM1 = projectStrassenTensor(traces[2].find((step) => step.phase === "multiply"));
  assert.deepEqual(negativeM1.selectedValue, [[-24]]);
  assert.deepEqual(negativeM1.w, [1, 0, 0, 1], "output coefficients are not changed to match a numeric product's sign");
  const zeroM1 = projectStrassenTensor(traces[1].find((step) => step.phase === "multiply"));
  assert.deepEqual(zeroM1.selectedValue, [[0]]);
  assert.equal(zeroM1.selectedState, "computed-pending-retain");
});

function freezeDeep(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freezeDeep); Object.freeze(value); }
  return value;
}
test("factor, tensor, and projection results are fresh clones with explicit scalar-base behavior", () => {
  const factors = getStrassenTensorFactors();
  factors.U[0][0] = 99; factors.V[0][0] = 99; factors.W[0][0] = 99; factors.labels.A[0] = "changed";
  assert.equal(getStrassenTensorFactors().U[0][0], 1);
  assert.equal(getStrassenTensorFactors().V[0][0], 1);
  assert.equal(getStrassenTensorFactors().W[0][0], 1);
  assert.equal(getStrassenTensorFactors().labels.A[0], "A00");
  const term = strassenTensorTerm(0); term[0][0][0] = 99;
  assert.equal(strassenTensorTerm(0)[0][0][0], 1);
  const target = ordinaryMultiplicationTensor(); target[0][0][0] = 99;
  assert.equal(ordinaryMultiplicationTensor()[0][0][0], 1);
  const step = freezeDeep(buildStrassenTrace(input).find((entry) => entry.phase === "retain"));
  const before = structuredClone(step), expected = projectStrassenTensor(step), changed = projectStrassenTensor(step);
  changed.u[0] = 99; changed.v[0] = 99; changed.w[0] = 99;
  changed.outer[0][0][0] = 99; changed.cells[0][0][0].after = 99;
  changed.C[0][0] = 99; changed.products[0][0][0] = 99; changed.selectedValue[0][0] = 99;
  changed.leftOperand[0][0] = 99; changed.rightOperand[0][0] = 99; changed.committedIndices.push(6);
  assert.deepEqual(projectStrassenTensor(step), expected);
  assert.deepEqual(step, before);
  const scalar = projectStrassenTensor(buildStrassenTrace({ A: [[3]], B: [[4]] }).at(-1));
  assert.equal(scalar.applicable, false);
  assert.equal(scalar.selectedIndex, null);
  assert.equal(scalar.committedTermCount, 0);
  assert.equal(scalar.scalarMultiplications, 1);
  assert.deepEqual(scalar.C, [[12]]);
  for (const invalid of [-1, 7, 1.5, "0"]) assert.throws(() => strassenTensorTerm(invalid), /index from 0 to 6/);
  assert.throws(() => sumStrassenTensorTerms([0, 0]), /only once/);
  assert.throws(() => sumStrassenTensorTerms([7]), /index from 0 to 6/);
  assert.throws(() => sumStrassenTensorTerms(null), /must be an array/);
  assert.throws(() => projectStrassenTensor({ calls: [], activeCallId: "missing" }), /active Strassen call/);
});
