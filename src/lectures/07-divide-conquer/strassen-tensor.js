import { productRules, outputRules } from "./strassen-trace.js?v=20261024-4";

// Public tensor arrays use output slices: [c][a][b]. Thus the mathematical
// coefficient T[a,b,c] is stored at tensor[c][a][b]. All three axes have size 4.
const zeros = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Array(4).fill(0)));
const cloneMatrix = (matrix) => matrix.map((row) => [...row]);
const names = ["00", "01", "10", "11"];

export function getStrassenTensorFactors() {
  const U = Array.from({ length: 4 }, (_, a) => productRules.map((rule) => rule.leftCoefficients[a]));
  const V = Array.from({ length: 4 }, (_, b) => productRules.map((rule) => rule.rightCoefficients[b]));
  const W = outputRules.map((rule) => productRules.map((_, product) => {
    const index = rule.products.indexOf(product);
    return index < 0 ? 0 : rule.signs[index];
  }));
  return { order: 3, shape: [4, 4, 4], axisOrder: ["C", "A", "B"], termCount: 7,
    targetRankBound: 7, U, V, W,
    labels: { A: names.map((name) => `A${name}`), B: names.map((name) => `B${name}`),
      C: names.map((name) => `C${name}`), products: productRules.map((rule) => rule.name) } };
}

function validateProduct(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 7) throw new Error("Choose a tensor term index from 0 to 6.");
}
function validateIndices(indices) {
  if (!Array.isArray(indices)) throw new Error("Tensor term indices must be an array.");
  indices.forEach(validateProduct);
  if (new Set(indices).size !== indices.length) throw new Error("Each tensor term may appear only once in a partial decomposition.");
}
function outer(factors, product) {
  return factors.W.map((row) => factors.U.map((a) => factors.V.map((b) => a[product] * b[product] * row[product] || 0)));
}

export function strassenTensorTerm(product) {
  validateProduct(product);
  return outer(getStrassenTensorFactors(), product);
}

export function ordinaryMultiplicationTensor() {
  return Array.from({ length: 4 }, (_, c) => Array.from({ length: 4 }, (_, a) => Array.from({ length: 4 }, (_, b) =>
    Math.floor(a / 2) === Math.floor(c / 2) && b % 2 === c % 2 && a % 2 === Math.floor(b / 2) ? 1 : 0)));
}

function sumTerms(indices, factors) {
  const sum = zeros();
  for (const product of indices) {
    const term = outer(factors, product);
    for (let c = 0; c < 4; c += 1) {
      for (let a = 0; a < 4; a += 1) {
        for (let b = 0; b < 4; b += 1) sum[c][a][b] += term[c][a][b];
      }
    }
  }
  return sum;
}
export function sumStrassenTensorTerms(indices) {
  validateIndices(indices);
  return sumTerms(indices, getStrassenTensorFactors());
}

function occurrenceCounts(indices, factors) {
  const result = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => ({ positive: 0, negative: 0 }))));
  for (const product of indices) {
    const term = outer(factors, product);
    for (let c = 0; c < 4; c += 1) {
      for (let a = 0; a < 4; a += 1) {
        for (let b = 0; b < 4; b += 1) {
          const value = term[c][a][b];
          if (value) result[c][a][b][value > 0 ? "positive" : "negative"] += 1;
        }
      }
    }
  }
  return result;
}
const difference = (target, sum) => target.map((slice, c) => slice.map((row, a) => row.map((value, b) => value - sum[c][a][b])));
const equalTensors = (left, right) => left.every((slice, c) => slice.every((row, a) => row.every((value, b) => value === right[c][a][b])));

/**
 * Project an existing canonical algorithm step; never execute numeric products.
 * A prepared or newly returned scalar term can be previewed in cumulativeAfter,
 * but only matrices already saved in board.products contribute to committedSum.
 * Rank bounds on partial sums apply to those sums, not to the complete target T.
 */
export function projectStrassenTensor(step) {
  const active = step.calls.find((call) => call.id === step.activeCallId);
  if (!active) throw new Error("The tensor projection needs an existing active Strassen call.");
  const board = active.n === 1 && active.parentId ? step.calls.find((call) => call.id === active.parentId) : active;
  if (!board) throw new Error("The active scalar call needs its parent matrix call.");
  const applicable = board.n > 1;
  const selectedIndex = applicable ? active !== board ? active.parentProduct : board.selectedProduct : null;
  if (selectedIndex !== null) validateProduct(selectedIndex);
  const factors = getStrassenTensorFactors();
  const committedIndices = applicable ? board.products.flatMap((value, index) => value === null ? [] : [index]) : [];
  const selectedCommitted = selectedIndex !== null && committedIndices.includes(selectedIndex);
  const beforeIndices = committedIndices.filter((index) => index !== selectedIndex);
  const afterIndices = selectedIndex === null ? [...beforeIndices] : [...beforeIndices, selectedIndex];
  const committedSum = sumTerms(committedIndices, factors);
  const cumulativeBefore = sumTerms(beforeIndices, factors);
  const cumulativeAfter = sumTerms(afterIndices, factors);
  const current = selectedIndex === null ? zeros() : outer(factors, selectedIndex);
  const target = ordinaryMultiplicationTensor();
  const residual = difference(target, committedSum);
  const afterResidual = difference(target, cumulativeAfter);
  const beforeCounts = occurrenceCounts(beforeIndices, factors);
  const afterCounts = occurrenceCounts(afterIndices, factors);
  const committedCounts = occurrenceCounts(committedIndices, factors);
  const storedValue = selectedIndex === null ? null : board.products[selectedIndex];
  const returnedScalar = active !== board && active.C[0][0] !== null ? active.C : null;
  const selectedValue = storedValue ?? returnedScalar;
  const selectedState = selectedIndex === null ? "none" : selectedCommitted ? "retained" : selectedValue ? "computed-pending-retain" : "preview";
  const cells = target.map((slice, c) => slice.map((row, a) => row.map((wanted, b) => {
    const before = beforeCounts[c][a][b];
    const after = afterCounts[c][a][b];
    const saved = committedCounts[c][a][b];
    const cancelledPairCount = Math.min(after.positive, after.negative);
    return { c, a, b, before: cumulativeBefore[c][a][b], incoming: current[c][a][b],
      after: cumulativeAfter[c][a][b], committed: committedSum[c][a][b], target: wanted,
      residual: residual[c][a][b], afterResidual: afterResidual[c][a][b],
      positive: after.positive, negative: after.negative,
      committedPositive: saved.positive, committedNegative: saved.negative,
      cancelledPairCount, newlyCancelledPairCount: cancelledPairCount - Math.min(before.positive, before.negative),
      current: current[c][a][b] !== 0, extra: current[c][a][b] !== 0 && wanted === 0,
      survivor: wanted === 1 && cumulativeAfter[c][a][b] === 1 };
  })));
  return {
    applicable, scope: board.id, n: board.n,
    order: factors.order, shape: [...factors.shape], axisOrder: [...factors.axisOrder], labels: factors.labels,
    termCount: 7, targetRankBound: 7,
    selectedIndex, selectedState, selectedCommitted,
    selectedValue: selectedValue && cloneMatrix(selectedValue),
    leftOperand: selectedIndex !== null && board.operands ? cloneMatrix(board.operands.left) : null,
    rightOperand: selectedIndex !== null && board.operands ? cloneMatrix(board.operands.right) : null,
    destinations: selectedIndex === null ? [] : factors.W.flatMap((row, output) => row[selectedIndex] ? [{ output, name: factors.labels.C[output], coefficient: row[selectedIndex] }] : []),
    u: selectedIndex === null ? null : factors.U.map((row) => row[selectedIndex]),
    v: selectedIndex === null ? null : factors.V.map((row) => row[selectedIndex]),
    w: selectedIndex === null ? null : factors.W.map((row) => row[selectedIndex]),
    outer: current, cumulativeBefore, cumulativeAfter, committedSum, target, residual, afterResidual, cells,
    committedIndices: [...committedIndices], committedTermCount: committedIndices.length, committedRankBound: committedIndices.length,
    beforeIndices: [...beforeIndices], afterIndices: [...afterIndices], beforeTermCount: beforeIndices.length, afterTermCount: afterIndices.length,
    beforeRankBound: beforeIndices.length, afterRankBound: afterIndices.length,
    afterState: selectedIndex !== null && !selectedCommitted ? "preview" : "committed",
    committedMatchesTarget: equalTensors(committedSum, target), afterMatchesTarget: equalTensors(cumulativeAfter, target),
    scalarMultiplications: step.scalarMultiplications, C: cloneMatrix(board.C),
    products: board.products.map((value) => value && cloneMatrix(value))
  };
}
