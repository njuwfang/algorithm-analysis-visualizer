import { escapeHtml } from "../../core/utils.js?v=20260916-1";
import { relativeBarHeights } from "../../core/sort-bars.js?v=20261004-1";
import { indexed } from "./trace-view.js?v=20261004-1";

const keyText = (value) => String(value);

export function parseShellsortInput(raw) {
  const tokens = String(raw).trim().split(/[\s,]+/).filter(Boolean);
  let values;
  if (tokens.length && tokens.every((token) => /^[a-z]+$/i.test(token))) {
    values = tokens.join("").toUpperCase().split("");
  } else if (tokens.length && tokens.every((token) => Number.isFinite(Number(token)))) {
    values = tokens.map(Number);
  } else {
    throw new Error("Use either letters A–Z or finite numbers; do not mix letters and numbers.");
  }
  if (values.length < 2 || values.length > 16) throw new Error("Enter between 2 and 16 letters or numbers.");
  return values;
}

export function buildShellsortTrace(input) {
  const values = [...input];
  const trace = [];
  let h = 1;
  let i = null;
  let j = null;
  let comparisons = 0;
  let insertionKey = null;
  let keyIndex = null;
  let insertionPath = [];
  const completedGaps = [];
  const gapCounts = [];

  function push(phase, activeLine, message, extra = {}) {
    trace.push({
      phase, activeLine, message, values: [...values], h, i, j, comparisons,
      insertionKey, keyIndex, insertionPath: [...insertionPath],
      completedGaps: [...completedGaps],
      gapCounts: gapCounts.map((entry) => ({ ...entry })),
      pair: [], comparisonResult: null, ...extra
    });
  }

  push("initial", 1, "Set h = 1; first build the lecture's 1, 4, 13, … gap sequence.");
  while (h < values.length / 3) {
    const previousGap = h;
    h = 3 * h + 1;
    push("grow-gap", 2, `h = ${previousGap} is less than n/3; set h = 3 × ${previousGap} + 1 = ${h}.`);
  }

  while (h >= 1) {
    gapCounts.push({ h, comparisons: 0 });
    push("pass", 3, `h = ${h} is at least 1; h-sort the ${h} interleaved subsequence${h === 1 ? "" : "s"}.`);
    for (i = h; i < values.length; i += 1) {
      j = null;
      insertionKey = values[i];
      keyIndex = i;
      insertionPath = [i];
      push("insertion-start", 4, `Insert the key ${keyText(insertionKey)} from A[${i}] into its gap-${h} subsequence; earlier keys in this subsequence are sorted.`, { activeLabel: "Begin insertion" });
      j = i;
      while (j >= h) {
        const pair = [j, j - h];
        const comparisonResult = values[j] < values[j - h];
        comparisons += 1;
        gapCounts.at(-1).comparisons += 1;
        push("compare", 5, `Compare A[${j}] = ${keyText(values[j])} with A[${j - h}] = ${keyText(values[j - h])}: A[j] < A[j − h] is ${comparisonResult ? "true" : "false"}.`, { pair, comparisonResult });
        if (!comparisonResult) break;
        const exchangedValues = pair.map((index) => values[index]);
        [values[j], values[j - h]] = [values[j - h], values[j]];
        keyIndex = j - h;
        insertionPath.push(keyIndex);
        push("exchange", 6, `Exchange A[${j}] and A[${j - h}]; ${keyText(exchangedValues[0])} moves left by ${h} positions.`, { pair, exchangedValues });
        j -= h;
      }
      push("insertion-complete", null, `${keyText(insertionKey)} finishes at A[${keyIndex}]; its gap-${h} subsequence is sorted through A[${i}].${j < h ? " The index boundary stops the scan without another key comparison." : ""}`, { activeLabel: "Insertion complete" });
    }
    i = null;
    j = null;
    insertionKey = null;
    keyIndex = null;
    insertionPath = [];
    completedGaps.push(h);
    push("pass-complete", null, `The array is ${h}-sorted: each gap-${h} subsequence is in nondecreasing order.`, { activeLabel: `${h}-sort complete` });
    const previousGap = h;
    h = Math.floor(h / 3);
    push("decrease-gap", 7, `Use integer division: h = floor(${previousGap}/3) = ${h}.`, { previousGap });
  }
  push("complete", 3, `h = 0 ends the loop; the array is sorted after ${comparisons} key comparisons.`, { activeLabel: "Generalize" });
  return trace;
}

function gapGroups(step) {
  if (step.h < 1) return [];
  return Array.from({ length: Math.min(step.h, step.values.length) }, (_, remainder) => {
    const indices = [];
    for (let index = remainder; index < step.values.length; index += step.h) indices.push(index);
    return { remainder, indices };
  });
}

function comparisonText(step) {
  if (step.phase === "compare") {
    const [right, left] = step.pair;
    return `A[${right}] = ${keyText(step.values[right])} < A[${left}] = ${keyText(step.values[left])} is ${step.comparisonResult ? "true" : "false"}`;
  }
  if (step.phase === "boundary") return "j < h; the key comparison is not evaluated";
  return "not evaluated at this step";
}

function activeChain(step) {
  if (step.i === null || step.h < 1) return [];
  const indices = [];
  for (let index = step.i % step.h; index < step.values.length; index += step.h) indices.push(index);
  return indices;
}

export function shellsortSortedPrefix(step, indices = activeChain(step)) {
  if (!indices.length || step.h < 1) return [];
  if (step.phase === "pass-complete") return [...indices];
  if (step.i === null) return indices.slice(0, 1);
  if (indices[0] % step.h !== step.i % step.h) return indices.filter((index) => index < step.i);
  return indices.filter((index) => step.phase === "insertion-complete" ? index <= step.i : index < step.keyIndex);
}

function insertionStatus(step) {
  if (step.phase === "insertion-complete") return "complete; the subsequence is sorted through the original insertion index i";
  if (step.insertionKey === null) return step.phase === "complete" ? "all insertions complete" : "none active";
  if (step.phase === "insertion-start") return "begin; compare the new key with earlier keys in its sorted subsequence";
  if (step.phase === "compare" && !step.comparisonResult) return "comparison false; the key has reached its insertion position";
  return "in progress; the key moves left by h only after a successful comparison";
}

function describeShellsort(step) {
  const groups = gapGroups(step);
  const indices = activeChain(step);
  const prefix = shellsortSortedPrefix(step, indices);
  return {
    summary: step.message,
    state: [
      { label: "Array A", value: indexed(step.values) },
      { label: "Gap h", value: String(step.h) },
      { label: "Outer index i", value: step.i === null ? "none" : String(step.i) },
      { label: "Scan index j", value: step.j === null ? "none" : String(step.j) },
      { label: "Gap subsequences", value: groups.length ? groups.map(({ remainder, indices }) => `Group ${remainder}: ${indices.map((index) => `A[${index}] = ${keyText(step.values[index])}`).join(", ")}`).join("; ") : "complete; h = 0" },
      { label: "Subarray sorted prefixes", value: groups.length ? groups.map(({ remainder, indices }) => {
        const retained = shellsortSortedPrefix(step, indices);
        return `Group ${remainder}: ${retained.length ? retained.map((index) => `A[${index}] = ${keyText(step.values[index])}`).join(", ") : "empty"}`;
      }).join("; ") : "complete; h = 0" },
      { label: "Active subarray", value: indices.length ? `Group ${step.i % step.h}: ` + indices.map((index) => `A[${index}] = ${keyText(step.values[index])}`).join("; ") : "none; no insertion active" },
      { label: "Insertion key", value: step.insertionKey === null ? "none" : `${keyText(step.insertionKey)} from A[${step.i}]` },
      { label: "Key position", value: step.keyIndex === null ? "none" : `A[${step.keyIndex}]` },
      { label: "Insertion path", value: step.insertionPath.length ? step.insertionPath.map((index) => `A[${index}]`).join(" → ") : "none" },
      { label: "Sorted prefix", value: prefix.length ? prefix.map((index) => `A[${index}] = ${keyText(step.values[index])}`).join("; ") : "empty; no earlier keys in the active prefix" },
      { label: "Insertion status", value: insertionStatus(step) },
      { label: "Active pair", value: step.pair.length ? step.pair.map((index) => `A[${index}] = ${keyText(step.values[index])}`).join(" and ") + `; indices differ by h = ${step.h}` : "none" },
      { label: "Current comparison", value: comparisonText(step) },
      { label: "Exchange this step", value: step.phase === "exchange" ? `A[${step.pair[0]}] and A[${step.pair[1]}] exchanged ${keyText(step.exchangedValues[0])} and ${keyText(step.exchangedValues[1])}` : "none" },
      { label: "Completed gaps", value: step.completedGaps.length ? step.completedGaps.join(", ") : "none" },
      { label: "Order status", value: step.phase === "complete" ? "Every position is in nondecreasing order" : step.phase === "pass-complete" ? `Every gap-${step.h} subsequence is sorted` : "Sorting in progress" },
      { label: "Key comparisons", value: String(step.comparisons) }
    ]
  };
}

function renderSubarrayInsertion(step, indices) {
  const done = step.phase === "insertion-complete";
  const prefix = shellsortSortedPrefix(step, indices);
  const numericKeys = indices.map((index) => typeof step.values[index] === "number" ? step.values[index] : step.values[index].charCodeAt(0));
  const heights = relativeBarHeights(numericKeys);
  const cellWidth = Math.max(18, ...indices.map((index) => String(step.values[index]).length * 8 + 8));
  let exchange = "";
  if (step.phase === "exchange") {
    const from = indices.indexOf(step.pair[0]);
    const to = indices.indexOf(step.keyIndex);
    const x = (position) => (position + 0.5) * 100 / indices.length;
    exchange = `<svg class="dc-shell-insert-arrow" viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true"><path d="M ${x(from)} 14 Q ${(x(from) + x(to)) / 2} -2 ${x(to)} 14"/><path d="M ${x(to) - 1.3} 9 L ${x(to)} 14 L ${x(to) + 1.3} 9"/></svg>`;
  }
  const bars = indices.map((index, position) => {
    const isKey = index === step.keyIndex;
    const counted = step.phase === "compare" && step.pair.includes(index);
    const exchanged = step.phase === "exchange" && step.pair.includes(index);
    const classes = ["dc-shell-insert-bar", prefix.includes(index) ? "is-sorted" : "", index > step.i ? "is-later" : "", isKey ? "is-key" : "", counted ? "is-counted" : "", exchanged ? "is-exchanged" : "", done && isKey ? "is-finished" : ""].filter(Boolean).join(" ");
    return `<div class="dc-shell-insert-column" role="group" aria-label="${escapeHtml(`A[${index}] = ${step.values[index]}${isKey ? "; insertion key" : ""}${prefix.includes(index) ? "; in the sorted prefix" : ""}${index > step.i ? "; later key" : ""}`)}"${isKey ? " data-active-visual" : ""}>
      <span class="dc-shell-insert-pointer">${isKey ? done ? "✓" : "▼" : ""}</span>
      <strong class="${classes}" style="--shell-key-height:${heights[position]}%">${escapeHtml(step.values[index])}</strong>
      <small class="dc-shell-insert-index">${index}</small>
    </div>`;
  }).join("");
  const prefixLabel = prefix.length >= 4 || indices.length <= 4 ? "✓ sorted" : "✓";
  const path = step.insertionPath.join(" → ");
  return `<section class="dc-shell-insertion ${done ? "is-complete" : ""}" aria-label="Insertion sort of the active gap subsequence">
    <div class="dc-shell-insert-heading"><strong>${done ? "✓ Inserted" : "▼ Insert"} ${escapeHtml(step.insertionKey)}</strong><span>${path}</span></div>
    <div class="dc-shell-insert-scroll" data-visual-scroll><div class="dc-shell-insert-board" style="--shell-subarray-items:${indices.length};--shell-cell-min:${cellWidth}px">
      ${exchange}<div class="dc-shell-insert-bars">${bars}</div>
      <div class="dc-shell-insert-prefix" role="group" aria-label="${prefix.length ? `Sorted prefix at indices ${prefix.join(", ")}` : "Empty sorted prefix"}">${prefix.length ? `<span style="grid-column:1 / span ${prefix.length}">${prefixLabel}</span>` : '<span class="is-empty" style="grid-column:1 / -1">empty prefix</span>'}</div>
    </div></div>
  </section>`;
}

function renderGapRows(step, groups) {
  const activeGroup = step.i === null ? null : step.i % step.h;
  return `<div class="dc-shell-lanes" role="group" aria-label="Interleaved subsequences">${groups.map(({ remainder, indices }) => {
    const active = remainder === activeGroup;
    const done = active && step.phase === "insertion-complete";
    const prefix = shellsortSortedPrefix(step, indices);
    const cellWidth = Math.max(24, ...indices.map((index) => String(step.values[index]).length * 8 + 8)) + 12;
    const items = indices.map((index, position) => {
      const isKey = active && index === step.keyIndex;
      const counted = step.phase === "compare" && step.pair.includes(index);
      const exchanged = step.phase === "exchange" && step.pair.includes(index);
      const sorted = prefix.includes(index);
      const classes = ["dc-shell-row-value", sorted ? "is-sorted" : "", active && index > step.i ? "is-later" : "", isKey ? "is-key" : "", counted ? "is-counted" : "", exchanged ? "is-exchanged" : "", done && isKey ? "is-finished" : ""].filter(Boolean).join(" ");
      const exchangeLink = position < indices.length - 1 && step.phase === "exchange" && step.pair.includes(index) && step.pair.includes(indices[position + 1]);
      return `<div class="dc-shell-row-item" role="group" aria-label="${escapeHtml(`A[${index}] = ${step.values[index]}${isKey ? "; insertion key" : ""}${sorted ? "; sorted" : ""}${active && index > step.i ? "; later key" : ""}`)}"${isKey ? " data-active-visual" : ""}>
        <small>${index}</small><strong class="${classes}">${escapeHtml(step.values[index])}</strong>
        ${position < indices.length - 1 ? `<span class="dc-shell-row-link ${exchangeLink ? "is-exchanged" : ""}" aria-hidden="true">${exchangeLink ? "←" : "→"}</span>` : ""}
      </div>`;
    }).join("");
    let action = "";
    if (active) {
      let arrow = "";
      if (step.phase === "exchange") {
        const x = (index) => (indices.indexOf(index) + 0.5) * 100 / indices.length;
        const from = x(step.pair[0]);
        const to = x(step.keyIndex);
        arrow = `<svg class="dc-shell-row-arrow" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M ${from} 10 Q ${(from + to) / 2} -4 ${to} 10"/><path d="M ${to - 1.3} 5 L ${to} 10 L ${to + 1.3} 5"/></svg>`;
      }
      action = `<div class="dc-shell-row-action">${arrow}<span style="grid-column:${indices.indexOf(step.keyIndex) + 1}">${done ? "✓" : "▼"}</span></div>`;
    }
    const bracket = `<div class="dc-shell-row-prefix ${active ? "" : "is-retained"}" role="group" aria-label="${prefix.length ? `Sorted prefix at indices ${prefix.join(", ")}` : "Empty sorted prefix"}">${prefix.length ? `<span style="grid-column:1 / span ${prefix.length}">${active ? prefix.length >= 2 ? "✓ sorted" : "✓" : ""}</span>` : '<span class="is-empty" style="grid-column:1 / -1">empty prefix</span>'}</div>`;
    return `<div class="dc-shell-lane ${active ? "is-active" : ""} ${done ? "is-complete" : ""}">
      <span class="dc-shell-lane-label"><span>${active ? done ? "✓ " : "▸ " : ""}from ${remainder}</span>${active ? `<strong>${done ? "Placed" : "Insert"} ${escapeHtml(step.insertionKey)}</strong>` : `<small>✓ ${prefix.length === indices.length ? "sorted" : "prefix"}</small>`}</span>
      <div class="dc-shell-row-scroll" data-visual-scroll><div class="dc-shell-row-board" style="--shell-row-items:${indices.length};--shell-row-cell:${cellWidth}px">${action}<div class="dc-shell-row-keys">${items}</div>${bracket}</div></div>
    </div>`;
  }).join("")}</div>`;
}

function renderShellsort(step) {
  const groups = gapGroups(step).filter(({ indices }) => indices.length > 1);
  const indices = activeChain(step);
  const activeGroup = step.i === null || step.h < 1 ? null : step.i % step.h;
  const complete = step.phase === "complete";
  const key = (index) => {
    const classes = ["dc-shell-key"];
    if (activeGroup !== null && index % step.h === activeGroup) classes.push("is-subarray");
    if (complete || step.phase === "pass-complete") classes.push("is-sorted");
    if (step.pair.includes(index)) classes.push(step.phase === "compare" ? "is-compared" : "is-current");
    return `<span class="${classes.join(" ")}" role="group" aria-label="A[${index}] = ${escapeHtml(step.values[index])}"><small>${index}</small><strong>${escapeHtml(step.values[index])}</strong></span>`;
  };
  const overview = `<div class="dc-shell-overview" role="group" style="--dc-items:${step.values.length}" aria-label="Complete array A">${step.values.map((_, index) => key(index)).join("")}</div>`;
  let lanes = "";
  if (step.h > 1) lanes = renderGapRows(step, groups);
  else if (indices.length) lanes = renderSubarrayInsertion(step, indices);
  const relation = step.phase === "compare" ? comparisonText(step)
    : step.phase === "exchange" ? `${keyText(step.insertionKey)} moves A[${step.pair[0]}] → A[${step.keyIndex}]; exchange with ${keyText(step.exchangedValues[1])}`
      : step.phase === "insertion-start" ? `Insert into the sorted prefix; original i = ${step.i}`
        : step.phase === "insertion-complete" ? `✓ Sorted through A[${step.i}]; the next key can begin`
      : step.phase === "pass-complete" ? `Each ${step.h}-spaced chain is now sorted`
        : complete ? "Gap 1 finishes the nondecreasing array"
          : step.phase === "grow-gap" || step.phase === "initial" || step.phase === "gap-ready" ? "Build the 1, 4, 13, … gap sequence"
            : step.h > 1 ? `Insertion sort within each row; indices are ${step.h} apart`
              : "Gap 1 compares neighboring keys";
  return `<div class="dc-sort-visual dc-shell">
    <div class="dc-shell-header"><strong>${complete ? "Sorted" : `h = ${step.h}`}${activeGroup !== null ? ` · subarray ${activeGroup}` : ""}</strong><span>${indices.length ? `i = ${step.i}${step.j === null ? "" : `, j = ${step.j}`}` : step.completedGaps.length ? `Finished gaps: ${step.completedGaps.join(" → ")}` : "Sort the interleaved chains"}</span></div>
    ${overview}${lanes}<p class="dc-sort-relation ${step.phase === "compare" ? "is-counted" : ""}">${escapeHtml(relation)}</p>
  </div>`;
}

export const shellsortModule = {
  id: "shellsort",
  shortTitle: "Shellsort",
  title: "Shellsort",
  summary: "Sort interleaved subsequences at decreasing gaps, ending with gap 1.",
  complexity: "Gap dependent; lecture summary n, ?, n¹·⁵",
  source: { slides: "55–67" },
  objective: "Identify the h interleaved subsequences and follow the lecture's exchange-based insertion at gaps 13, 4, and 1.",
  input: {
    label: "Array A",
    hint: "Enter 2–16 letters or numbers, without mixing types. Letters become uppercase. Integer h/3 means floor(h/3).",
    default: "SHELLSORTEXAMPLE",
    presets: [
      { label: "Lecture letters", value: "SHELLSORTEXAMPLE" },
      { label: "Lecture 4-sorted row", value: "L E E A M H L E P S O L T S X R" }
    ],
    parse: parseShellsortInput
  },
  pseudocode: [
    { line: 1, text: "h ← 1" },
    { line: 2, text: "while h < n/3 do h ← 3 · h + 1" },
    { line: 3, text: "while h ≥ 1 do" },
    { line: 4, text: "for i ← h to n − 1 do", indent: 1 },
    { line: 5, text: "for (j ← i; j ≥ h and A[j] < A[j − h]; j −= h)", indent: 2, basic: true, basicLabel: "key comparison A[j] < A[j − h]" },
    { line: 6, text: "exchange(A[j], A[j − h])", indent: 3 },
    { line: 7, text: "h ← h/3", indent: 1 }
  ],
  buildTrace: buildShellsortTrace,
  render: renderShellsort,
  describe: describeShellsort,
  metrics: (step) => [{ label: "Key comparisons", value: step.comparisons, emphasis: true }],
  analysis: [
    { term: "Input size", value: "n, the number of keys in A" },
    { term: "Counted operation", value: "This companion counts evaluated A[j] < A[j − h] comparisons; the Shellsort slides do not name a basic operation" },
    { term: "Gap sequence", value: "Grow 1, 4, 13, … while h < n/3; then use h ← floor(h/3)" },
    { term: "h-sorted", value: "The h subsequences with indices congruent modulo h are each sorted" },
    { term: "Reading the insertion", value: "Each row keeps its original array indices. The marked key moves left through h-spaced exchanges; the bracket marks its sorted prefix. At h=1, bar heights show numerical or alphabetical order." },
    { term: "Lecture summary", value: "Slide 67 lists best n, average ?, and worst n^1.5; it supplies no derivation or gap-sequence qualification" },
    { term: "Analysis limit", value: "The trace gives an exact input count. The slide's summary is not presented as a proved universal tight bound for this implementation" }
  ],
  model(step) {
    if (step.phase !== "complete") return {
      latex: `C_{\\mathrm{seen}}=${step.comparisons},\\qquad h=${step.h}`,
      notes: ["Only evaluated key comparisons increase C; h/3 uses floor division."]
    };
    return {
      latex: `C(A)=\\sum_{h\\in H}\\sum_{i=h}^{n-1}c_{h,i}=${step.comparisons}`,
      notes: [
        `H is the descending gap sequence. Counts by gap: ${step.gapCounts.map(({ h, comparisons }) => `h = ${h}: ${comparisons}`).join("; ")}.`,
        "cₕ,ᵢ counts evaluated key comparisons in that insertion. Integer h/3 means floor(h/3).",
        "Slide 67 summarizes best n, average ?, and worst n^1.5 without a derivation or sequence qualification. These are the lecture's summary, not a proved universal tight bound here."
      ]
    };
  }
};
