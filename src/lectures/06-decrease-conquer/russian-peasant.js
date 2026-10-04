export function parseRussianPeasantInput(raw) {
  const parts = String(raw).trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) throw new Error("Enter two positive integers n, m separated by a comma or space.");
  const [n, m] = parts.map(Number);
  if (![n, m].every((value) => Number.isInteger(value) && value >= 1 && value <= 1_000_000)) {
    throw new Error("Both n and m must be positive integers from 1 to 1,000,000.");
  }
  return { n, m };
}

export function buildRussianPeasantTrace({ n: originalN, m: originalM }) {
  const trace = [];
  const rows = [{ n: originalN, m: originalM, retained: null }];
  const selected = [];
  let n = originalN;
  let m = originalM;
  let halvings = 0;
  let result = null;
  function emit(phase, activeLine, message) {
    trace.push({ originalN, originalM, n, m, halvings, selected: [...selected],
      rows: rows.map((row) => ({ ...row })), result, phase, activeLine, message });
  }
  emit("initial", 1, `Start with n = ${n}, m = ${m}, and no retained terms.`);
  while (true) {
    emit("condition", 2, `Test n > 1: ${n} > 1 is ${n > 1 ? "true" : "false"}.`);
    if (n === 1) break;
    const odd = n % 2 === 1;
    rows.at(-1).retained = odd;
    if (odd) selected.push(m);
    emit("select", 3, odd ? `n = ${n} is odd; retain m = ${m} for the final sum.`
      : `n = ${n} is even; this row contributes no retained term.`);
    const beforeN = n;
    const beforeM = m;
    n = Math.floor(n / 2);
    m *= 2;
    halvings += 1;
    rows.push({ n, m, retained: null });
    emit("halve", 4, `Set n = ⌊${beforeN}/2⌋ = ${n} and m = 2 × ${beforeM} = ${m}.`);
  }
  rows.at(-1).retained = true;
  selected.push(m);
  emit("base", 5, `n = 1 is the base case; retain m = ${m}.`);
  result = selected.reduce((sum, term) => sum + term, 0);
  emit("complete", 6, `Sum the retained terms: ${selected.join(" + ")} = ${result}; return ${result}.`);
  return trace;
}

function selectionText(row) {
  return row.retained === null ? "not evaluated" : row.retained ? String(row.m) : "omit: even n";
}

function renderPeasantLedger(step) {
  const nWidth = Math.max(72, ...step.rows.map((row) => String(row.n).length * 9 + 50));
  const mWidth = Math.max(70, ...step.rows.map((row) => String(row.m).length * 9 + 12));
  const termWidth = Math.max(115, ...step.rows.map((row) => String(row.m).length * 9 + 24));
  let seenRetained = false;
  const ledger = step.rows.map((row, index) => {
    const current = index === step.rows.length - 1 && step.phase !== "complete";
    const selecting = current && ["select", "base"].includes(step.phase);
    const retained = row.retained === true;
    const parity = row.retained === null ? "" : row.n === 1 ? "base" : row.n % 2 ? "odd" : "even";
    const rowClasses = ["peasant-ledger-row", current ? "is-current" : "", selecting ? "is-selecting" : ""].filter(Boolean).join(" ");
    const transition = index > 0 ? `<div class="peasant-ledger-transition ${current && step.phase === "halve" ? "is-counted" : ""}">
      <span class="peasant-halving-arrow">↓ <small>⌊n/2⌋</small></span><span></span>
      <span class="peasant-doubling-arrow">↓ <small>×2</small></span><span></span>
      <span class="peasant-term-rail ${seenRetained ? "is-linked" : ""}" aria-hidden="true"></span>
    </div>` : "";
    if (retained) seenRetained = true;
    return `${transition}<div class="${rowClasses}">
      <div class="peasant-ledger-number peasant-n"${current && !(selecting && retained) ? " data-active-visual" : ""}><strong>${row.n}</strong><small>${parity}</small></div><span></span>
      <div class="peasant-ledger-number peasant-m"><strong>${row.m}</strong></div>
      <span class="peasant-retain-arrow" aria-hidden="true">${retained ? "→" : ""}</span>
      <div class="peasant-ledger-term ${retained ? "is-retained" : row.retained === false ? "is-omitted" : "is-pending"} ${seenRetained ? "is-linked" : ""}"${selecting && retained ? " data-active-visual" : ""}>${retained ? `<strong>${row.m}</strong>` : row.retained === false ? "× omit" : "—"}</div>
    </div>`;
  }).join("");
  return `<div class="decrease-layout peasant-board">
    <div class="peasant-ledger-scroll" data-visual-scroll>
      <div class="peasant-ledger" style="--peasant-n-width:${nWidth}px;--peasant-m-width:${mWidth}px;--peasant-term-width:${termWidth}px">
        <div class="peasant-ledger-head"><span>n</span><span></span><span>m</span><span></span><span>Retained terms</span></div>
        ${ledger}
        <div class="peasant-sum-row"><span></span><span></span><span></span><span></span>
          <div class="peasant-sum ${step.result === null ? "" : "is-complete"}"${step.phase === "complete" ? " data-active-visual" : ""}>
            <span class="peasant-sum-link ${seenRetained ? "is-linked" : ""}" aria-hidden="true"></span>
            ${step.result === null ? '<small>sum at the end</small>' : `<small>${step.selected.join(" + ")}</small><strong>= ${step.result}</strong>`}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export const russianPeasantModule = {
  id: "russian-peasant",
  shortTitle: "Russian peasant multiplication",
  title: "Russian Peasant Multiplication",
  summary: "Halve n, double m, and retain the m values from odd rows for the final product.",
  complexity: "Θ(log n) halvings",
  source: { slides: "81–89" },
  objective: "Explain how the even and odd reductions preserve the product and how many times n is halved.",
  codeTitle: "Multiplication procedure (reconstructed)",
  input: {
    label: "Positive integers n, m",
    hint: "Enter n and m from 1 to 1,000,000. The procedure stops at n = 1 and sums retained terms at the end.",
    default: "20,26",
    presets: [
      { label: "Lecture: 20 × 26", value: "20,26" },
      { label: "Odd start", value: "21,26" },
      { label: "Base case", value: "1,26" }
    ],
    parse: parseRussianPeasantInput
  },
  pseudocode: [
    { line: 1, text: "selected ← empty list" },
    { line: 2, text: "while n > 1 do" },
    { line: 3, text: "if n is odd: append m to selected", indent: 1 },
    { line: 4, text: "n ← ⌊n / 2⌋; m ← 2m", indent: 1, basic: true, basicLabel: "halving (structural reduction)" },
    { line: 5, text: "append m to selected  // n = 1" },
    { line: 6, text: "return sum(selected)" }
  ],
  buildTrace: buildRussianPeasantTrace,
  render: renderPeasantLedger,
  describe(step) {
    const currentRow = step.rows.at(-1);
    return {
      summary: step.message,
      state: [
        { label: "Original factors", value: `n = ${step.originalN}; m = ${step.originalM}` },
        { label: "Current factors", value: `n = ${step.n}; m = ${step.m}` },
        { label: "Current row", value: step.phase === "complete" ? "complete" : String(step.rows.length) },
        { label: "Current row decision", value: currentRow.retained === null ? "not evaluated" : currentRow.retained ? `retain ${currentRow.m}` : "omit: n is even" },
        { label: "Rows", value: step.rows.map((row, index) => `Row ${index + 1}: n = ${row.n}, m = ${row.m}, retained term = ${selectionText(row)}`).join("; ") },
        { label: "Row transitions", value: step.rows.length > 1 ? step.rows.slice(1).map((row, index) => {
          const before = step.rows[index];
          return `Row ${index + 1} → ${index + 2}: n = ⌊${before.n}/2⌋ = ${row.n}; m = 2 × ${before.m} = ${row.m}`;
        }).join("; ") : "none" },
        { label: "Retained terms", value: step.selected.length ? step.selected.join(" + ") : "none" },
        { label: "Halvings", value: String(step.halvings) },
        { label: "Final sum", value: step.result === null ? "not summed" : `${step.selected.join(" + ")} = ${step.result}` },
        { label: "Result", value: step.result === null ? "not returned" : String(step.result) }
      ]
    };
  },
  metrics: (step) => [{ label: "Halvings", value: step.halvings, emphasis: true }],
  model(step) {
    if (step.phase !== "complete") return {
      latex: "P(n,m)=\\begin{cases}P(n/2,2m)&n>1\\text{ even}\\\\P((n-1)/2,2m)+m&n>1\\text{ odd}\\\\m&n=1\\end{cases}",
      notes: ["The lecture retains m for each odd row and for n = 1, then adds those terms."]
    };
    return {
      latex: `\\begin{gathered}${step.originalN}\\cdot${step.originalM}=${step.selected.join("+")}=${step.result}\\\\H(n)=H(\\lfloor n/2\\rfloor)+1\\ (n>1),\\quad H(1)=0\\\\H(n)=\\lfloor\\log_2 n\\rfloor\\in\\Theta(\\log n)\\end{gathered}`,
      notes: ["H counts halvings, a structural reduction chosen for this visualization; the lecture specifies no basic operation.", "The base row n = 1 is retained without a further halving."]
    };
  },
  analysis: [
    { term: "Input", value: "Two positive integers n and m; the halving count depends on n" },
    { term: "Counted quantity", value: "Halvings of n, explicitly a structural reduction rather than a lecture-defined basic operation" },
    { term: "Even case", value: "P(n,m) = P(n/2,2m)" },
    { term: "Odd case", value: "P(n,m) = P((n−1)/2,2m) + m" },
    { term: "Base case", value: "P(1,m) = m; no halving is performed" },
    { term: "Convention", value: "The iterative row-building and final summation procedure is reconstructed from slides 81–89" },
    { term: "Generalization", value: "Under unit-cost arithmetic, H(n) = ⌊log₂ n⌋ halvings; this structural count extends the deck's worked table" }
  ]
};
