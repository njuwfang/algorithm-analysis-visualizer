import { escapeHtml } from "../../core/utils.js";
import { relativeBarHeights } from "../../core/sort-bars.js";

export function indexedRun(values, name) {
  return values.length ? values.map((value, index) => `${name}[${index}] = ${value === null ? "empty" : value}`).join("; ") : "empty";
}

export function describeMergeState(step) {
  const active = step.i !== null;
  const finished = step.phase === "tail" || step.phase === "complete";
  const head = (name, index, values) => !active ? "none; no merge is active" : index < values.length ? `${name}[${index}] = ${values[index]}${finished ? `; source pointer retained, ${name}[${index}..${values.length - 1}] has already been copied` : ""}` : `exhausted; ${name === "B" ? "i = p" : "j = q"} = ${index}`;
  return [
    { label: "Run B", value: indexedRun(step.B, "B") },
    { label: "Run C", value: indexedRun(step.C, "C") },
    { label: "Run sizes", value: active ? `p = ${step.B.length}; q = ${step.C.length}` : "none; no merge is active" },
    { label: "Left head i", value: head("B", step.i, step.B) },
    { label: "Right head j", value: head("C", step.j, step.C) },
    { label: "Loop output index k", value: active ? `k = ${step.k}${step.phase === "tail" || step.phase === "complete" ? "; start of the remainder-copy range" : ""}` : "none; no merge is active" },
    { label: "Output A", value: indexedRun(step.A, "A") },
    { label: "Written output prefix", value: step.A.some((value) => value !== null) ? `A[0..${step.A.filter((value) => value !== null).length - 1}] is in nondecreasing order` : "empty" },
    { label: "Comparison this step", value: step.comparison ? `B[${step.comparison.i}] = ${step.comparison.left} ≤ C[${step.comparison.j}] = ${step.comparison.right} is ${step.comparison.takeLeft ? "true" : "false"}` : "not evaluated" },
    { label: "Copies this step", value: step.moves.length ? step.moves.map((move) => `${move.run}[${move.from}] = ${move.value} → A[${move.to}]`).join("; ") : "none" },
    { label: "Output key origins", value: step.AOrigins.some((origin) => origin !== null) ? step.AOrigins.map((origin, index) => origin === null ? null : `A[${index}] ← ${origin}`).filter(Boolean).join("; ") : "none" },
    { label: "Key comparisons", value: String(step.comparisons) }
  ];
}

function mergeRelation(step) {
  if (step.comparison) return `${step.comparison.left} ≤ ${step.comparison.right}: ${step.comparison.takeLeft ? "true · take B" : "false · take C"}`;
  if (step.phase === "take") { const move = step.moves[0]; return `${move.run}[${move.from}] → A[${move.to}] · ${move.value}`; }
  if (step.phase === "tail") return `${step.moves.length} remainder ${step.moves.length === 1 ? "key" : "keys"} copied · no comparison`;
  if (step.phase === "complete") return "A is sorted · equal keys keep their order";
  return "Compare the two heads, then copy the smaller";
}

export function renderMergeMechanism(step, { compact = false } = {}) {
  const all = [...step.B, ...step.C];
  const heights = relativeBarHeights(all);
  const n = all.length;
  const finished = step.phase === "tail" || step.phase === "complete";
  const cellMin = Math.max(compact ? 22 : 24, ...all.map((value) => String(value).length * (compact ? 7.2 : 8.4) + 8));
  const run = (name, values, index, offset) => {
    const cells = values.map((value, at) => {
      const move = step.moves.some((entry) => entry.run === name && entry.from === at);
      const compared = step.comparison && at === (name === "B" ? step.comparison.i : step.comparison.j);
      const consumed = at < index || step.phase === "tail" && move || step.phase === "complete";
      return `<li class="dc-merge-cell ${compared ? "is-counted" : ""} ${move ? "is-copy" : ""} ${consumed ? "is-consumed" : ""}"${compared || move ? " data-active-visual" : ""} style="--dc-height:${heights[offset + at] / 100}" aria-label="${name}[${at}] = ${escapeHtml(value)}${at === index ? finished ? "; retained source pointer; remainder already copied" : "; current head" : ""}${move ? "; copied this step" : ""}">
        <span class="dc-merge-pointer">${at === index ? `${name === "B" ? "i" : "j"}↓` : ""}</span><strong class="dc-merge-bar">${escapeHtml(value)}</strong>${compact ? "" : `<small class="dc-merge-index">${at}</small>`}
      </li>`;
    }).join("");
    return `<div class="dc-merge-run"><div class="dc-merge-run-label"><b>${name}</b><span>${name === "B" ? "i" : "j"}=${index}${index >= values.length ? " · exhausted" : finished ? " · copied" : ""}</span></div>${values.length ? `<ol class="dc-merge-values" style="--dc-cells:${values.length}" aria-label="Sorted input ${name}">${cells}</ol>` : '<div class="dc-merge-empty">empty</div>'}</div>`;
  };
  const output = step.A.map((value, index) => {
    const move = step.moves.some((entry) => entry.to === index);
    const original = value === null ? -1 : all.indexOf(value);
    return `<li class="dc-merge-cell ${value === null ? "is-empty" : "is-written"} ${move ? "is-copy" : ""}"${move ? " data-active-visual" : ""} style="--dc-height:${value === null ? 1 : heights[original] / 100}" aria-label="A[${index}] = ${value === null ? "empty" : escapeHtml(value)}${move ? "; written this step" : ""}">
      <span class="dc-merge-pointer">${index === step.k && step.phase !== "complete" ? "k↓" : ""}</span><strong class="dc-merge-bar">${value === null ? "·" : escapeHtml(value)}</strong>${compact ? "" : `<small class="dc-merge-index">${index}</small>`}
    </li>`;
  }).join("");
  const wp = Math.max(1, step.B.length), wq = Math.max(1, step.C.length), totalWeight = wp + wq;
  const inputX = (name, at) => name === "B" ? (at + 0.5) / step.B.length * wp / totalWeight * 1000
    : (wp / totalWeight + (at + 0.5) / step.C.length * wq / totalWeight) * 1000;
  const arrowHeight = compact ? 14 : 24;
  const arrows = step.moves.map((move) => {
    const from = inputX(move.run, move.from), to = (move.to + 0.5) / n * 1000;
    return `<path d="M ${from} 0 C ${from} ${arrowHeight / 2}, ${to} ${arrowHeight / 2}, ${to} ${arrowHeight - 1}"/><path d="M ${to - 9} ${arrowHeight - 7} L ${to} ${arrowHeight - 1} L ${to + 9} ${arrowHeight - 7}"/>`;
  }).join("");
  return `<section class="dc-merge-mechanism ${compact ? "is-compact" : ""}" aria-label="Merge heads feeding output">
    <div class="dc-merge-scroll" data-visual-scroll><div class="dc-merge-board" style="--dc-min-width:${n * cellMin}px">
      <div class="dc-merge-inputs" style="grid-template-columns:minmax(0,${wp}fr) minmax(0,${wq}fr)">${run("B", step.B, step.i, 0)}${run("C", step.C, step.j, step.B.length)}</div>
      <svg class="dc-merge-flow" viewBox="0 0 1000 ${arrowHeight}" preserveAspectRatio="none" aria-hidden="true">${arrows}</svg>
      <div class="dc-merge-output"><span class="dc-merge-output-label">A</span><ol class="dc-merge-values" style="--dc-cells:${n}" aria-label="Merged output A">${output}</ol></div>
    </div></div>
    <p class="dc-merge-relation ${step.comparison ? "is-counted" : ""}"${step.comparison || step.moves.length ? " data-active-visual" : ""}>${escapeHtml(mergeRelation(step))}</p>
  </section>`;
}

function renderTree(step) {
  const n = step.original.length;
  const depth = Math.max(0, Math.ceil(Math.log2(n)));
  const minWidth = Math.max(n * 34, ...step.nodes.map((node) => {
    const characters = node.input.join(" ").length + (node.result ? node.input.length === 1 ? 1 : node.result.join(" ").length + 2 : 0);
    return (characters * 7.25 + 12) / node.input.length * n;
  }));
  const edges = step.nodes.filter((node) => node.parentId).map((node) => {
    const parent = step.nodes.find((entry) => entry.id === node.parentId);
    const x = (node.start + node.end + 1) / 2 / n * 1000, px = (parent.start + parent.end + 1) / 2 / n * 1000;
    return `<path class="${node.result ? "is-returned" : ""}" d="M ${px} ${parent.depth * 25 + 20} L ${x} ${node.depth * 25}"/>`;
  }).join("");
  const nodes = step.nodes.map((node) => `<li class="dc-mergesort-node ${node.id === step.activeId ? "is-active" : ""} ${node.id === step.nextChild ? "is-next" : ""} ${node.result ? "is-returned" : ""} ${node.id === step.activeId && step.merge?.comparison ? "is-counted" : ""}"${!step.merge && !["return", "complete"].includes(step.phase) && node.id === (step.nextChild ?? step.activeId) ? " data-active-visual" : ""} style="grid-column:${node.start + 1}/span ${node.input.length};grid-row:${node.depth + 1}" aria-label="${escapeHtml(`A[${node.start}..${node.end}]; input ${node.input.join(", ")}; ${node.status}; returned ${node.result ? node.result.join(", ") : "none"}`)}">
    <span class="dc-mergesort-node-input">${escapeHtml(node.input.join(" "))}</span>${node.result ? node.input.length === 1 ? '<span class="dc-mergesort-return">✓</span>' : `<span class="dc-mergesort-return">→ ${escapeHtml(node.result.join(" "))}</span>` : ""}
  </li>`).join("");
  return `<div class="dc-mergesort-tree-scroll" data-visual-scroll><div class="dc-mergesort-tree" style="--dc-tree-items:${n};--dc-tree-rows:${depth + 1};--dc-tree-min:${Math.ceil(minWidth)}px">
    <svg class="dc-mergesort-edges" viewBox="0 0 1000 ${depth * 25 + 20}" preserveAspectRatio="none" aria-hidden="true">${edges}</svg><ol class="dc-mergesort-nodes" aria-label="Divide tree; arrows inside nodes show retained returned results">${nodes}</ol>
  </div></div>`;
}

export function renderMergesort(step) {
  const active = step.nodes.find((node) => node.id === step.activeId);
  const relation = step.phase === "complete" ? "All calls returned · A is sorted"
    : step.phase === "base" ? "One key · return without comparing"
      : step.phase === "return" ? "Retain the returned sorted run"
        : step.nextChild ? `Next: ${step.nextChild.endsWith("L") ? "left B" : "right C"}`
          : `Split ${active.input.length} → ${Math.floor(active.input.length / 2)} + ${Math.ceil(active.input.length / 2)}`;
  const values = active.result ?? active.input;
  const heights = relativeBarHeights(step.original);
  const barMin = Math.max(24, ...values.map((value) => String(value).length * 8.4 + 12)) * values.length;
  const run = `<div class="dc-mergesort-focus"><div class="dc-mergesort-focus-scroll" data-visual-scroll><ol class="dc-mergesort-focus-bars" style="--dc-cells:${values.length};min-width:${Math.ceil(barMin)}px" aria-label="${active.result ? "Returned sorted run" : "Current run"}">${values.map((value, index) => `<li${index === 0 ? " data-active-visual" : ""} style="--dc-height:${heights[step.original.indexOf(value)] / 100}" class="${active.result ? "is-returned" : ""}"><strong>${escapeHtml(value)}</strong></li>`).join("")}</ol></div><p>${escapeHtml(relation)}</p></div>`;
  return `<section class="dc-mergesort-visual" aria-label="Mergesort recursion and active merge"><div class="dc-mergesort-caption"><strong>A[${active.start}..${active.end}]</strong><span>${active.status === "returned" ? "✓ returned" : active.status}</span><span>input → sorted return</span></div>${renderTree(step)}${step.merge ? renderMergeMechanism(step.merge, { compact: true }) : run}</section>`;
}
