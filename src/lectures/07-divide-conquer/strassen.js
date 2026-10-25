import { escapeHtml } from "../../core/utils.js";
import { projectStrassenTensor, getStrassenTensorFactors } from "./strassen-tensor.js?v=20261025-1";
import { parseStrassenInput, buildStrassenTrace, strassenFormalProductTerms, productRules, outputRules } from "./strassen-trace.js?v=20261025-1";
export { parseStrassenInput, buildStrassenTrace, strassenFormalProductTerms } from "./strassen-trace.js?v=20261025-1";

const blockNames = ["00", "01", "10", "11"];
const termName = (term) => `A${blockNames[Math.floor(term / 4)]}B${blockNames[term % 4]}`;
const numberText = (value) => String(value).replaceAll("-", "−");
const factorText = (text) => text.includes(" + ") || text.includes(" − ") ? `(${text.replaceAll(" ", "")})` : text;
const productFormula = (rule) => `${factorText(rule.left)}×${factorText(rule.right)}`;
const matrixText = (matrix) => matrix.length === 1 ? String(matrix[0][0] ?? "pending") : `[${matrix.map((row) => row.map((value) => value ?? "?").join(",")).join(";")}]`;
const indexedMatrix = (matrix, name) => matrix.map((row, i) => row.map((value, j) => `${name}[${i},${j}] = ${value === null ? "not computed" : value}`).join("; ")).join("; ");
function focus(step) {
  const active = step.calls.find((call) => call.id === step.activeCallId);
  const board = active.n === 1 && active.parentId ? step.calls.find((call) => call.id === active.parentId) : active;
  return { active, board, product: active !== board ? active.parentProduct : board.selectedProduct };
}
function callPath(step, call) {
  const path = [call];
  while (path[0].parentId) path.unshift(step.calls.find((entry) => entry.id === path[0].parentId));
  return path;
}
function visibleProduct(board, active, index) {
  return board.products[index] ?? (active.parentId === board.id && active.parentProduct === index && active.status === "returned" ? active.C : null);
}
function productDestinations(product) {
  return outputRules.flatMap((rule) => {
    const position = rule.products.indexOf(product);
    return position < 0 ? [] : [`${rule.signs[position] < 0 ? "−" : "+"}M${product + 1} will contribute to ${rule.name}`];
  });
}
function describeStrassen(step) {
  const { active, board, product } = focus(step);
  const tensor = projectStrassenTensor(step);
  const factors = getStrassenTensorFactors();
  const proof = board.proof;
  const source = product === null ? null : productRules[product];
  const target = (output) => outputRules[output].targets.map(termName).join(" + ");
  const numericTargets = board.n === 2 ? outputRules.map((rule) => `${rule.name}: ${rule.targets.map((term) => {
    const a = Math.floor(term / 4), b = term % 4;
    const show = (value) => value < 0 ? `(${value})` : String(value);
    return `${show(board.A[Math.floor(a / 2)][a % 2])} × ${show(board.B[Math.floor(b / 2)][b % 2])}`;
  }).join(" + ")}`).join("; ") : "block identities rather than separate scalar products";
  return {
    summary: step.message,
    state: [
      { label: "Input size n", value: String(step.n) },
      { label: "Tensor scope", value: tensorScope(tensor) },
      { label: "Tensor order and shape", value: "Order 3 means three axes: A entry, B entry, C entry; shape 4×4×4. Seven rank-one terms give the upper bound rank(T) ≤ 7." },
      { label: "Tensor axes", value: "A rows: A00,A01,A10,A11; B columns: B00,B01,B10,B11; C slices: C00,C01,C10,C11" },
      { label: "Current rank-one term", value: !tensor.applicable ? "inactive: scalar base case" : tensor.selectedIndex === null ? "none selected" : `R${tensor.selectedIndex + 1}, paired with M${tensor.selectedIndex + 1}; ${tensor.selectedState}; R[a,b,c] = u[a]·v[b]·w[c]` },
      { label: "Tensor factor u", value: tensor.u ? tensor.u.map((value, index) => `A${blockNames[index]} coefficient: ${value}`).join("; ") : "none selected" },
      { label: "Tensor factor v", value: tensor.v ? tensor.v.map((value, index) => `B${blockNames[index]} coefficient: ${value}`).join("; ") : "none selected" },
      { label: "Tensor factor w", value: tensor.w ? tensor.w.map((value, index) => `C${blockNames[index]} output coefficient: ${value}`).join("; ") : "none selected" },
      { label: "Tensor coefficient interpretation", value: "Every nonzero vector coefficient is boxed, including negative coefficients. These positions select all input entries or blocks in u·A and v·B, and all output destinations in w. Zero coefficients are not boxed. The tensor-cell example below uses one coefficient from each vector." },
      { label: "Tensor retained terms", value: tensor.applicable ? `${tensor.committedTermCount}/7 retained: ${tensor.committedIndices.map((index) => `M${index + 1}/R${index + 1}`).join(", ") || "none"}; ${tensor.committedMatchesTarget ? "retained sum equals target T" : "retained sum is still partial"}` : "inactive: scalar base case" },
      { label: "Tensor factor matrices U V W", value: `Columns correspond to M1…M7. ${[["U", factors.U], ["V", factors.V], ["W", factors.W]].map(([name, matrix]) => `${name}: ${matrix.map((row, index) => `${blockNames[index]}=[${row.join(",")}]`).join("; ")}`).join(" | ")}` },
      { label: "Tensor transition status", value: !tensor.applicable ? "inactive: scalar base case" : tensor.selectedIndex === null ? "no incoming term; retained sum displayed" : tensor.selectedCommitted ? "incoming term is retained; marked cancellations have occurred in S" : "incoming term is a coefficient preview; proposed after values and cancellation examples apply on retain; displayed S remains the saved sum" },
      { label: "Tensor numeric connection", value: !tensor.applicable || tensor.selectedIndex === null ? "none selected" : `M${tensor.selectedIndex + 1} = (u·A)(v·B); ${tensor.leftOperand ? indexedMatrix(tensor.leftOperand, "u·A") : "left operand pending"}; ${tensor.rightOperand ? indexedMatrix(tensor.rightOperand, "v·B") : "right operand pending"}; ${tensor.selectedValue ? indexedMatrix(tensor.selectedValue, `M${tensor.selectedIndex + 1}`) : "numeric product pending"}; ${tensor.destinations.map(({ name, coefficient }) => `${coefficient}·M${tensor.selectedIndex + 1} contributes to ${name}`).join("; ")}` },
      { label: "Tensor selected cell", value: tensorCellEquation(tensor) },
      { label: "Tensor cancellation", value: tensorCancellation(tensor) },
      { label: "Original A", value: indexedMatrix(step.A, "A") },
      { label: "Original B", value: indexedMatrix(step.B, "B") },
      { label: "Active call", value: `${active.id}, size ${active.n}, ${active.status}` },
      { label: "Call path", value: callPath(step, active).map((call) => `${call.id} (${call.n} × ${call.n})`).join(" → ") },
      { label: "Focus call", value: `${board.id}, size ${board.n}` },
      { label: "Focus A", value: indexedMatrix(board.A, `${board.id}.A`) },
      { label: "Focus B", value: indexedMatrix(board.B, `${board.id}.B`) },
      { label: "Block index convention", value: board.n === 1 ? "scalar base case; no blocks" : `00 upper left, 01 upper right, 10 lower left, 11 lower right; each Aij, Bij, Cij is ${board.n / 2} by ${board.n / 2}` },
      { label: "Algorithm stage", value: board.n === 1 ? "scalar base case" : ["combine", "return", "complete"].includes(step.phase) ? "Combine the saved products into C00,C01,C10,C11" : product === null ? "Split A and B into four blocks" : "Compute M1,M2,M3,M4,M5,M6,M7 in source order" },
      { label: "Selected product", value: product === null ? "none" : `M${product + 1} in ${board.id}` },
      { label: "Source blocks", value: source ? `Left operand: ${source.left}; right operand: ${source.right}` : "none" },
      { label: "Formed operands", value: board.operands ? `${indexedMatrix(board.operands.left, "Left")}; ${indexedMatrix(board.operands.right, "Right")}` : "not formed at this step" },
      { label: "Current formula", value: board.formula },
      { label: "Seven product formulas", value: board.n === 1 ? "not used in the scalar base case" : productRules.map((rule) => `${rule.name} = ${productFormula(rule)}`).join("; ") },
      { label: "Retained products in focus", value: board.n === 1 ? "none: scalar base case" : board.products.map((matrix, index) => `M${index + 1}: ${matrix ? indexedMatrix(matrix, `M${index + 1}`) : "not returned"}`).join("; ") },
      { label: "Displayed product values", value: board.n === 1 ? "none: scalar base case" : productRules.map((rule, index) => {
        const value = visibleProduct(board, active, index);
        return `${rule.name}: ${value ? `${matrixText(value)}${board.products[index] === null ? "; child returned, awaiting retention" : "; saved"}` : "pending"}`;
      }).join("; ") },
      { label: "Planned product destinations", value: product === null ? "none: no product selected" : productDestinations(product).join("; ") },
      { label: "Focus output C", value: indexedMatrix(board.C, `${board.id}.C`) },
      { label: "Output block this step", value: board.selectedOutput === null ? "none" : outputRules[board.selectedOutput].name },
      { label: "Four output formulas", value: outputRules.map((rule) => `${rule.name} = ${rule.formula}`).join("; ") },
      { label: "Row by column targets", value: outputRules.map((rule, index) => `${rule.name} = ${target(index)}`).join("; ") },
      { label: "Concrete row by column targets", value: `${numericTargets}; identities only, no new products` },
      { label: "Formal term balances", value: proof ? proof.balances.map(({ positive, negative }, term) => `${termName(term)}: ${positive} positive, ${negative} negative, net ${positive - negative}`).join("; ") : "none: no completed output verification yet" },
      { label: "Uncancelled formal terms", value: proof ? proof.balances.flatMap(({ positive, negative }, term) => positive === negative ? [] : [`${positive > negative ? "+" : "−"}${termName(term)}`]).join(" ") : "none" },
      { label: "Target formal terms", value: proof ? target(proof.output) : "none: no output selected" },
      { label: "Running subtotal", value: proof ? `complete; ${indexedMatrix(proof.running, "Subtotal")}` : "none: outputs are written only after all seven products return" },
      { label: "Formal expansion scope", value: "Supporting ordered A-block × B-block identities only; no extra numeric products are evaluated" },
      { label: "Scalar calculation", value: active.n === 1 && active.C[0][0] !== null ? active.formula : "not executed at this step" },
      { label: "Call relationships", value: step.calls.map((call) => `${call.id}: ${call.parentId ? `child of ${call.parentId}, returns M${call.parentProduct + 1}` : "root"}; size ${call.n}; ${call.status}`).join(" | ") },
      { label: "Returned matrices", value: step.calls.filter((call) => call.status === "returned").map((call) => indexedMatrix(call.C, `${call.id}.C`)).join("; ") || "none" },
      { label: "Final C", value: step.result ? indexedMatrix(step.result, "C") : "not returned" },
      { label: "Current tensor coefficients", value: tensor.applicable ? tensorEntries(tensor.outer, "R") : "inactive: scalar base case" },
      { label: "Retained tensor coefficients", value: tensor.applicable ? tensorEntries(tensor.committedSum, "S") : "inactive: scalar base case" },
      { label: "Target tensor coefficients", value: tensorEntries(tensor.target, "T") },
      { label: "Tensor residual", value: tensor.applicable ? tensorEntries(tensor.residual, "T−S") : "inactive: scalar base case" },
      { label: "Tensor cell transitions", value: tensor.applicable ? tensor.cells.flat(2).map((cell) => `A${blockNames[cell.a]},B${blockNames[cell.b]},C${blockNames[cell.c]}: before ${cell.before}, incoming ${cell.incoming}, proposed after ${cell.after}, retained ${cell.committed}, target ${cell.target}; positive ${cell.positive}, negative ${cell.negative}, newly cancelled pairs ${cell.newlyCancelledPairCount}`).join("; ") : "inactive: scalar base case" },
      { label: "Scalar multiplications", value: String(step.scalarMultiplications) }
    ]
  };
}
function matrixDrawing(matrix, label, { selected = null, counted = false } = {}) {
  const columns = matrix[0].length;
  const scalar = columns === 1 && matrix.length === 1;
  const longest = Math.max(...matrix.flat().map((value) => String(value ?? "?").length + (scalar && value < 0 ? 2 : 0)));
  const width = Math.max(20, longest * 7.9 + 5);
  const h = matrix.length / 2;
  return `<div class="dc-strassen-matrix-box ${counted ? "is-counted" : ""}"><small>${escapeHtml(label)}</small><div class="dc-strassen-matrix ${scalar ? "is-scalar" : ""}" style="--dc-cols:${columns};--dc-cell:${width}px">${matrix.flatMap((row, i) => row.map((value, j) => {
    const quadrant = (i >= h ? 2 : 0) + (j >= h ? 1 : 0);
    return `<span class="${matrix.length === 4 && i === 2 ? "has-top-split" : ""} ${columns === 4 && j === 2 ? "has-left-split" : ""} ${selected === quadrant ? "is-current" : ""} ${value !== null ? "is-known" : ""}" role="group" aria-label="${escapeHtml(`${label}[${i},${j}] = ${value === null ? "not computed" : value}`)}">${value === null ? "?" : scalar && value < 0 ? `(${numberText(value)})` : numberText(value)}</span>`;
  })).join("")}</div></div>`;
}
function tensorEntries(values, name) {
  return values.flatMap((slice, c) => slice.flatMap((row, a) => row.map((value, b) => `${name}[A${blockNames[a]},B${blockNames[b]},C${blockNames[c]}]=${value}`))).join("; ");
}
function tensorScope(p) {
  return !p.applicable ? "scalar base case; no tensor step" : `${p.scope}: local 2×2 ${p.n === 4 ? "block template; each axis item is a 2×2 block" : "scalar template; each axis item is one matrix entry"}`;
}
function tensorFactorHeading(p, board, kind, values) {
  const symbol = kind === "u" ? "A" : kind === "v" ? "B" : "C";
  if (values === null) return `${kind}(${symbol})`;
  if (kind === "w") return "w routes M";
  if (board.n !== 2) return `${kind}·${symbol}: block sum`;
  const expression = productRules[p.selectedIndex][kind === "u" ? "left" : "right"];
  const matrix = kind === "u" ? board.A : board.B;
  const concrete = expression.replace(/[AB][01]{2}/g, (entry) => {
    const value = matrix[Number(entry[1])][Number(entry[2])];
    return value < 0 ? `(${value})` : String(value);
  }).replaceAll(" ", "");
  const operand = kind === "u" ? p.leftOperand : p.rightOperand;
  return `${kind}·${symbol}: ${concrete}${operand ? `=${operand[0][0]}` : ""}`;
}
function tensorVectors(p, board) {
  return `<div class="dc-tensor-vectors">${[["u", p.u], ["v", p.v], ["w", p.w]].map(([kind, values]) => `<div class="dc-tensor-vector" data-factor="${kind}"><strong>${escapeHtml(tensorFactorHeading(p, board, kind, values))}</strong><div>${(values ?? [null, null, null, null]).map((value, index) => `<span class="${value ? "is-nonzero is-included" : ""}" data-index="${index}" role="group" aria-label="${kind}[${blockNames[index]}] coefficient = ${value === null ? "not selected" : value}; ${value ? "included, boxed" : "not included"}"><small>${blockNames[index]}</small><b>${value === null ? "—" : value}</b></span>`).join("")}</div></div>`).join("")}</div>`;
}
function tensorNumericLink(p) {
  if (p.selectedIndex === null) return `<div class="dc-tensor-numeric-empty">${p.committedMatchesTarget ? "S = T: seven rank-one terms; rank(T) ≤ 7." : "Step to preview each rank-one term."}</div>`;
  const current = `M${p.selectedIndex + 1}`;
  const value = p.selectedValue ? matrixText(p.selectedValue) : "pending";
  const operands = p.leftOperand && p.rightOperand ? `${matrixText(p.leftOperand)} × ${matrixText(p.rightOperand)}` : "formed operands pending";
  const routes = p.destinations.map(({ name, coefficient }) => `${coefficient < 0 ? "−" : "+"}${current} → ${name}`).join("; ");
  return `<div class="dc-tensor-numeric-scroll" data-visual-scroll><div class="dc-tensor-numeric"><strong>${current} = ${escapeHtml(operands)} = ${escapeHtml(value)}</strong><span>${routes}</span></div></div>`;
}
function tensorSlices(p) {
  const example = tensorExampleCell(p);
  return `<div class="dc-tensor-slices">${p.cells.map((slice, c) => `<section class="dc-tensor-slice" data-slice-c="${c}" aria-label="C${blockNames[c]} coefficient slice"><h3>C${blockNames[c]} <small>w = ${p.w === null ? "—" : p.w[c]}</small></h3><div class="dc-tensor-plane"><span class="dc-tensor-axis-corner">A/B</span>${blockNames.map((name, b) => `<span class="dc-tensor-b-index" data-b-header="${b}">${name}</span>`).join("")}${slice.map((row, a) => `<span class="dc-tensor-a-index" data-a-header="${a}">${blockNames[a]}</span>${row.map((cell, b) => {
    const cancelled = p.selectedCommitted && cell.newlyCancelledPairCount > 0;
    const extra = cell.committed !== 0 && cell.target === 0;
    const classes = ["dc-tensor-cell", cell.target ? "is-target" : "", cell.current ? "has-current" : "", extra ? "has-extra" : "", cancelled ? "has-cancelled" : "", example === cell ? "is-example" : "", cell.committed === 1 && cell.target === 1 ? "has-survivor" : ""].filter(Boolean).join(" ");
    const label = `Coefficient A${blockNames[a]}, B${blockNames[b]}, C${blockNames[c]}: before ${cell.before}, incoming ${cell.incoming}, proposed after ${cell.after}; retained sum ${cell.committed}; target ${cell.target}; ${cell.newlyCancelledPairCount} new opposite pairs${p.selectedCommitted ? " retained" : " on retain"}.`;
    return `<div class="${classes}" role="group" aria-label="${escapeHtml(label)}" data-a="${a}" data-b="${b}" data-c="${c}"><span class="dc-tensor-term" data-kind="term" aria-hidden="true">${cell.incoming > 0 ? "+" : ""}${cell.incoming}</span><span class="dc-tensor-sum-band" aria-hidden="true">${cancelled ? '<span class="dc-tensor-cancel-mark">×</span>' : ""}<span class="dc-tensor-sum" data-kind="sum">${cell.committed}</span></span></div>`;
  }).join("")}`).join("")}</div></section>`).join("")}</div>`;
}
function tensorExampleCell(p) {
  if (!p.applicable || p.selectedIndex === null) return null;
  return p.cells.flat(2).find((cell) => cell.newlyCancelledPairCount > 0) ?? p.cells.flat(2).find((cell) => cell.current) ?? null;
}
function tensorCellEquation(p) {
  if (!p.applicable) return "inactive: scalar base case";
  const cell = tensorExampleCell(p);
  if (!cell) return "none selected";
  const signed = (value) => value < 0 ? `(${value})` : String(value);
  return `R${p.selectedIndex + 1}[A${blockNames[cell.a]},B${blockNames[cell.b]},C${blockNames[cell.c]}] = ${signed(p.u[cell.a])}·${signed(p.v[cell.b])}·${signed(p.w[cell.c])} = ${cell.incoming}`;
}
function tensorCancellation(p) {
  if (!p.applicable) return "inactive: scalar base case";
  const cancelled = p.cells.flat(2).filter((cell) => cell.newlyCancelledPairCount > 0);
  if (cancelled.length) {
    const cell = cancelled[0];
    return `${p.selectedCommitted ? "S" : "On retain, S"}: ${cell.before} + (${cell.incoming}) = ${cell.after}; ${cancelled.length} ${cancelled.length === 1 ? "pair" : "pairs"} ${p.selectedCommitted ? "cancelled" : "cancel"}.`;
  }
  if (p.selectedIndex !== null) {
    const cell = tensorExampleCell(p);
    if (cell) return `${p.selectedCommitted ? "S" : "On retain, S"}: ${cell.before} + (${cell.incoming}) = ${cell.after}; no cancellation.`;
  }
  return "Target T: eight outlined +1 coefficients; all other target coefficients are 0.";
}
function renderStrassen(step) {
  const { active, board } = focus(step);
  const p = projectStrassenTensor(step);
  if (!p.applicable) return `<div class="dc-strassen-board dc-tensor-base"><h3>Scalar base case · n = 1</h3><div class="dc-strassen-operands">${matrixDrawing(board.A, "A")}<span>×</span>${matrixDrawing(board.B, "B")}<span>=</span>${matrixDrawing(board.C, "C", { counted: step.phase === "multiply" })}</div><p>The three-way tensor template applies at the 2×2 split.</p></div>`;
  const state = p.selectedIndex === null ? "no current term" : p.selectedState === "retained" ? "retained" : p.selectedState === "computed-pending-retain" ? "computed, not saved" : "preview";
  return `<div class="dc-strassen-board dc-tensor-board" data-tensor-scope="${escapeHtml(p.scope)}"><div class="dc-tensor-top"><div class="dc-tensor-heading"><strong>Order 3 · 4×4×4</strong><span>${p.scope} · ${p.n === 4 ? "2×2 blocks" : "scalar entries"}</span></div>
    <div class="dc-tensor-rail">${productRules.map((rule, index) => `<span class="${p.selectedIndex === index ? "is-current" : ""} ${p.committedIndices.includes(index) ? "is-retained" : ""}" role="group" aria-label="${rule.name}: ${p.committedIndices.includes(index) ? "retained" : p.selectedIndex === index ? state : "pending"}">${p.committedIndices.includes(index) ? "✓" : ""}${rule.name}</span>`).join("")}</div>
    </div><div class="dc-tensor-definition">T[a,b,c]: coefficient of A[a]B[b] in C[c].</div>
    <div class="dc-tensor-current-label">${p.selectedIndex === null ? "Each R = u ⊗ v ⊗ w is rank one." : `Rank-one R${p.selectedIndex + 1} = u ⊗ v ⊗ w · M${p.selectedIndex + 1} ${state}`}</div>
    ${tensorVectors(p, board)}${tensorNumericLink(p)}
    <div class="dc-tensor-band-key"><span>${p.selectedIndex === null ? "Top: no current R · bottom S" : "Top R · bottom saved S"}</span><span>A↓ B→ · C slices</span></div>
    ${tensorSlices(p)}
    <div class="dc-tensor-goal-key"><span class="dc-tensor-target-key">Target: 1 in 8 outlined cells; 0 elsewhere.</span><span>× cancellation</span></div>
    <div class="dc-tensor-equation">${p.selectedIndex === null ? "S adds the saved R terms; all seven give T." : `${escapeHtml(tensorCellEquation(p))}<br>${escapeHtml(tensorCancellation(p))}`}</div>
    <div class="dc-tensor-progress"><strong>${p.committedTermCount}/7 saved${p.committedMatchesTarget ? "; S = T" : ""}</strong><span class="dc-tensor-actual-c">Actual C = ${escapeHtml(matrixText(board.C))}</span></div>
  </div>`;
}

export const strassenModule = {
  id: "strassen", shortTitle: "Strassen", title: "Strassen’s Matrix Multiplication",
  summary: "See the three-way multiplication tensor reconstructed from Strassen's seven rank-one terms while tracing the canonical algorithm.",
  complexity: "Scalar multiplication count n^(log₂ 7)",
  source: { slides: "68–73" },
  objective: "Trace the seven recursive products and the four source output formulas while counting scalar base multiplications.",
  codeTitle: "Strassen algorithm",
  codeLayout: "expanded",
  input: {
    label: "Matrix A | matrix B",
    hint: "Use ; between rows and commas between entries, then | between A and B. Equal square sizes 1, 2, or 4; integers −99 to 99.",
    default: "1,2;3,4 | 5,6;7,8",
    presets: [
      { label: "2 × 2 example", value: "1,2;3,4 | 5,6;7,8" },
      { label: "4 × 4 blocks", value: "1,2,0,1;0,1,3,0;2,0,1,1;1,1,0,2 | 1,0,2,1;2,1,0,0;0,3,1,2;1,0,1,1" },
      { label: "Zero matrix", value: "0,0;0,0 | 5,6;7,8" },
      { label: "Scalar base case", value: "3 | 4" }
    ],
    parse: parseStrassenInput
  },
  pseudocode: [
    { line: 1, text: "Strassen(A, B), square matrices of size n" },
    { line: 2, text: "if n = 1 return [A[0,0] · B[0,0]]", indent: 1, basic: true, basicLabel: "scalar multiplication" },
    { line: 3, text: "split A and B into 00, 01, 10, 11 blocks", indent: 1 },
    ...[...productRules.map((rule, index) => ({ line: rule.line, text: `M${index + 1} ← Strassen(${rule.left}, ${rule.right})`, indent: 1 })),
      ...outputRules.map((rule) => ({ line: rule.line, text: `${rule.name} ← ${rule.formula}`, indent: 1 }))].sort((a, b) => a.line - b.line),
    { line: 15, text: "return C assembled from C00, C01, C10, C11", indent: 1 }
  ],
  buildTrace: buildStrassenTrace, render: renderStrassen, describe: describeStrassen,
  metrics: (step) => [{ label: "Scalar multiplications", value: step.scalarMultiplications, emphasis: true }],
  model(step) {
    return {
      latex: step.phase === "complete"
        ? `\\begin{gathered}M(n)=7M(n/2)\\quad(n>1)\\\\M(1)=1,\\quad n=2^k\\\\M(n)=7^k=n^{\\log_2 7}\\\\\\approx n^{2.807},\\quad M(${step.n})=${step.scalarMultiplications}\\end{gathered}`
        : "\\begin{gathered}M(n)=7M(n/2)\\quad(n>1)\\\\M(1)=1\\end{gathered}",
      notes: ["M counts only scalar base multiplications; matrix additions, subtractions, and block assembly are excluded.",
        ...(step.phase === "complete" ? ["Seven retained products supply the four output blocks; the scalar leaves give the multiplication count."] : [])]
    };
  },
  analysis: [
    { term: "Tensor interpretation", value: "Instructor-requested extension: T[a,b,c] is the coefficient of ordered A[a]B[b] in output C[c]. Four A entries, four B entries, and four C entries give an order-3 tensor of shape 4×4×4." },
    { term: "Tensor rank", value: "Each of the seven source products supplies u⊗v⊗w, a rank-one tensor. Their sum equals T, establishing rank(T)≤7; the display does not prove minimality or call the ordinary eight terms rank 8." },
    { term: "Tensor preview", value: "Current-term coefficients can be previewed before the numeric product returns. The retained tensor sum changes only when the algorithm saves that product; numeric C remains pending until the canonical output assignments." },
    { term: "Tensor block scope", value: "At n=4, the displayed 4×4×4 tensor is the local two-by-two block template with 2×2 matrix blocks. It is not the full 16×16×16 scalar tensor of a 4×4 product." },
    { term: "Input size", value: "n is the matrix dimension; n = 1, 2, or 4 here, with the lecture model using powers of two." },
    { term: "Counted operation", value: "One scalar multiplication at n=1, including zero operands; additions, subtractions, and assembly add no count." },
    { term: "Source procedure", value: "Executable recursive sequence reconstructed from the seven product formulas and four output formulas on slides 68–71; the deck supplies no pseudocode." },
    { term: "Formal expansion", value: "The full text state retains ordered A-block × B-block identities for completed outputs. This supporting verification evaluates no extra numeric products; factor order is preserved." },
    { term: "Numeric examples", value: "The deck uses symbolic matrices. All numeric presets are authored instantiations of its formulas." },
    { term: "Analysis scope", value: "M(n)=7M(n/2), M(1)=1 counts scalar products rather than all work. The source compares seven versus eight multiplications for 2×2 matrices." },
    { term: "Source convention", value: "Use 7ᵏ throughout slide 73's substitution; its intermediate 3ᵏ conflicts with the stated recurrence and final result." }
  ]
};
