import { escapeHtml, formatNumber } from "../../core/utils.js?v=20260916-1";
import { parseBinarySearchInput } from "./binary-search.js";

const LECTURE_ARRAY = "3,14,27,31,39,42,55,70,74,81,85,93,98";

export function parseInterpolationSearchInput(raw) {
  const { array, key } = parseBinarySearchInput(raw);
  return { lst: array, key };
}

export function buildInterpolationSearchTrace({ lst: inputList, key }) {
  const lst = [...inputList];
  const trace = [];
  const history = [];
  let l = 0;
  let r = lst.length - 1;
  let x = null;
  let estimate = null;
  let estimateBounds = null;
  let probes = 0;
  let comparison = null;
  let result = null;
  function emit(phase, activeLine, message) {
    trace.push({ lst: [...lst], key, l, r, x, estimate, estimateBounds: estimateBounds && [...estimateBounds],
      probes, comparison, result, history: history.map((probe) => ({ ...probe })), phase, activeLine, message });
  }
  emit("initial", 1, `Set l = 0 and r = ${r}; search for key = ${key}.`);
  while (true) {
    const eligible = l <= r && key >= lst[l] && key <= lst[r];
    const guardMessage = l > r ? "The candidate interval is empty." : eligible
      ? `key = ${key} lies between lst[${l}] = ${lst[l]} and lst[${r}] = ${lst[r]}.`
      : `key = ${key} is outside [${lst[l]}, ${lst[r]}]; no candidate can match.`;
    emit("condition", 2, guardMessage);
    if (!eligible) break;
    comparison = null;
    estimateBounds = [l, r];
    if (lst[l] === lst[r]) {
      estimate = l;
      x = l;
      emit("estimate", 3, `The endpoint values are equal; choose x = l = ${l} without dividing by zero.`);
    } else {
      estimate = l + ((key - lst[l]) * (r - l)) / (lst[r] - lst[l]);
      x = Math.floor(estimate);
      emit("estimate", 4, `The line estimates x ≈ ${formatNumber(estimate)}; round down to index ${x}.`);
    }
    probes += 1;
    comparison = key === lst[x] ? "=" : key < lst[x] ? "<" : ">";
    history.push({ index: x, value: lst[x], relation: comparison });
    emit("probe", 5, `Probe lst[${x}] = ${lst[x]}: key = ${key} ${comparison} lst[${x}].`);
    if (comparison === "=") {
      result = x;
      emit("complete", 6, `The key matches lst[${x}]; return index ${x}.`);
      return trace;
    }
    if (comparison === "<") {
      r = x - 1;
      emit("reduce", 7, `key < lst[${x}]; set r = ${r} and retain indices before x.`);
    } else {
      l = x + 1;
      emit("reduce", 8, `key > lst[${x}]; set l = ${l} and retain indices after x.`);
    }
  }
  result = -1;
  emit("complete", 9, "No candidate can match the key; return −1.");
  return trace;
}

function currentEstimate(step) {
  return ["estimate", "probe"].includes(step.phase) || step.phase === "complete" && step.result >= 0;
}

function renderEstimate(step) {
  const left = 50;
  const right = 374;
  const top = 16;
  const bottom = 84;
  const min = Math.min(...step.lst);
  const max = Math.max(...step.lst);
  const range = max - min || 1;
  const plotX = (index) => left + (right - left) * index / Math.max(1, step.lst.length - 1);
  const plotY = (value) => bottom - (bottom - top) * (value - min) / range;
  const showEstimate = currentEstimate(step);
  const bounds = showEstimate ? step.estimateBounds : step.l <= step.r ? [step.l, step.r] : null;
  const equalEndpoints = bounds && step.lst[bounds[0]] === step.lst[bounds[1]];
  const points = step.lst.map((value, index) => `<circle cx="${plotX(index)}" cy="${plotY(value)}" r="3" class="decrease-search-point ${index < step.l || index > step.r ? "is-excluded" : ""}"/>`).join("");
  const atLeftEndpoint = showEstimate && bounds && Math.abs(step.estimate - bounds[0]) < 1e-9;
  const atRightEndpoint = showEstimate && bounds && Math.abs(step.estimate - bounds[1]) < 1e-9;
  const leftIndexLabel = bounds && bounds[0] === bounds[1] ? `${showEstimate ? "l=r=x" : "l=r"}=${bounds[0]}` : `${atLeftEndpoint ? "l,x" : "l"}=${bounds?.[0]}`;
  const rightIndexLabel = `${atRightEndpoint ? "r,x" : "r"}=${bounds?.[1]}`;
  const endpointLine = bounds ? `<path class="decrease-search-line" d="M ${plotX(bounds[0])} ${plotY(step.lst[bounds[0]])} L ${plotX(bounds[1])} ${plotY(step.lst[bounds[1]])}"/>
    <text x="${plotX(bounds[0]) + 7}" y="${plotY(step.lst[bounds[0]]) - 9}">lst[l]</text>
    ${bounds[0] === bounds[1] ? "" : `<text x="${plotX(bounds[1]) - 7}" y="${plotY(step.lst[bounds[1]]) + 18}" text-anchor="end">lst[r]</text>`}
    <text x="${plotX(bounds[0])}" y="112" text-anchor="middle">${leftIndexLabel}</text>
    ${bounds[0] === bounds[1] ? "" : `<text x="${plotX(bounds[1])}" y="112" text-anchor="middle">${rightIndexLabel}</text>`}` : "";
  const estimateGuide = showEstimate && step.estimate !== null ? equalEndpoints
    ? `<rect class="decrease-search-estimate" x="${plotX(step.x) - 4}" y="${plotY(step.key) - 4}" width="8" height="8"/>`
    : `<path class="decrease-search-guide" d="M ${left - 5} ${plotY(step.key)} H ${plotX(step.estimate)} V ${bottom + 3}"/>
    <circle class="decrease-search-estimate" cx="${plotX(step.estimate)}" cy="${plotY(step.key)}" r="5"/>
    ${atLeftEndpoint || atRightEndpoint ? "" : `<text x="${plotX(step.estimate)}" y="112" text-anchor="middle">x</text>`}
    <text x="${left - 8}" y="${plotY(step.key) + 4}" text-anchor="end">key</text>` : "";
  const probe = step.phase === "probe" ? `<circle class="decrease-search-probe" cx="${plotX(step.x)}" cy="${plotY(step.lst[step.x])}" r="7"/>` : "";
  return `<svg class="decrease-search-plot" viewBox="0 0 400 118" aria-hidden="true">
    <path class="decrease-search-axis" d="M ${left} ${top - 7} V ${bottom} H ${right + 15}"/>
    <text x="${left}" y="13">value</text><text x="${right + 14}" y="97" text-anchor="end">index</text>
    ${points}${endpointLine}${estimateGuide}${probe}
  </svg>`;
}

function probeRole(step) {
  if (step.x === null) return "not computed";
  if (step.phase === "estimate") return "current estimate";
  if (step.phase === "probe") return "current counted probe";
  if (step.phase === "complete" && step.result >= 0) return "matched probe";
  return "previous probe";
}

function probeCaption(step) {
  if (step.x === null) return "No probe yet";
  if (currentEstimate(step)) {
    const [l, r] = step.estimateBounds;
    return step.lst[l] === step.lst[r]
      ? `x = l = ${step.x} (equal endpoints)`
      : `x≈${formatNumber(step.estimate)} → index ${step.x}`;
  }
  return `Last x = ${step.x}, from [${step.estimateBounds.join("..")}]`;
}

function renderInterpolationStrip(step) {
  const n = step.lst.length;
  const hasCandidates = step.l <= step.r;
  const current = currentEstimate(step);
  const cellWidth = Math.max(36, ...step.lst.map((value) => String(value).length * 9 + 12));
  const phoneCellWidth = Math.max(22, ...step.lst.map((value) => String(value).length * 7.8 + 6));
  const cells = step.lst.map((value, index) => {
    const isX = index === step.x;
    const roles = [index === step.l && hasCandidates ? "l" : "", isX ? current ? "x" : "x*" : "",
      index === step.r && hasCandidates ? "r" : ""].filter(Boolean);
    const classes = ["binary-search-cell", index < step.l || index > step.r ? "is-discarded" : "",
      isX && current ? "is-midpoint" : "", isX && !current ? "is-previous-probe" : "",
      isX && step.phase === "probe" ? "is-counted" : "", step.result === index ? "is-found" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}"${isX && current ? " data-active-visual" : ""}>
      <span class="binary-search-pointer ${isX && current ? "is-midpoint" : ""}">${roles.length ? `${roles.length === 3 ? `<b>l,r</b><b>${current ? "x" : "x*"}</b>` : roles.join(",")}<i aria-hidden="true">↓</i>` : ""}</span>
      <span class="binary-search-index">${index}</span><strong class="binary-search-value">${escapeHtml(value)}</strong>
    </div>`;
  }).join("");
  const discarded = (start, length) => length > 0 ? `<span class="binary-search-band is-discarded" style="grid-column:${start + 1}/span ${length}">${length >= 3 ? "× discarded" : "×"}</span>` : "";
  const bands = hasCandidates ? `${discarded(0, step.l)}<span class="binary-search-band is-retained" style="grid-column:${step.l + 1}/span ${step.r - step.l + 1}"></span>${discarded(step.r + 1, n - step.r - 1)}` : discarded(0, n);
  return `<div class="binary-search-scroll" data-visual-scroll><div class="binary-search-strip ${hasCandidates && step.l === step.r && step.x === step.l ? "has-shared-bounds" : ""}" style="--binary-items:${n};--binary-cell-width:${cellWidth}px;--binary-phone-cell-width:${phoneCellWidth}px">
    <div class="binary-search-array">${cells}</div><div class="binary-search-bands">${bands}</div>
  </div></div>`;
}

function renderInterpolationSearch(step) {
  return `<div class="decrease-layout interpolation-search-board">
    <div class="interpolation-search-caption"><strong>key = ${step.key}</strong><span>${step.l <= step.r ? `Candidates lst[${step.l}..${step.r}]` : "Candidates empty"}</span><span class="interpolation-probe-caption ${currentEstimate(step) ? "is-current" : ""}">${currentEstimate(step) || step.x === null ? "" : "x*: "}${probeCaption(step)}</span></div>
    ${renderEstimate(step)}${renderInterpolationStrip(step)}
  </div>`;
}

export const interpolationSearchModule = {
  id: "interpolation-search",
  shortTitle: "Interpolation search",
  title: "Interpolation Search",
  summary: "Estimate a probe index from a straight line between endpoint values, then retain the relevant interval.",
  complexity: "Θ(n) worst case; lecture average < log log n + 1",
  source: { slides: "90–92" },
  objective: "Read the geometric estimate, trace its integer probe, and distinguish an estimate from a guaranteed halving.",
  codeTitle: "Interpolation procedure (reconstructed)",
  input: {
    label: "Sorted list lst | search key",
    hint: "Enter 1–13 sorted integers and a key, separated by |. Values range from −1,000,000 to 1,000,000; x is rounded down.",
    default: `${LECTURE_ARRAY} | 70`,
    presets: [
      { label: "Lecture array, key 70", value: `${LECTURE_ARRAY} | 70` },
      { label: "Missing key", value: `${LECTURE_ARRAY} | 71` },
      { label: "Equal endpoints", value: "70,70,70 | 70" },
      { label: "Outside value range", value: `${LECTURE_ARRAY} | 99` }
    ],
    parse: parseInterpolationSearchInput
  },
  pseudocode: [
    { line: 1, text: "l ← 0; r ← n − 1" },
    { line: 2, text: "while l ≤ r and lst[l] ≤ key ≤ lst[r] do" },
    { line: 3, text: "if lst[l] = lst[r] then x ← l", indent: 1 },
    { line: 4, latex: "\\text{else }x\\gets\\left\\lfloor l+\\frac{(key-lst[l])(r-l)}{lst[r]-lst[l]}\\right\\rfloor", spoken: "Otherwise x is the floor of l plus key minus lst of l, times r minus l, divided by lst of r minus lst of l", indent: 1 },
    { line: 5, text: "compare key with lst[x] (3-way)", indent: 1, basic: true, basicLabel: "probe" },
    { line: 6, text: "if key = lst[x] return x", indent: 1 },
    { line: 7, text: "else if key < lst[x] r ← x − 1", indent: 1 },
    { line: 8, text: "else l ← x + 1", indent: 1 },
    { line: 9, text: "return −1" }
  ],
  buildTrace: buildInterpolationSearchTrace,
  render: renderInterpolationSearch,
  describe(step) {
    const activeEstimate = currentEstimate(step);
    const bounds = activeEstimate ? step.estimateBounds : step.l <= step.r ? [step.l, step.r] : null;
    const equalEndpoints = bounds && step.lst[bounds[0]] === step.lst[bounds[1]];
    return {
      summary: step.message,
      state: [
        { label: "List lst", value: step.lst.map((value, index) => `lst[${index}] = ${value}`).join("; ") },
        { label: "Search key", value: String(step.key) },
        { label: "Bounds", value: `l = ${step.l}; r = ${step.r}` },
        { label: "Candidate indices", value: step.l <= step.r ? Array.from({ length: step.r - step.l + 1 }, (_, index) => index + step.l).join(", ") : "none" },
        { label: "Line endpoints", value: bounds ? `(${bounds[0]}, ${step.lst[bounds[0]]}) and (${bounds[1]}, ${step.lst[bounds[1]]})` : "none: empty interval" },
        { label: "Line assumption", value: "List values are estimated to grow linearly with index between the endpoints" },
        { label: "Real-valued estimate", value: activeEstimate && step.estimate !== null ? equalEndpoints ? "not used: endpoint values are equal" : `x = ${bounds[0]} + (${step.key} − ${step.lst[bounds[0]]}) × (${bounds[1]} − ${bounds[0]}) / (${step.lst[bounds[1]]} − ${step.lst[bounds[0]]}) ≈ ${formatNumber(step.estimate)}` : "not evaluated at this step" },
        { label: "Probe index x", value: step.x === null ? "not computed" : String(step.x) },
        { label: "Probe origin range", value: step.estimateBounds ? `[${step.estimateBounds.join("..")}]` : "none" },
        { label: "Probe role", value: probeRole(step) },
        { label: "Current probe", value: step.phase === "probe" ? `key = ${step.key} with lst[${step.x}] = ${step.lst[step.x]}` : "none" },
        { label: "Comparison result", value: step.comparison === null ? "not evaluated" : `key ${step.comparison} lst[${step.x}]` },
        { label: "Excluded indices", value: step.lst.map((_, index) => index).filter((index) => index < step.l || index > step.r).join(", ") || "none" },
        { label: "Probe results", value: step.history.length ? step.history.map((probe) => `lst[${probe.index}] = ${probe.value}: key ${probe.relation} lst[${probe.index}]`).join("; ") : "none" },
        { label: "Probes", value: String(step.probes) },
        { label: "Result", value: step.result === null ? "not returned" : step.result === -1 ? "−1: key not found" : `index ${step.result}, lst[${step.result}] = ${step.key}` }
      ]
    };
  },
  metrics: (step) => [{ label: "Probes", value: step.probes, emphasis: true }],
  model(step) {
    return {
      latex: step.phase === "complete"
        ? "\\begin{gathered}x=l+\\frac{(key-lst[l])(r-l)}{lst[r]-lst[l]}\\\\T_{\\mathrm{avg}}(n)<\\log\\log n+1,\\qquad T_{\\mathrm{worst}}(n)=n\\end{gathered}"
        : "x=l+\\frac{(key-lst[l])(r-l)}{lst[r]-lst[l]}",
      notes: ["The lecture's real-valued x is rounded down for the array index; equal endpoint values use l directly.",
        ...(step.phase === "complete" ? ["The average-case expression is reported as written in the lecture, with its linear-growth premise; this trace does not establish an average-case guarantee."] : [])]
    };
  },
  analysis: [
    { term: "Input size", value: "n, the number of sorted list elements" },
    { term: "Counted quantity", value: "One probe at lst[x]; the deck does not name a basic operation, so endpoint guard comparisons are not included" },
    { term: "Estimate", value: "The x-coordinate at height key on the line through (l,lst[l]) and (r,lst[r])" },
    { term: "Conventions", value: "Reconstructed procedure; floor x, stop on an empty or out-of-range interval, and use x=l when endpoint values are equal" },
    { term: "Lecture analysis", value: "Slide 92 reports Tavg(n) < log log n + 1 and Tworst(n) = n; it does not supply a distribution or define its cost unit" },
    { term: "Scope", value: "The small deterministic traces illustrate estimates; they do not measure the lecture's large-list recommendation" }
  ]
};
