import { escapeHtml, formatNumber } from "../../core/utils.js?v=20260916-1";

const MAX_DEPTH = 6;
const EQUALITY_TOLERANCE = 1e-10;
const MAX_VISIBLE_SEGMENTS = 32;
const CASE_DETAILS = Object.freeze({
  root: {
    label: "The root carries most work",
    trend: "shrinks",
    shape: "narrows downward",
    explain: () => "The profile narrows downward, so the root controls the geometric sum."
  },
  balanced: {
    label: "Every level contributes equally",
    trend: "stays constant",
    shape: "keeps the same width",
    explain: ({ depth }) => `The profile keeps the same width for ${depth + 1} levels, so every level contributes.`
  },
  leaves: {
    label: "Leaves carry most work",
    trend: "grows",
    shape: "widens downward",
    explain: () => "The profile widens downward, so the leaves control the geometric sum."
  }
});

function nearlyEqual(left, right) {
  return Math.abs(left - right) < EQUALITY_TOLERANCE;
}

function formatWork(value) {
  if (Math.abs(value) >= 1_000_000) {
    return value.toExponential(2).replace("e+", "e");
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function formatLatexNumber(value) {
  if (Math.abs(value) < 1_000_000) return formatNumber(value);
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const coefficient = formatNumber(value / (10 ** exponent));
  return `${coefficient} \\times 10^{${exponent}}`;
}

function polynomialOrder(exponent, { logarithm = false } = {}) {
  if (nearlyEqual(exponent, 0)) {
    return logarithm
      ? { text: "Θ(log n)", latex: "\\Theta(\\log n)" }
      : { text: "Θ(1)", latex: "\\Theta(1)" };
  }

  const exponentText = nearlyEqual(exponent, 1) ? "" : `^${formatNumber(exponent)}`;
  const exponentLatex = nearlyEqual(exponent, 1) ? "" : `^{${formatNumber(exponent)}}`;
  return {
    text: logarithm ? `Θ(n${exponentText} log n)` : `Θ(n${exponentText})`,
    latex: logarithm
      ? `\\Theta\\!\\left(n${exponentLatex} \\log n\\right)`
      : `\\Theta\\!\\left(n${exponentLatex}\\right)`
  };
}

export function parseMasterTheoremInput(raw) {
  const parts = String(raw)
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (parts.length !== 4) {
    throw new Error("Enter four values in the order a, b, d, n.");
  }

  const [a, b, d, n] = parts.map(Number);
  if (![a, b, n].every(Number.isInteger)) {
    throw new Error("a, b, and n must be whole numbers.");
  }
  if (!Number.isFinite(d)) {
    throw new Error("d must be a valid number.");
  }
  if (a < 1 || a > 8) {
    throw new Error("Choose a from 1 to 8.");
  }
  if (b < 2 || b > 8) {
    throw new Error("Choose b from 2 to 8.");
  }
  if (d < 0 || d > 4) {
    throw new Error("Choose d from 0 to 4.");
  }
  if (n < b) {
    throw new Error("Choose n at least as large as b so the tree has an expansion.");
  }

  let remaining = n;
  let depth = 0;
  while (remaining > 1 && remaining % b === 0) {
    remaining /= b;
    depth += 1;
  }

  if (remaining !== 1) {
    throw new Error(`Choose n as an exact power of b = ${b}.`);
  }
  if (depth > MAX_DEPTH) {
    throw new Error(`Choose n no larger than b^${MAX_DEPTH} so the tree remains readable.`);
  }

  return { a, b, d, n, depth };
}

export function classifyMasterCase({ a, b, d }) {
  const criticalExponent = Math.log(a) / Math.log(b);
  const ratio = a / (b ** d);

  if (ratio > 1 + EQUALITY_TOLERANCE) {
    return { id: "leaves", criticalExponent, ratio };
  }
  if (ratio < 1 - EQUALITY_TOLERANCE) {
    return { id: "root", criticalExponent, ratio };
  }
  return { id: "balanced", criticalExponent, ratio };
}

function resultFor(input, masterCase) {
  if (masterCase.id === "leaves") {
    const roundedExponent = Math.round(masterCase.criticalExponent);
    if (nearlyEqual(masterCase.criticalExponent, roundedExponent)) {
      return polynomialOrder(roundedExponent);
    }
    return {
      text: `Θ(n^log_${input.b} ${input.a})`,
      latex: `\\Theta\\!\\left(n^{\\log_{${input.b}} ${input.a}}\\right)`
    };
  }
  if (masterCase.id === "balanced") {
    return polynomialOrder(input.d, { logarithm: true });
  }
  return polynomialOrder(input.d);
}

function makeLevels({ a, b, d, n, depth }) {
  return Array.from({ length: depth + 1 }, (_, level) => {
    const nodes = a ** level;
    const subproblemSize = n / (b ** level);
    const workPerNode = subproblemSize ** d;
    return {
      level,
      nodes,
      subproblemSize,
      workPerNode,
      levelWork: nodes * workPerNode,
      leaf: level === depth
    };
  });
}

function changePhrase(ratio) {
  if (nearlyEqual(ratio, 1)) return "stays the same";
  if (nearlyEqual(ratio, 2)) return "doubles";
  if (nearlyEqual(ratio, 0.5)) return "halves";
  return `${ratio > 1 ? "grows" : "shrinks"} by a factor of ${formatNumber(ratio)}`;
}

function focusLevelFor(caseId, depth) {
  if (caseId === "root") return 0;
  if (caseId === "leaves") return depth;
  return Math.floor(depth / 2);
}

export function buildMasterTheoremTrace(input) {
  const levels = makeLevels(input);
  const masterCase = classifyMasterCase(input);
  const caseDetails = CASE_DETAILS[masterCase.id];
  const result = resultFor(input, masterCase);
  const perNodeDivisor = input.b ** input.d;
  const common = {
    ...input,
    levels,
    ratio: masterCase.ratio,
    masterCase: masterCase.id,
    perNodeDivisor,
    result
  };
  const root = levels[0];
  const trace = [{
    ...common,
    activeLine: 1,
    phase: "root",
    currentLevel: 0,
    revealedThrough: 0,
    message: `Start with one size-${input.n} problem. Its local work is ${input.n}^${input.d} = ${formatWork(root.levelWork)}.`
  }];

  for (const level of levels.slice(1)) {
    const previous = levels[level.level - 1];
    const perNodeChange = nearlyEqual(perNodeDivisor, 1)
      ? "the work in each subproblem stays the same"
      : `each subproblem does 1/${formatWork(perNodeDivisor)} as much local work`;
    trace.push({
      ...common,
      activeLine: 4,
      phase: level.leaf ? "leaf" : "level",
      currentLevel: level.level,
      revealedThrough: level.level,
      message: `Down one level: subproblems ×${input.a}; ${perNodeChange}; total level work ${changePhrase(masterCase.ratio)} from ${formatWork(previous.levelWork)} to ${formatWork(level.levelWork)}.`
    });
  }

  const focusLevel = focusLevelFor(masterCase.id, input.depth);
  trace.push({
    ...common,
    activeLine: 5,
    phase: "compare",
    currentLevel: focusLevel,
    revealedThrough: input.depth,
    message: caseDetails.explain(input)
  });
  trace.push({
    ...common,
    activeLine: 6,
    activeLabel: "Generalize",
    phase: "complete",
    currentLevel: focusLevel,
    revealedThrough: input.depth,
    message: `${caseDetails.label}; therefore T(n) ∈ ${result.text}.`
  });

  return trace;
}

function renderMasterTheorem(step) {
  const showLevelMultiplier = step.revealedThrough >= 1;
  const visibleLevels = step.levels.filter((level) => level.level <= step.revealedThrough);
  const visibleMaximumWork = Math.max(...visibleLevels.map((level) => level.levelWork));
  const showOutcome = step.phase === "compare" || step.phase === "complete";
  const caseDetails = CASE_DETAILS[step.masterCase];
  const branchingPrompt = step.a === 1 ? "keeps the same number of pieces" : "adds more pieces";
  const localWorkPrompt = nearlyEqual(step.perNodeDivisor, 1) ? "keeps each piece's cost unchanged" : "makes every piece cheaper";

  const rows = step.levels.map((level) => {
    const revealed = level.level <= step.revealedThrough;
    const active = revealed && level.level === step.currentLevel;
    const dominant = showOutcome && (
      step.masterCase === "balanced"
      || (step.masterCase === "root" && level.level === 0)
      || (step.masterCase === "leaves" && level.level === step.depth)
    );

    if (!revealed) {
      return `
        <div class="master-level is-unrevealed" role="img" aria-label="Level ${level.level} has not been revealed">
          <span class="master-level-index">L${level.level}</span>
          <span class="master-band-placeholder"></span>
          <span class="master-level-equation">not expanded</span>
        </div>`;
    }

    const bandWidth = Math.max(0.35, 100 * level.levelWork / visibleMaximumWork);
    const segmentWidth = 100 / Math.min(level.nodes, MAX_VISIBLE_SEGMENTS);
    const previousRelation = level.level === 0
      ? "root level"
      : `${changePhrase(step.ratio)} from the preceding level`;
    return `
      <div class="master-level ${active ? "is-active" : ""} ${dominant ? "is-dominant" : ""}" role="img"
        aria-label="Level ${level.level}: ${formatWork(level.nodes)} ${level.nodes === 1 ? "subproblem" : "subproblems"}, ${formatWork(level.workPerNode)} work each, ${formatWork(level.levelWork)} total; ${previousRelation}">
        <span class="master-level-index">L${level.level}<small>${level.leaf ? "leaves" : level.level === 0 ? "root" : `size ${formatWork(level.subproblemSize)}`}</small></span>
        <span class="master-work-band" style="--band-width:${bandWidth}%;--segment-width:${segmentWidth}%" aria-hidden="true"></span>
        <span class="master-level-equation">
          <span><strong>${escapeHtml(formatWork(level.nodes))}</strong> × ${escapeHtml(formatWork(level.workPerNode))} each</span>
          <b>= ${escapeHtml(formatWork(level.levelWork))}</b>
        </span>
      </div>`;
  }).join("");

  const reading = showOutcome
    ? `<strong>${caseDetails.shape}</strong><span>${caseDetails.label}.</span>`
    : step.revealedThrough === 0
      ? `The next level ${branchingPrompt}, while it ${localWorkPrompt}. Which effect wins?`
      : "Band width is linear: compare the total work from one level to the next.";

  return `
    <div class="master-layout">
      <div class="master-mechanism" role="img" aria-label="Going down one level: subproblems multiply by ${step.a}, work per subproblem is divided by ${formatWork(step.perNodeDivisor)}, so total level work ${showLevelMultiplier ? `multiplies by ${formatNumber(step.ratio)}` : "is not yet revealed"}">
        <span class="master-force master-force-structure"><small>Subproblems</small><strong>×${step.a}</strong></span>
        <span class="master-force"><small>Work each</small><strong>÷${escapeHtml(formatWork(step.perNodeDivisor))}</strong></span>
        <span class="master-force master-force-total ${showLevelMultiplier ? "is-revealed" : ""}"><small>Whole level</small><strong>${showLevelMultiplier ? `×${escapeHtml(formatNumber(step.ratio))}` : "?"}</strong><em>${showLevelMultiplier ? caseDetails.trend : "predict"}</em></span>
      </div>
      <div class="master-reading ${showOutcome ? "is-outcome" : ""}">${reading}</div>
      <div class="master-profile-key"><span>divisions show branching</span><span>band width = level work</span></div>
      <div class="master-profile">${rows}</div>
    </div>`;
}

export const masterTheoremModule = {
  id: "master-theorem",
  shortTitle: "Master theorem",
  title: "Master Theorem",
  codeTitle: "Level model",
  summary: "Watch branching create more subproblems while shrinking makes each subproblem cheaper, then see which force controls the recursion tree.",
  complexity: "Determined by how work is distributed across the recursion tree",
  source: { slides: "Instructor-requested extension; not in the supplied Lecture 03 deck" },
  tags: ["recursive", "recurrence", "divide-and-conquer"],
  objective: "Explain the Master Theorem by seeing whether a recursion tree narrows, stays level, or widens toward its leaves.",
  input: {
    label: "Parameters a, b, d, n",
    hint: "Use a = 1–8, b = 2–8, d = 0–4, and n = bᵏ with 1 ≤ k ≤ 6.",
    default: "2, 2, 1, 16",
    presets: [
      { label: "2T(n/2) + n", value: "2, 2, 1, 16" },
      { label: "4T(n/2) + n", value: "4, 2, 1, 16" },
      { label: "2T(n/2) + n²", value: "2, 2, 2, 16" },
      { label: "T(n/2) + 1", value: "1, 2, 0, 16" }
    ],
    parse: parseMasterTheoremInput
  },
  pseudocode: [
    {
      line: 1,
      latex: "T(n) = aT(n/b) + n^d, \\quad T(1)=1",
      spoken: "T of n equals a times T of the quantity n divided by b, plus n to the d; T of 1 equals 1"
    },
    {
      line: 2,
      latex: "N_i = a^i \\quad \\text{(subproblems)}",
      spoken: "N sub i equals a to the i, the number of subproblems"
    },
    {
      line: 3,
      latex: "C_i = (n/b^i)^d \\quad \\text{(work each)}",
      spoken: "C sub i equals n divided by b to the i, all raised to the d, the work per subproblem"
    },
    {
      line: 4,
      latex: "W_i = N_iC_i = n^d(a/b^d)^i",
      spoken: "W sub i equals N sub i times C sub i, which equals n to the d times the quantity a divided by b to the d, raised to the i",
      basic: true,
      basicLabel: "level work"
    },
    {
      line: 5,
      latex: "W_{i+1}/W_i = a/b^d",
      spoken: "W sub i plus 1 divided by W sub i equals a divided by b to the d"
    },
    {
      line: 6,
      latex: "T(n) = \\sum_{i=0}^{\\log_b n} W_i",
      spoken: "T of n equals the sum of W sub i from i equals 0 through log base b of n"
    }
  ],
  buildTrace: buildMasterTheoremTrace,
  render: renderMasterTheorem,
  describe(step) {
    const visibleLevels = step.levels.filter((level) => level.level <= step.revealedThrough);
    const showOutcome = step.phase === "compare" || step.phase === "complete";
    const current = step.levels[step.currentLevel];
    const trend = nearlyEqual(step.ratio, 1)
      ? "stays unchanged from one level to the next"
      : nearlyEqual(step.ratio, 0.5)
        ? "halves from one level to the next"
        : nearlyEqual(step.ratio, 2)
          ? "doubles from one level to the next"
          : `is multiplied by ${formatNumber(step.ratio)} from one level to the next`;
    const summary = step.phase === "compare"
      ? `The level work ${trend}; ${CASE_DETAILS[step.masterCase].label.toLowerCase()}.`
      : step.message;
    const outcome = showOutcome
      ? `${CASE_DETAILS[step.masterCase].label}; ${step.phase === "complete" ? `T(n) is in ${step.result.text}` : "the final bound has not yet been stated"}.`
      : "not yet determined";

    return {
      summary,
      state: [
        { label: "Recurrence", value: `T(n) = ${step.a}T(n/${step.b}) + n^${step.d}; T(1) = 1` },
        { label: "Levels revealed", value: `${visibleLevels.length} of ${step.levels.length}` },
        { label: "Total levels", value: String(step.levels.length) },
        { label: "Current level", value: String(step.currentLevel) },
        { label: "Subproblems at current level", value: formatWork(current.nodes) },
        { label: "Subproblem size", value: formatWork(current.subproblemSize) },
        { label: "Work per subproblem", value: formatWork(current.workPerNode) },
        { label: "Total current-level work", value: formatWork(current.levelWork) },
        { label: "Level-work ratio", value: `${formatNumber(step.ratio)}; ${trend}` },
        { label: "Conclusion", value: outcome }
      ],
      details: visibleLevels.map((level) => (
        `Level ${level.level}: ${formatWork(level.nodes)} ${level.nodes === 1 ? "subproblem" : "subproblems"} of size ${formatWork(level.subproblemSize)}, ${formatWork(level.workPerNode)} work each, ${formatWork(level.levelWork)} total level work.`
      ))
    };
  },
  metrics(step) {
    if (step.phase === "compare" || step.phase === "complete") {
      return [{
        label: "Level work",
        value: nearlyEqual(step.ratio, 1)
          ? "ratio 1; unchanged"
          : `ratio ${formatNumber(step.ratio)}; multiplied by ${formatNumber(step.ratio)} downward`,
        emphasis: true
      }];
    }
    const level = step.levels[step.currentLevel];
    return [
      { label: "Level work", value: `W${level.level} = ${formatWork(level.levelWork)}`, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, restricted here to an exact power of b so every displayed level is complete" },
    { term: "Branching force", value: "Going down one level creates a times as many subproblems" },
    { term: "Shrinking force", value: "Each subproblem does 1 / bᵈ as much local work" },
    { term: "Level work", value: "Wᵢ = aⁱ(n / bⁱ)ᵈ; the band width encodes this total" },
    { term: "Case intuition", value: "The root, all levels, or the leaves dominate according to whether the bands narrow, stay level, or widen" },
    { term: "Scope", value: "This form does not cover recurrences such as Hanoi's T(n − 1)" }
  ],
  model(step) {
    if (step.phase === "root") {
      return {
        latex: `W_0 = 1 \\cdot ${step.n}^{${step.d}} = ${formatLatexNumber(step.levels[0].levelWork)}`,
        notes: ["Begin with one problem. The question is what happens to the width of the work profile below it."]
      };
    }

    if (step.phase === "level" || step.phase === "leaf") {
      const level = step.levels[step.currentLevel];
      return {
        latex: `W_{${level.level}} = \\underbrace{${step.a}^{${level.level}}}_{\\text{subproblems}} \\; \\underbrace{\\left(\\frac{${step.n}}{${step.b}^{${level.level}}}\\right)^{${step.d}}}_{\\text{work each}} = ${formatLatexNumber(level.levelWork)}`,
        notes: [`One level down multiplies the number of pieces by ${step.a} and divides each piece's work by ${formatWork(step.perNodeDivisor)}.`]
      };
    }

    if (step.phase === "compare") {
      return {
        latex: `W_i = n^d\\left(\\frac{a}{b^d}\\right)^i, \\qquad \\frac{W_{i+1}}{W_i} = \\frac{${step.a}}{${step.b}^{${step.d}}} = ${formatNumber(step.ratio)}`,
        notes: [`The ${CASE_DETAILS[step.masterCase].shape} profile is the picture of this geometric sequence.`]
      };
    }

    if (step.masterCase === "root") {
      return {
        latex: `T(n) = n^d \\sum_{i=0}^{\\log_b n} \\left(\\frac{a}{b^d}\\right)^i \\in ${step.result.latex}`,
        notes: ["The ratio a / bᵈ < 1 is equivalent to d > log_b a; later levels form a shrinking tail after the root's nᵈ work."]
      };
    }
    if (step.masterCase === "balanced") {
      return {
        latex: `T(n) = \\underbrace{(\\log_b n + 1)}_{\\text{levels}} \\underbrace{n^d}_{\\text{work per level}} \\in ${step.result.latex}`,
        notes: ["The ratio a / bᵈ = 1 is equivalent to d = log_b a; the number of equal-width levels supplies the logarithmic factor."]
      };
    }
    return {
      latex: `W_{\\log_b n} = a^{\\log_b n} = n^{\\log_b a} \\quad\\Longrightarrow\\quad T(n) \\in ${step.result.latex}`,
      notes: ["The ratio a / bᵈ > 1 is equivalent to d < log_b a; the widening levels make the leaf level control the sum."]
    };
  }
};
