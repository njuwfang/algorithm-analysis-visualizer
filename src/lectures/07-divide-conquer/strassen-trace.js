const cloneMatrix = (matrix) => matrix.map((row) => [...row]);
const emptyMatrix = (n) => Array.from({ length: n }, () => Array(n).fill(null));
const add = (a, b) => a.map((row, i) => row.map((value, j) => value + b[i][j]));
const subtract = (a, b) => a.map((row, i) => row.map((value, j) => value - b[i][j]));
const quadrants = (matrix) => {
  const h = matrix.length / 2;
  return [0, 1, 2, 3].map((q) => matrix.slice(q >= 2 ? h : 0, q >= 2 ? 2 * h : h)
    .map((row) => row.slice(q % 2 ? h : 0, q % 2 ? 2 * h : h)));
};

const productDefinitions = [
  { left: "A00 + A11", right: "B00 + B11", a: [0, 3], b: [0, 3], leftCoefficients: [1, 0, 0, 1], rightCoefficients: [1, 0, 0, 1], form: (a, b) => [add(a[0], a[3]), add(b[0], b[3])] },
  { left: "A10 + A11", right: "B00", a: [2, 3], b: [0], leftCoefficients: [0, 0, 1, 1], rightCoefficients: [1, 0, 0, 0], form: (a, b) => [add(a[2], a[3]), b[0]] },
  { left: "A00", right: "B01 − B11", a: [0], b: [1, 3], leftCoefficients: [1, 0, 0, 0], rightCoefficients: [0, 1, 0, -1], form: (a, b) => [a[0], subtract(b[1], b[3])] },
  { left: "A11", right: "B10 − B00", a: [3], b: [2, 0], leftCoefficients: [0, 0, 0, 1], rightCoefficients: [-1, 0, 1, 0], form: (a, b) => [a[3], subtract(b[2], b[0])] },
  { left: "A00 + A01", right: "B11", a: [0, 1], b: [3], leftCoefficients: [1, 1, 0, 0], rightCoefficients: [0, 0, 0, 1], form: (a, b) => [add(a[0], a[1]), b[3]] },
  { left: "A10 − A00", right: "B00 + B01", a: [2, 0], b: [0, 1], leftCoefficients: [-1, 0, 1, 0], rightCoefficients: [1, 1, 0, 0], form: (a, b) => [subtract(a[2], a[0]), add(b[0], b[1])] },
  { left: "A01 − A11", right: "B10 + B11", a: [1, 3], b: [2, 3], leftCoefficients: [0, 1, 0, -1], rightCoefficients: [0, 0, 1, 1], form: (a, b) => [subtract(a[1], a[3]), add(b[2], b[3])] }
];
const productLines = [4, 5, 6, 7, 8, 9, 10];

export const productRules = productDefinitions.map((rule, index) => ({ ...rule, index,
  name: `M${index + 1}`, formula: `M${index + 1} = (${rule.left}) × (${rule.right})`, line: productLines[index] }));

// Canonical output indices, identities, and order from slides 68–71.
export const outputRules = [
  { name: "C00", formula: "M1 + M4 − M5 + M7", products: [0, 3, 4, 6], signs: [1, 1, -1, 1], targets: [0, 6], line: 11,
    form: (m) => add(subtract(add(m[0], m[3]), m[4]), m[6]) },
  { name: "C01", formula: "M3 + M5", products: [2, 4], signs: [1, 1], targets: [1, 7], line: 12,
    form: (m) => add(m[2], m[4]) },
  { name: "C10", formula: "M2 + M4", products: [1, 3], signs: [1, 1], targets: [8, 14], line: 13,
    form: (m) => add(m[1], m[3]) },
  { name: "C11", formula: "M1 + M3 − M2 + M6", products: [0, 2, 1, 5], signs: [1, 1, -1, 1], targets: [9, 15], line: 14,
    form: (m) => add(subtract(add(m[0], m[2]), m[1]), m[5]) }
].map((rule, index) => ({ ...rule, sourceFormula: rule.formula, index, row: Math.floor(index / 2), col: index % 2 }));

function validateMatrix(matrix, name) {
  if (!Array.isArray(matrix) || ![1, 2, 4].includes(matrix.length)
      || matrix.some((row) => !Array.isArray(row) || row.length !== matrix.length)) {
    throw new Error(`Matrix ${name} must be square with size 1, 2, or 4; use ; between rows.`);
  }
  if (matrix.some((row) => row.some((value) => !Number.isInteger(value) || Math.abs(value) > 99))) {
    throw new Error(`Matrix ${name} entries must be integers from −99 to 99.`);
  }
}

export function parseStrassenInput(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2 || parts.some((part) => !part.trim())) throw new Error("Use matrix A | matrix B, for example 1,2;3,4 | 5,6;7,8.");
  const matrices = parts.map((part, index) => {
    const matrix = part.trim().split(";").map((row) => row.trim().split(/[\s,]+/).filter(Boolean).map((token) => /^[+-]?\d+$/.test(token) ? Number(token) : NaN));
    validateMatrix(matrix, index ? "B" : "A");
    return matrix;
  });
  if (matrices[0].length !== matrices[1].length) throw new Error("Matrices A and B must have the same size.");
  return { A: matrices[0], B: matrices[1] };
}

// Coefficients of formal ordered A-block × B-block terms; never numeric products.
export function strassenFormalProductTerms(product) {
  const rule = productRules[product];
  if (!Number.isInteger(product) || !rule) throw new Error("Choose a product index from 0 to 6.");
  return rule.leftCoefficients.flatMap((a) => rule.rightCoefficients.map((b) => a * b || 0));
}

// Optional symbolic verification attached to a completed write. It never
// evaluates the sixteen numeric monomials or adds an event to the algorithm.
function outputProof(output, value) {
  const rule = outputRules[output];
  const balances = Array.from({ length: 16 }, () => ({ positive: 0, negative: 0 }));
  const contributions = rule.products.map((product, index) => ({ product, sign: rule.signs[index] }));
  for (const { product, sign } of contributions) {
    strassenFormalProductTerms(product).forEach((coefficient, term) => {
      const signed = sign * coefficient;
      if (signed) balances[term][signed > 0 ? "positive" : "negative"] += 1;
    });
  }
  return { output, contributions, balances, running: cloneMatrix(value), complete: true };
}
function copyCall(call) {
  return { ...call, A: cloneMatrix(call.A), B: cloneMatrix(call.B), C: cloneMatrix(call.C),
    products: call.products.map((matrix) => matrix && cloneMatrix(matrix)),
    operands: call.operands && { left: cloneMatrix(call.operands.left), right: cloneMatrix(call.operands.right) },
    proof: call.proof && { ...call.proof, contributions: call.proof.contributions.map((item) => ({ ...item })),
      balances: call.proof.balances.map((item) => ({ ...item })), running: cloneMatrix(call.proof.running) } };
}

export function buildStrassenTrace({ A, B }) {
  validateMatrix(A, "A");
  validateMatrix(B, "B");
  if (A.length !== B.length) throw new Error("Matrices A and B must have the same size.");
  const calls = [];
  const trace = [];
  let scalarMultiplications = 0;
  function createCall(left, right, id, parentId = null, parentProduct = null, depth = 0) {
    const call = { id, scope: id, parentId, parentProduct, depth, n: left.length,
      A: cloneMatrix(left), B: cloneMatrix(right), C: emptyMatrix(left.length),
      products: Array(7).fill(null), selectedProduct: null, selectedOutput: null,
      operands: null, proof: null, status: "ready", formula: "not evaluated",
      scalarStart: scalarMultiplications, scalarMultiplications: 0 };
    calls.push(call);
    return call;
  }
  const root = createCall(A, B, "R");
  function emit(call, phase, activeLine, message) {
    for (const entry of calls) {
      if (entry.status !== "returned" || entry === call) entry.scalarMultiplications = scalarMultiplications - entry.scalarStart;
    }
    trace.push({ n: A.length, A: cloneMatrix(A), B: cloneMatrix(B), calls: calls.map(copyCall),
      activeCallId: call.id, scalarMultiplications, phase, activeLine, message,
      activeLabel: phase === "ready" ? "Ready" : phase === "complete" ? "Generalize" : undefined,
      result: phase === "complete" ? cloneMatrix(root.C) : null });
  }
  emit(root, "ready", null, A.length === 1
    ? "Multiply the two scalar entries directly using one scalar multiplication."
    : `Multiply two ${A.length} × ${A.length} matrices using Strassen's seven products.`);
  function multiply(call) {
    call.status = "active";
    emit(call, "call", 1, `Enter ${call.id}: multiply two ${call.n} × ${call.n} matrices${call.parentId ? ` to obtain M${call.parentProduct + 1} for ${call.parentId}` : ""}.`);
    if (call.n === 1) {
      call.C[0][0] = call.A[0][0] * call.B[0][0] || 0;
      call.formula = `${call.A[0][0]} × ${call.B[0][0]} = ${call.C[0][0]}`;
      scalarMultiplications += 1;
      call.status = "returned";
      emit(call, "multiply", 2, `${call.id}: multiply ${call.A[0][0]} by ${call.B[0][0]} and return ${call.C[0][0]}; count one scalar multiplication.`);
      return cloneMatrix(call.C);
    }
    const a = quadrants(call.A);
    const b = quadrants(call.B);
    call.status = "split";
    call.formula = `A00, A01, A10, A11 and B00, B01, B10, B11 are ${call.n / 2} × ${call.n / 2} blocks`;
    emit(call, "split", 3, `Split A and B into their 00, 01, 10, and 11 blocks of size ${call.n / 2} × ${call.n / 2}.`);
    for (const rule of productRules) {
      const [left, right] = rule.form(a, b);
      call.selectedProduct = rule.index;
      call.operands = { left: cloneMatrix(left), right: cloneMatrix(right) };
      call.formula = rule.formula;
      call.status = "forming operands";
      emit(call, "prepare", rule.line, `Form ${rule.name}'s operands: (${rule.left}) and (${rule.right}); multiply them recursively.`);
      call.status = `waiting for ${rule.name}`;
      const child = createCall(left, right, `${call.id}.${rule.name}`, call.id, rule.index, call.depth + 1);
      call.products[rule.index] = multiply(child);
      call.status = "active";
      emit(call, "retain", rule.line, `${rule.name} returns to ${call.id}; save its value for the output formulas.`);
    }
    call.selectedProduct = null;
    call.operands = null;
    for (const rule of outputRules) {
      const block = rule.form(call.products);
      const h = call.n / 2;
      for (let row = 0; row < h; row += 1) {
        for (let col = 0; col < h; col += 1) call.C[rule.row * h + row][rule.col * h + col] = block[row][col];
      }
      call.selectedOutput = rule.index;
      call.status = "combining";
      call.formula = `${rule.name} = ${rule.formula}`;
      call.proof = outputProof(rule.index, block);
      emit(call, "combine", rule.line, `Form ${rule.name} = ${rule.formula} from the saved products.`);
    }
    call.selectedOutput = null;
    call.status = "returned";
    call.formula = "C = A × B";
    emit(call, "return", 15, `Return the completed ${call.n} × ${call.n} matrix C from ${call.id}.`);
    return cloneMatrix(call.C);
  }
  multiply(root);
  emit(root, "complete", null, `Return C = A × B after ${scalarMultiplications} scalar multiplications.`);
  return trace;
}
