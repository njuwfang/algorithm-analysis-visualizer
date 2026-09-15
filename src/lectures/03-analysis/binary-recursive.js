import { escapeHtml, parsePositiveInteger } from "../../core/utils.js?v=20260915-5";

export function buildBinaryRecursiveTrace(original) {
  const trace = [];
  let additions = 0;
  let calls = 0;
  const chain = [];
  let probe = original;

  while (true) {
    chain.push(probe);
    if (probe === 1) break;
    probe = Math.floor(probe / 2);
  }

  function visit(n, outerFrames) {
    calls += 1;
    const enteringFrame = { n, status: "check base case" };
    const enteringStack = [...outerFrames, enteringFrame];

    trace.push({
      activeLine: 2,
      phase: "enter",
      original,
      current: n,
      stack: enteringStack.map((frame) => ({ ...frame })),
      calls,
      additions,
      chain: [...chain],
      result: null,
      message: `Call BinRec(${n}) and test whether n = 1.`
    });

    if (n === 1) {
      const baseStack = [...outerFrames, { n, status: "return 1", returnValue: 1 }];
      trace.push({
        activeLine: 2,
        phase: "base",
        original,
        current: n,
        stack: baseStack.map((frame) => ({ ...frame })),
        calls,
        additions,
        chain: [...chain],
        result: 1,
        message: "Base case: return 1."
      });
      return 1;
    }

    const childN = Math.floor(n / 2);
    const waitingFrames = [...outerFrames, { n, status: `waiting for BinRec(${childN})` }];
    const childResult = visit(childN, waitingFrames);
    additions += 1;
    const result = childResult + 1;
    const returningStack = [...outerFrames, { n, status: `${childResult} + 1 = ${result}`, returnValue: result }];

    trace.push({
      activeLine: 3,
      phase: "return",
      original,
      current: n,
      stack: returningStack.map((frame) => ({ ...frame })),
      calls,
      additions,
      chain: [...chain],
      result,
      message: `Return ${childResult} + 1 = ${result} from BinRec(${n}).`
    });

    return result;
  }

  const result = visit(original, []);
  trace.push({
    activeLine: null,
    activeLabel: "Complete",
    phase: "complete",
    original,
    current: null,
    stack: [],
    calls,
    additions,
    chain: [...chain],
    result,
    message: `BinRec(${original}) returns ${result}; the execution used ${additions} addition${additions === 1 ? "" : "s"}.`
  });

  return trace;
}

function renderBinaryRecursive(step) {
  const frames = step.stack.length
    ? step.stack.map((frame, index) => {
        const active = index === step.stack.length - 1;
        return `
          <div class="recursion-frame ${active ? "is-active" : ""}">
            BinRec(${frame.n})
            <span class="frame-status">${escapeHtml(frame.status)}</span>
          </div>`;
      }).join("")
    : `<div class="empty-state">Call stack empty.<br>The result has returned to the caller.</div>`;

  const revealedDepth = Math.max(step.calls, 1);
  const recurrenceRows = step.chain.map((value, index) => {
    const isBase = value === 1;
    const next = isBase ? null : Math.floor(value / 2);
    const text = isBase ? "A(1) = 0" : `A(${value}) = A(${next}) + 1`;
    const active = value === step.current;
    const pending = index >= revealedDepth;
    return `<div class="recurrence-step ${active ? "is-active" : ""} ${pending ? "is-pending" : ""}">${text}</div>`;
  }).join("");

  return `
    <div class="recursive-layout">
      <div class="recursion-stack">
        <p class="mini-panel-title">Call stack — active call highlighted</p>
        <div class="recursion-frames">${frames}</div>
      </div>
      <div class="recurrence-ladder">
        <p class="mini-panel-title">Recurrence expansion</p>
        <div class="recurrence-steps">${recurrenceRows}</div>
      </div>
    </div>`;
}

export const binaryRecursiveModule = {
  id: "binary-recursive",
  shortTitle: "Binary · recursion",
  title: "Number of Binary Digits — Recursive",
  summary: "Trace the call stack and count additions while expanding A(n) = A(n/2) + 1 toward the base case.",
  complexity: "Θ(log n)",
  source: { slides: "27–29" },
  tags: ["recursive", "logarithmic", "recurrence"],
  objective: "Build an addition-count recurrence and solve it for the slides’ n = 2ᵏ case.",
  input: {
    label: "Positive decimal integer n",
    hint: "Use powers of two to match the substitution in the slides, or try another positive integer.",
    default: "16",
    presets: [
      { label: "2⁴", value: "16" },
      { label: "2⁵", value: "32" },
      { label: "Not a power of two", value: "13" },
      { label: "Base input", value: "1" }
    ],
    parse: (raw) => parsePositiveInteger(raw)
  },
  pseudocode: [
    { line: 1, text: "BinRec(n)" },
    { line: 2, text: "if n = 1 return 1", indent: 1 },
    { line: 3, text: "else return BinRec(n / 2) + 1", indent: 1, basic: true }
  ],
  buildTrace: buildBinaryRecursiveTrace,
  render: renderBinaryRecursive,
  metrics(step) {
    return [
      { label: "Additions", value: step.additions, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "The positive integer n" },
    { term: "Basic operation", value: "The addition performed after a recursive call returns" },
    { term: "Case behavior", value: "For a fixed n, the call chain is determined" },
    { term: "Recurrence", value: "A(n) = A(n/2) + 1 for n > 1, with A(1) = 0" },
    { term: "Solution", value: "For n = 2ᵏ, A(n) = k = log₂ n" }
  ],
  model(step) {
    return {
      latex: "A(n) = A\\left(\\left\\lfloor \\frac{n}{2} \\right\\rfloor\\right) + 1 \\implies A(2^k) = A(1) + k = \\log_2 n",
      notes: [
        "By the slides’ smoothness rule, choose n = 2ᵏ; repeated halving reaches 1 after exactly k steps."
      ]
    };
  }
};
