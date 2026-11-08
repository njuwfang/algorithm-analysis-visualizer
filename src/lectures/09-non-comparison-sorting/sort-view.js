import { escapeHtml } from "../../core/utils.js";

function arrayRow(label, values, { active = null, counted = false, origins = null, done = 0, digit = null, digits = 1 } = {}) {
  const width = Math.max(digit === null ? 25 : 27, Math.max(digits, ...values.map(value => value === null ? 1 : String(value).length)) * 8 + 8);
  return `<div class="nc-array-row"><strong>${label}</strong><div class="nc-array-scroll" data-visual-scroll><div class="nc-array" style="--nc-items:${values.length};--nc-cell:${width}px">${values.map((value, index) => {
    const current = index === active;
    const number = value === null ? "·" : digit === null ? escapeHtml(value) : digitKey(value, digits, digit);
    return `<div class="nc-cell ${current ? counted ? "is-counted" : "is-action" : ""} ${index < done ? "is-retained" : ""}"${current ? " data-active-visual" : ""} data-index="${index + 1}"><small>${index + 1}</small><b>${number}</b>${origins ? `<small class="nc-origin">${origins[index] === null ? "—" : `#${origins[index]}`}</small>` : ""}</div>`;
  }).join("")}</div></div></div>`;
}

function digitKey(value, digits, active) {
  return [...String(value).padStart(digits, "0")].map((digit, index) => `<span class="${digits - index - 1 === active ? "nc-digit" : ""}">${digit}</span>`).join("");
}

export function renderCounting(step) {
  const hasPositions = step.starts.every(value => value !== null);
  const activeKey = step.key ?? step.j;
  const equation = step.phase === "count" ? `A[${step.i}] = ${step.key} → Count[${step.key}]: ${step.before} → ${step.before + 1}`
    : step.phase === "prefix" ? `Pos[${step.j}] = ${step.positions[step.j - 2]} + ${step.counts[step.j - 2]} = ${step.positions[step.j - 1]}`
    : step.phase === "place" ? `A[${step.i}] = ${step.key} → A′[${step.destination}]`
    : step.phase === "advance" ? `Pos[${step.key}]: ${step.before} → ${step.before + 1} (next free slot)`
    : step.phase === "first-position" ? "Pos[1] = 1"
    : step.phase === "complete" ? "✓ Sorted · # labels preserve equal keys’ input order"
    : hasPositions ? "Each Pos points to its key’s next free output slot."
    : "Count → block starts → stable placement";
  const currentOutput = ["place", "advance"].includes(step.phase) ? step.destination - 1 : null;
  return `<div class="nc-visual nc-counting"><div class="nc-heading">n = ${step.values.length} · M = ${step.M} · # = input index</div>
    ${arrayRow("A", step.values, { active: step.i === null ? null : step.i - 1 })}
    <div class="nc-table-scroll" data-visual-scroll><table class="nc-count-table"><thead><tr><th>Key k</th>${step.counts.map((_, index) => `<th>${index + 1}</th>`).join("")}</tr></thead><tbody>${[["Count",step.counts,"count"],["Start",step.starts,"start"],["Pos",step.positions,"pos"]].map(([label,values,row]) => `<tr><th>${label}</th>${values.map((value,index) => {
      const active = activeKey === index + 1 && (row === "count" && step.phase === "count" || row === "pos" && ["prefix","first-position","place","advance"].includes(step.phase));
      return `<td class="${active ? step.phase === "place" ? "is-action" : "is-counted" : ""}"${active && step.i === null ? " data-active-visual" : ""} data-key="${index + 1}" data-row="${row}">${value === null ? "·" : value}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div>
    ${arrayRow("A′",step.output,{active:currentOutput,counted:step.phase === "place",origins:step.origins})}
    <div class="nc-equation ${step.writeDelta ? "is-counted" : ""}">${escapeHtml(equation)}</div></div>`;
}

export function renderRadix(step) {
  const digit = step.pass === 0 || step.phase === "complete" ? null : step.pass - 1;
  const gathering = ["gather-start","gather"].includes(step.phase);
  const output = Array.from({length:step.order.length},(_,index)=>step.gathered[index]?.value ?? null);
  const equation = step.phase === "distribute" ? `${String(step.current.value).padStart(step.d,"0")} → bin ${step.bin} rear (append)`
    : step.phase === "gather" ? `bin ${step.bin} front → ${step.current.value} at output[${step.gathered.length}]`
    : step.phase === "pass-complete" ? `✓ Ordered by the last ${step.pass} digit${step.pass === 1 ? "" : "s"}; retain this order`
    : step.phase === "complete" ? "✓ Sorted · FIFO preserves equal-digit order in every pass"
    : "Append at rear → gather bins 0 to 9 from the front";
  const stage = step.phase === "distribute" ? "distribute" : gathering ? "gather" : step.phase === "pass-complete" ? "pass complete" : step.phase === "complete" ? "complete" : "ready";
  return `<div class="nc-visual nc-radix"><div class="nc-heading">${step.pass ? `Pass ${step.pass}/${step.d} · ${step.place}s digit · ${stage}` : `n = ${step.original.length} · ${step.d} decimal digits · FIFO bins`}</div>
    ${arrayRow("A",step.order.map(item=>item.value),{active:step.phase === "distribute" ? step.i - 1 : null,done:step.inspected,digit,digits:step.d})}
    <div class="nc-bins">${[0,5,1,6,2,7,3,8,4,9].map(bin => `<div class="nc-bin ${step.bin === bin ? "is-active" : ""}" data-bin="${bin}"><strong>bin ${bin}</strong><div class="nc-queue-scroll" data-visual-scroll><div class="nc-queue">${step.bins[bin].length ? step.bins[bin].map(item => {
      const current = step.phase === "distribute" && step.current?.origin === item.origin;
      return `<span class="nc-queue-item ${current ? "is-counted" : ""}" data-origin="${item.origin}" title="${item.value}, original A[${item.origin}]">${digit === null ? item.value : digitKey(item.value,step.d,digit)}</span>`;
    }).join("") : `<span class="nc-empty">∅</span>`}</div></div></div>`).join("")}</div>
    ${arrayRow("Out",output,{active:step.phase === "gather"?step.gathered.length-1:null,counted:true,digit,digits:step.d})}
    <div class="nc-equation ${["distribute","gather"].includes(step.phase)?"is-counted":""}">${escapeHtml(equation)}</div></div>`;
}
