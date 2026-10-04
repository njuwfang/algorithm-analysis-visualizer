import { escapeHtml } from "../../core/utils.js";

const powerText = (a, n) => `${a < 0 ? `(${a})` : a}^${n}`;

export function parsePower(raw) {
  const parts = String(raw).trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) throw new Error("Enter the base a and exponent n, for example 2, 5.");
  const [a, n] = parts.map(Number);
  if (!Number.isInteger(a) || a === 0 || Math.abs(a) > 9) {
    throw new Error("The base a must be a nonzero integer from −9 to 9.");
  }
  if (!Number.isInteger(n) || n < 0 || n > 16) {
    throw new Error("The exponent n must be a whole number from 0 to 16.");
  }
  if (!Number.isSafeInteger(a ** n)) throw new Error("Choose a smaller base or exponent so aⁿ is an exact safe integer.");
  return { a, n };
}

export function buildPowerTrace({ a, n }, byHalf = false) {
  const trace = [];
  const frames = [];
  const returned = [];
  let multiplications = 0;
  let activeExponent = null;
  let childResult = null;
  let currentResult = null;
  let equation = "not evaluated";
  function emit(activeLine, message, phase) {
    trace.push({
      a, n, activeExponent, childResult, currentResult, equation,
      frames: frames.map((frame) => ({ ...frame })),
      returned: returned.map((item) => ({ ...item })),
      multiplications, activeLine, message, phase,
      activeLabel: phase === "ready" ? "Ready" : phase === "complete" ? "Generalize" : undefined,
      result: phase === "complete" ? currentResult : null
    });
  }
  emit(null, `Compute ${powerText(a, n)} by ${byHalf ? "halving the exponent" : "decreasing the exponent by one"}.`, "ready");
  function power(exponent) {
    activeExponent = exponent;
    childResult = null;
    currentResult = null;
    equation = powerText(a, exponent);
    frames.push({ exponent, status: "active" });
    emit(1, `Enter Power(${a}, ${exponent}).`, "call");
    if (exponent === 0) {
      currentResult = 1;
      equation = `${powerText(a, 0)} = 1`;
      frames.pop();
      returned.push({ exponent, value: 1 });
      emit(2, "The base case n=0 returns 1 without a multiplication.", "return");
      return 1;
    }
    const smaller = byHalf ? Math.floor(exponent / 2) : exponent - 1;
    frames.at(-1).status = `waiting for n=${smaller}`;
    equation = byHalf ? `${exponent} → floor(${exponent}/2) = ${smaller}` : `${exponent} → ${smaller}`;
    emit(3, `Reduce exponent ${exponent} to ${smaller}; compute that smaller power once.`, "reduce");
    const t = power(smaller);
    activeExponent = exponent;
    childResult = t;
    currentResult = null;
    frames.at(-1).status = "extending returned power";
    equation = `t = ${powerText(a, smaller)} = ${t}`;
    emit(3, `The smaller call returns t=${t} to exponent ${exponent}.`, "resume");
    let value;
    if (byHalf) {
      value = t * t;
      multiplications += 1;
      currentResult = value;
      equation = `${t} × ${t} = ${value}`;
      emit(4, `Square t=${t} once to obtain ${value}.`, "multiply");
      if (exponent % 2 === 1) {
        const square = value;
        value *= a;
        multiplications += 1;
        currentResult = value;
        equation = `${square} × ${a} = ${value}`;
        frames.pop();
        returned.push({ exponent, value });
        emit(5, `Exponent ${exponent} is odd: multiply the square by a=${a} and return ${value}.`, "multiply");
      } else {
        frames.pop();
        returned.push({ exponent, value });
        equation = `${powerText(a, exponent)} = ${value}`;
        emit(6, `Exponent ${exponent} is even: return the square ${value}.`, "return");
      }
    } else {
      value = t * a;
      multiplications += 1;
      currentResult = value;
      equation = `${t} × ${a} = ${value}`;
      frames.pop();
      returned.push({ exponent, value });
      emit(4, `Extend exponent ${exponent - 1} to ${exponent}: multiply ${t} by ${a} and return ${value}.`, "multiply");
    }
    return value;
  }
  const result = power(n);
  activeExponent = null;
  childResult = null;
  currentResult = result;
  equation = `${powerText(a, n)} = ${result}`;
  emit(null, `Return ${powerText(a, n)}=${result}; ${multiplications} multiplications.`, "complete");
  return trace;
}

export function buildPowerOneTrace(input) { return buildPowerTrace(input, false); }
export function buildPowerSquaringTrace(input) { return buildPowerTrace(input, true); }

function renderPower(step, byHalf) {
  // Keep a call at its original level when it returns, rather than making the
  // structure disappear as the runtime stack unwinds.
  const visited = new Set([step.n, ...step.frames.map(({ exponent }) => exponent), ...step.returned.map(({ exponent }) => exponent)]);
  if (step.phase === "reduce") visited.add(byHalf ? Math.floor(step.activeExponent / 2) : step.activeExponent - 1);
  const returned = new Map(step.returned.map(({ exponent, value }) => [exponent, value]));
  const levels = [...visited].sort((a, b) => b - a);
  const active = step.activeExponent ?? (step.phase === "complete" ? step.n : null);
  const rows = levels.map((exponent, index) => {
    const current = exponent === active;
    const hasResult = returned.has(exponent);
    const result = hasResult ? returned.get(exponent) : current && step.currentResult !== null ? `s=${step.currentResult}` : step.phase === "ready" ? "not called" : "waiting";
    const operation = exponent === 0 ? "base: 1" : current && step.phase === "multiply" ? byHalf && step.activeLine === 4 ? "t × t" : "× a" : byHalf ? exponent % 2 ? "square, then × a" : "square" : "× a";
    return `<div class="power-level ${current && step.phase !== "complete" ? "is-current" : ""} ${hasResult ? "is-returned" : ""} ${current && step.phase === "multiply" ? "is-counted" : ""}"${current ? " data-active-visual" : ""}>
      <span class="power-down">${index ? "↓" : ""}</span>
      <span class="power-call"><span>${escapeHtml(step.a < 0 ? `(${step.a})` : step.a)}<sup>${exponent}</sup></span><small>n=${exponent}</small></span>
      <span class="power-up">${hasResult && exponent !== 0 ? "↑" : ""}</span>
      <span class="power-return"><strong>${escapeHtml(result)}</strong>${hasResult || current && step.currentResult !== null || exponent === 0 ? `<small>${hasResult || current && step.currentResult !== null ? operation : "base case"}</small>` : ""}</span>
    </div>`;
  }).join("");
  const work = step.childResult !== null && byHalf && [3, 4].includes(step.activeLine) && ["resume", "multiply"].includes(step.phase)
    ? `<div class="power-reuse"><span class="power-child">t = ${step.childResult}</span><span class="power-fork">↙ ↘</span><span class="power-operands">${step.childResult} × ${step.childResult}</span><small>same returned t, reused</small></div>`
    : "";
  return `<div class="power-diagram">
    <div class="power-head"><span>Calls ↓ <small>${byHalf ? "⌊n/2⌋" : "n−1"}</small></span><span>Results ↑</span></div>
    <div class="power-ladder">${rows}</div>
    ${work}
    <div class="power-equation ${step.phase === "multiply" ? "is-counted" : ""} ${step.phase === "complete" ? "is-complete" : ""}">${escapeHtml(step.equation === "not evaluated" ? powerText(step.a, step.n) : step.equation)}</div>
  </div>`;
}

function describePower(step) {
  return {
    summary: step.message,
    state: [
      { label: "Base a", value: String(step.a) },
      { label: "Original exponent n", value: String(step.n) },
      { label: "Active exponent", value: step.activeExponent === null ? "none" : String(step.activeExponent) },
      { label: "Pending calls", value: step.frames.map((frame) => `Power(${step.a},${frame.exponent}): ${frame.status}`).join(" → ") || "none" },
      { label: "Returned powers", value: step.returned.map((item) => `${powerText(step.a, item.exponent)}=${item.value}`).join("; ") || "none" },
      { label: "Child result t", value: step.childResult === null ? "not evaluated" : String(step.childResult) },
      { label: "Current power result", value: step.currentResult === null ? "not evaluated" : String(step.currentResult) },
      { label: "Current equation", value: step.equation },
      { label: "Final result", value: step.result === null ? "not returned" : String(step.result) },
      { label: "Multiplications", value: String(step.multiplications) }
    ]
  };
}

const common = {
  input: {
    label: "Base a, exponent n",
    hint: "Nonzero integer a from −9 to 9; n from 0 to 16. Exact integer powers only.",
    default: "2, 5",
    presets: [
      { label: "Odd exponent", value: "2, 5" },
      { label: "Even exponent", value: "2, 8" },
      { label: "Base case", value: "2, 0" }
    ],
    parse: parsePower
  },
  describe: describePower,
  metrics: (step) => [{ label: "Multiplications", value: step.multiplications, emphasis: true }]
};

export const powerOneModule = {
  ...common,
  id: "power-decrease-one",
  shortTitle: "Power: decrease by one",
  title: "Power — Decrease by One",
  summary: "Reduce the exponent by one and multiply by a as each smaller call returns.",
  complexity: "Θ(n)",
  source: { slides: "4–5" },
  objective: "Connect the n−1 call chain and one multiplication per extension to a linear count.",
  pseudocode: [
    { line: 1, text: "Power(a, n)" },
    { line: 2, text: "if n = 0 return 1", indent: 1 },
    { line: 3, text: "t ← Power(a, n − 1)", indent: 1 },
    { line: 4, text: "return t · a", indent: 1, basic: true }
  ],
  buildTrace: buildPowerOneTrace,
  render: (step) => renderPower(step, false),
  analysis: [
    { term: "Input size", value: "Exponent n ≥ 0; a is a nonzero constant." },
    { term: "Basic operation", value: "One multiplication by a when extending the smaller power; unit-cost arithmetic." },
    { term: "Source convention", value: "Executable reconstruction of slide 5's recursive definition; n=0 returns 1." },
    { term: "Cases", value: "Exactly n multiplications for this recursive version, regardless of the value of a." },
    { term: "Model", value: "M(0)=0; M(n)=M(n−1)+1=n, so Θ(n)." }
  ],
  model(step) {
    if (step.phase !== "complete") return {
      latex: `M_{\\mathrm{seen}}=${step.multiplications},\\qquad M(n)=M(n-1)+1,\\quad M(0)=0`,
      notes: ["The base case performs no multiplication; each extension multiplies by a once."]
    };
    return {
      latex: "M(0)=0,\\quad M(n)=M(n-1)+1=\\sum_{i=1}^{n}1=n\\in\\Theta(n)",
      notes: [`The trace has performed ${step.multiplications} multiplications for exponent n=${step.n}.`, "Each return extends a smaller power once. The n=0 base case performs no multiplication."]
    };
  }
};

export const powerSquaringModule = {
  ...common,
  id: "exponentiation-squaring",
  shortTitle: "Exponentiation by squaring",
  title: "Exponentiation by Squaring",
  summary: "Compute one half-size power, reuse it in a square, and multiply by a for odd exponents.",
  complexity: "Θ(log n)",
  source: { slides: "6–7" },
  objective: "Trace a single halving call chain and count squares and odd-exponent multiplications.",
  pseudocode: [
    { line: 1, text: "Power(a, n)" },
    { line: 2, text: "if n = 0 return 1", indent: 1 },
    { line: 3, text: "t ← Power(a, ⌊n/2⌋)", indent: 1 },
    { line: 4, text: "s ← t · t", indent: 1, basic: true },
    { line: 5, text: "if n is odd return s · a", indent: 1, basic: true },
    { line: 6, text: "return s", indent: 1 }
  ],
  buildTrace: buildPowerSquaringTrace,
  render: (step) => renderPower(step, true),
  analysis: [
    { term: "Input size", value: "Exponent n ≥ 0; a is a nonzero constant." },
    { term: "Basic operation", value: "Each square and each odd-exponent multiplication by a; unit-cost arithmetic." },
    { term: "Source convention", value: "Reconstruction of slide 7: compute the smaller power once and reuse it. Integer division is ⌊n/2⌋." },
    { term: "Base case", value: "n=0 returns 1. The literal slide formula still squares 1 and multiplies by a when n=1." },
    { term: "Model", value: "M(0)=0; M(n)=M(⌊n/2⌋)+1+(n mod 2); at most two multiplications per nonzero exponent." },
    { term: "Growth", value: "Θ(log n) as n grows, as stated in the lecture." }
  ],
  model(step) {
    if (step.phase !== "complete") return {
      latex: `M_{\\mathrm{seen}}=${step.multiplications},\\qquad M(n)=M(\\lfloor n/2\\rfloor)+1+(n\\bmod 2),\\quad M(0)=0`,
      notes: ["Compute the smaller power once. One square is counted, with an additional multiplication by a for odd n."]
    };
    return {
      latex: "M(0)=0,\\quad M(n)=M(\\lfloor n/2\\rfloor)+1+(n\\bmod 2)\\in\\Theta(\\log n)",
      notes: [`The trace has performed ${step.multiplications} multiplications for exponent n=${step.n}.`, "One recursive call per level; reuse its result. For n>0 the chain has ⌊log₂ n⌋+1 nonzero exponents, each using one or two multiplications."]
    };
  }
};
