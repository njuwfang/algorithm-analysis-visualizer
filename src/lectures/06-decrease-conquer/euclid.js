import { escapeHtml } from "../../core/utils.js";

export function parseEuclid(raw) {
  const parts = String(raw).trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) throw new Error("Enter two integers m, n, for example 60, 24.");
  const [m, n] = parts.map(Number);
  if (!Number.isInteger(m) || m < 1 || m > 1_000_000 || !Number.isInteger(n) || n < 0 || n > 1_000_000) {
    throw new Error("Enter m from 1 to 1,000,000 and n from 0 to 1,000,000, both whole numbers.");
  }
  return { m, n };
}

export function buildEuclidTrace(input) {
  const trace = [];
  let { m, n } = input;
  let remainder = null;
  let operations = 0;
  let equation = "not evaluated";
  const rows = [];
  const secondArguments = [n];
  function emit(activeLine, message, phase) {
    trace.push({
      initialM: input.m, initialN: input.n, m, n, remainder, operations,
      equation, rows: rows.map((row) => ({ ...row })),
      secondArguments: [...secondArguments],
      result: phase === "complete" ? m : null, activeLine, message, phase,
      activeLabel: phase === "ready" ? "Ready" : phase === "complete" ? "Generalize" : undefined
    });
  }
  emit(null, `Compute gcd(${m},${n}); the second argument determines each decrease.`, "ready");
  emit(1, `Initialize m=${m}, n=${n}.`, "initialize");
  while (true) {
    emit(2, `n=${n}: ${n === 0 ? "the stopping condition holds" : "compute another remainder"}.`, "guard");
    if (n === 0) break;
    remainder = m % n;
    operations += 1;
    equation = `${m} mod ${n} = ${remainder}`;
    rows.push({ m, n, remainder });
    emit(3, `Evaluate ${equation}.`, "remainder");
    [m, n] = [n, remainder];
    secondArguments.push(n);
    equation = `gcd(${rows.at(-1).m},${rows.at(-1).n}) = gcd(${m},${n})`;
    emit(4, `Replace the pair with (m,n)=(${m},${n}); the gcd is preserved.`, "reduce");
  }
  equation = `gcd(${input.m},${input.n}) = ${m}`;
  emit(5, `Return ${m}; gcd(m,0)=m.`, "complete");
  return trace;
}

function twoStepRelation(step) {
  const values = step.secondArguments;
  if (values.length < 3) return "not yet two reductions";
  const first = values.at(-3);
  const last = values.at(-1);
  return `After two reductions: ${first} → ${values.at(-2)} → ${last}; ${last} ≤ ${first}/2`;
}

export const euclidModule = {
  id: "euclid-gcd",
  shortTitle: "Euclid's algorithm",
  title: "Euclid's Algorithm",
  summary: "Replace (m,n) by (n,m mod n) until the second argument is zero.",
  complexity: "Θ(log n) worst case",
  source: { slides: "8, 95" },
  objective: "Track variable-size decreases, preserved gcd, and the number of remainder evaluations.",
  input: {
    label: "Integers m, n",
    hint: "m: 1–1,000,000; n: 0–1,000,000. Stop at n=0; count m mod n.",
    default: "60, 24",
    presets: [
      { label: "Variable decreases", value: "60, 24" },
      { label: "More reductions", value: "55, 34" },
      { label: "Smaller first argument", value: "24, 60" },
      { label: "Base case", value: "60, 0" }
    ],
    parse: parseEuclid
  },
  pseudocode: [
    { line: 1, text: "Euclid(m, n)" },
    { line: 2, text: "while n ≠ 0 do", indent: 1 },
    { line: 3, text: "r ← m mod n", indent: 2, basic: true },
    { line: 4, text: "(m, n) ← (n, r)", indent: 2 },
    { line: 5, text: "return m", indent: 1 }
  ],
  buildTrace: buildEuclidTrace,
  render(step) {
    const transferring = ["remainder", "reduce"].includes(step.phase);
    const previous = step.rows.at(-1);
    const pair = (m, n, current, caption) => `<div class="euclid-pair ${current ? "is-current" : ""}"><small>${caption}</small><div><span><small>m</small><strong>${m}</strong></span><span><small>n</small><strong>${n}</strong></span></div></div>`;
    const pairs = transferring
      ? `${pair(previous.m, previous.n, step.phase === "remainder", "before")}<div class="euclid-transfer"><strong>→</strong><small>(n, r)</small></div>${pair(previous.n, previous.remainder, step.phase === "reduce", step.phase === "reduce" ? "assigned" : "next pair")}`
      : pair(step.m, step.n, step.phase !== "complete", step.phase === "complete" ? "stop: n=0" : "current pair");
    const scale = Math.max(step.initialN, 1);
    const recentArguments = step.secondArguments.slice(-3);
    const bands = recentArguments.map((value, index) => `<div class="euclid-reduction ${index === recentArguments.length - 1 ? "is-current" : ""}"${index === recentArguments.length - 1 ? " data-active-visual" : ""}>
      <span>${index ? "↓" : "n"}</span><div class="euclid-track">${value ? `<span class="euclid-band" style="width:${100 * value / scale}%"></span>` : '<span class="euclid-zero">│</span>'}</div><strong>${value}</strong>
    </div>`).join("");
    return `<div class="euclid-diagram">
      <div class="euclid-pairs">${pairs}</div>
      <div class="euclid-equation ${step.phase === "remainder" ? "is-counted" : ""} ${step.phase === "complete" ? "is-complete" : ""}">${escapeHtml(step.equation === "not evaluated" ? `gcd(${step.m},${step.n})` : step.equation)}</div>
      <div class="euclid-reductions"><p>Second argument n ↓${step.secondArguments.length > 3 ? " · latest 3 values" : ""}</p>${bands}</div>
    </div>`;
  },
  describe(step) {
    return {
      summary: step.message,
      state: [
        { label: "Original pair", value: `m=${step.initialM}, n=${step.initialN}` },
        { label: "Current pair", value: `m=${step.m}, n=${step.n}` },
        { label: "Pair replacement", value: ["remainder", "reduce"].includes(step.phase) ? `(${step.rows.at(-1).m},${step.rows.at(-1).n}) → (${step.rows.at(-1).n},${step.rows.at(-1).remainder}); ${step.phase === "remainder" ? "next assignment" : "assignment complete"}` : "none" },
        { label: "Remainder r", value: step.remainder === null ? "not evaluated" : String(step.remainder) },
        { label: "Current equation", value: step.equation },
        { label: "Second-argument sequence", value: step.secondArguments.join(" → ") },
        { label: "Two-step decrease", value: twoStepRelation(step) },
        { label: "Evaluated remainders", value: step.rows.map((row, index) => `${index + 1}: ${row.m} mod ${row.n}=${row.remainder}`).join("; ") || "none" },
        { label: "Returned gcd", value: step.result === null ? "not returned" : String(step.result) },
        { label: "Remainder evaluations", value: String(step.operations) }
      ]
    };
  },
  metrics: (step) => [{ label: "Remainder evaluations", value: step.operations, emphasis: true }],
  analysis: [
    { term: "Input size", value: "The second argument n; the input is a pair of integers (m,n)." },
    { term: "Basic operation", value: "One remainder evaluation m mod n per iteration; unit-cost integer arithmetic." },
    { term: "Source convention", value: "Executable reconstruction of slides 8 and 95; gcd(m,0)=m is the stopping rule." },
    { term: "Cases", value: "A divisible pair stops after one remainder; other pairs can take several reductions." },
    { term: "Model", value: "E(m,0)=0; E(m,n)=1+E(n,m mod n)." },
    { term: "Growth", value: "The second argument at least halves in two iterations: the deck's Θ(log n) describes worst-case growth, not every pair." }
  ],
  model(step) {
    if (step.phase !== "complete") return {
      latex: `E_{\\mathrm{seen}}=${step.operations},\\qquad E(m,n)=1+E(n,m\\bmod n),\\quad E(m,0)=0`,
      notes: ["Each remainder gives one smaller pair. The second argument may decrease by a different amount each time."]
    };
    return {
      latex: "E(m,0)=0,\\quad E(m,n)=1+E(n,m\\bmod n),\\quad E_w(n)\\in\\Theta(\\log n)",
      notes: [`The trace has evaluated ${step.operations} remainders for (${step.initialM},${step.initialN}).`, "The reduction size varies. Over two iterations the second argument is at most half its earlier value; an individual trace may finish sooner."]
    };
  }
};
