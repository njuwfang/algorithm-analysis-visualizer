import { escapeHtml } from "../../core/utils.js";

// Lecture-private, deterministic presentation helpers. Every role is printed.
export function indexed(values) {
  return values.map((value, index) => `A[${index}]=${value}`).join("; ") || "none";
}

export function renderArray(values, {
  roles = [], current = [], counted = [], result = [], muted = []
} = {}) {
  const activeIndex = counted[0] ?? current[0] ?? (result.length === 1 ? result[0] : null);
  return `<div class="decrease-array-scroll" data-visual-scroll><div class="decrease-array" style="--decrease-items:${values.length}">${values.map((value, index) => {
    const classes = ["decrease-cell"];
    if (current.includes(index)) classes.push("is-current");
    if (counted.includes(index)) classes.push("is-counted");
    if (result.includes(index)) classes.push("is-result");
    if (muted.includes(index)) classes.push("is-muted");
    return `<div class="${classes.join(" ")}"${index === activeIndex ? " data-active-visual" : ""}><span class="decrease-index">${index}</span><strong class="decrease-value">${escapeHtml(value)}</strong><span class="decrease-role">${escapeHtml(roles[index] || "—")}</span></div>`;
  }).join("")}</div></div>`;
}

export function renderFacts(facts) {
  return `<dl class="decrease-facts">${facts.map(({ label, value }) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
}

export function renderTable(headers, rows, { activeRow = -1, countedRow = -1 } = {}) {
  return `<div class="decrease-table-scroll" data-visual-scroll><table class="decrease-table"><thead><tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr class="${index === activeRow ? "is-current" : ""} ${index === countedRow ? "is-counted" : ""}"${index === (countedRow >= 0 ? countedRow : activeRow) ? " data-active-visual" : ""}>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
