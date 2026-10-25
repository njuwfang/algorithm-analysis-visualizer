export function parseIntegerMultiplicationInput(raw) {
  const parts = String(raw).trim().split("|").map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !part)) {
    throw new Error("Enter two nonnegative decimal integers separated by |, for example 23 | 14.");
  }
  if (parts.some((part) => !/^\d{1,8}$/.test(part))) {
    throw new Error("Each factor must contain 1–8 decimal digits (0–9), without signs or decimal points.");
  }
  return { a: BigInt(parts[0]).toString(), b: BigInt(parts[1]).toString() };
}

export function buildIntegerMultiplicationTrace(input) {
  const { a, b } = parseIntegerMultiplicationInput(`${input.a} | ${input.b}`);
  const longest = Math.max(a.length, b.length);
  const n = longest === 1 ? 1 : longest + longest % 2;
  const h = n === 1 ? 0 : n / 2;
  const trace = [];
  const state = {
    a, b, n, h, paddedA: null, paddedB: null, base: null,
    a1: null, a0: null, b1: null, b0: null,
    sumA: null, sumB: null, m2: null, m0: null, s: null, m1: null,
    term2: null, term1: null, term0: null, baseProduct: null,
    result: null, products: 0
  };
  const emit = (phase, activeLine, message) => trace.push({ ...state, phase, activeLine, message });
  emit("initial", 1, n === 1
    ? `Both factors have one digit: ${a} and ${b}; use the direct base product.`
    : `Multiply ${a} by ${b} using one three-product decomposition.`);

  if (n === 1) {
    state.baseProduct = (BigInt(a) * BigInt(b)).toString();
    state.products = 1;
    emit("base-product", 1, `Evaluate the direct product ${a} × ${b} = ${state.baseProduct}.`);
    state.result = state.baseProduct;
    emit("complete", null, `Return ${state.result}; the one-digit base case used one top-level product.`);
    return trace;
  }

  state.paddedA = a.padStart(n, "0");
  state.paddedB = b.padStart(n, "0");
  state.base = (10n ** BigInt(h)).toString();
  emit("pad", 2, `Use common even width n = ${n}: a = ${state.paddedA}, b = ${state.paddedB}; h = ${h}.`);

  state.a1 = BigInt(state.paddedA.slice(0, h)).toString();
  state.a0 = BigInt(state.paddedA.slice(h)).toString();
  state.b1 = BigInt(state.paddedB.slice(0, h)).toString();
  state.b0 = BigInt(state.paddedB.slice(h)).toString();
  emit("split", 3, `Split into ${h}-digit halves: a₁ = ${state.a1}, a₀ = ${state.a0}; b₁ = ${state.b1}, b₀ = ${state.b0}.`);

  state.m2 = (BigInt(state.a1) * BigInt(state.b1)).toString();
  state.products += 1;
  emit("high-product", 4, `Evaluate m₂ = ${state.a1} × ${state.b1} = ${state.m2}.`);

  state.m0 = (BigInt(state.a0) * BigInt(state.b0)).toString();
  state.products += 1;
  emit("low-product", 5, `Evaluate m₀ = ${state.a0} × ${state.b0} = ${state.m0}.`);

  state.sumA = (BigInt(state.a1) + BigInt(state.a0)).toString();
  state.sumB = (BigInt(state.b1) + BigInt(state.b0)).toString();
  emit("sum-operands", 6, `Add the halves: ${state.a1} + ${state.a0} = ${state.sumA}; ${state.b1} + ${state.b0} = ${state.sumB}.`);

  state.s = (BigInt(state.sumA) * BigInt(state.sumB)).toString();
  state.products += 1;
  emit("sum-product", 7, `Evaluate s = ${state.sumA} × ${state.sumB} = ${state.s}.`);

  state.m1 = (BigInt(state.s) - BigInt(state.m2) - BigInt(state.m0)).toString();
  emit("cross", 8, `Recover m₁ = s − m₂ − m₀ = ${state.s} − ${state.m2} − ${state.m0} = ${state.m1}.`);

  state.term2 = (BigInt(state.m2) * 10n ** BigInt(n)).toString();
  state.term1 = (BigInt(state.m1) * 10n ** BigInt(h)).toString();
  state.term0 = state.m0;
  emit("shift", 9, `Apply decimal place values: m₂·10ⁿ = ${state.term2}; m₁·10ʰ = ${state.term1}; m₀ = ${state.term0}.`);

  state.result = (BigInt(state.term2) + BigInt(state.term1) + BigInt(state.term0)).toString();
  emit("complete", 10, `Add ${state.term2} + ${state.term1} + ${state.term0} = ${state.result}; return ${state.result}.`);
  return trace;
}

const computed = (value) => value === null ? "not computed" : value;

export function projectIntegerMultiplication(step) {
  if (step.n === 1) return { mode: "base", columns: [], rows: [], regions: [], whole: null, cross: null, ledger: null };
  const recovered = step.m1 !== null;
  const regions = [
    { id: "high", row: 0, column: 0, aKey: "a1", bKey: "b1", term: "a₁·b₁", coefficient: "m₂", value: step.m2, corner: true },
    { id: "cross-top", row: 0, column: 1, aKey: "a0", bKey: "b1", term: "a₀·b₁", coefficient: null, value: null, corner: false },
    { id: "cross-bottom", row: 1, column: 0, aKey: "a1", bKey: "b0", term: "a₁·b₀", coefficient: null, value: null, corner: false },
    { id: "low", row: 1, column: 1, aKey: "a0", bKey: "b0", term: "a₀·b₀", coefficient: "m₀", value: step.m0, corner: true }
  ].map((region) => ({ ...region, a: step[region.aKey], b: step[region.bKey], removed: recovered && region.corner }));
  const ledgerRows = [
    { key: "m2", label: "m₂", coefficient: step.m2, shift: step.n, term: step.term2 },
    { key: "m1", label: "m₁", coefficient: step.m1, shift: step.h, term: step.term1 },
    { key: "m0", label: "m₀", coefficient: step.m0, shift: 0, term: step.term0 }
  ];
  const shifted = step.term2 !== null;
  const width = shifted ? Math.max(...ledgerRows.map((row) => row.coefficient.length + row.shift), step.result?.length ?? 0) : 0;
  const slots = (text, shift = 0) => [...text.padStart(width, " ")].map((digit, index) => ({
    digit, kind: digit === " " ? "empty" : index >= width - shift ? "shift" : "coefficient"
  }));
  return {
    mode: shifted ? "place-value" : "rectangle",
    columns: [{ symbol: "a₁", key: "a1", value: step.a1 }, { symbol: "a₀", key: "a0", value: step.a0 }],
    rows: [{ symbol: "b₁", key: "b1", value: step.b1 }, { symbol: "b₀", key: "b0", value: step.b0 }],
    regions,
    whole: { factors: [step.sumA, step.sumB], value: step.s, regionIds: regions.map(({ id }) => id) },
    cross: { value: step.m1, removedIds: recovered ? ["high", "low"] : [], retainedIds: ["cross-top", "cross-bottom"], terms: ["a₀·b₁", "a₁·b₀"] },
    ledger: {
      active: shifted, width,
      rows: ledgerRows.map((row) => ({ ...row, slots: shifted ? slots(`${row.coefficient}${"0".repeat(row.shift)}`, row.shift) : [] })),
      result: step.result === null ? null : slots(step.result)
    }
  };
}

function regionDrawing(step, region) {
  const current = region.id === "high" && step.phase === "high-product" || region.id === "low" && step.phase === "low-product";
  const classes = ["dc-integer-region", region.corner ? "is-corner" : "is-cross", current ? "is-current" : "", region.removed ? "is-removed" : "", !region.corner && step.m1 !== null ? "is-survivor" : ""].filter(Boolean).join(" ");
  const value = region.value === null ? "?" : region.value;
  return `<div class="${classes}" data-region="${region.id}"${current ? " data-active-visual" : ""}>
    ${region.corner
      ? `${region.removed ? `<span class="dc-integer-remove">subtract ${region.coefficient}</span>` : `<span class="dc-integer-region-name">${region.coefficient} = ${region.term}</span>`}<strong class="dc-integer-region-value ${current ? "is-counted" : ""}">${region.removed ? `<del>${value}</del>` : region.a === null ? "?" : `${region.a} × ${region.b} = ${value}`}</strong>`
      : `<strong>${region.term}</strong><small>${step.m1 === null ? "cross term" : "keep"}</small>`}
  </div>`;
}

function proofEquation(step) {
  return step.m1 === null ? "m₁ = s − m₂ − m₀" : `m₁ = ${step.s} − ${step.m2} − ${step.m0} = ${step.m1}`;
}

function rectangleDrawing(step, projection) {
  const sumCurrent = ["sum-operands", "sum-product"].includes(step.phase);
  const factors = step.sumA === null ? "(a₁+a₀) × (b₁+b₀)" : `${step.sumA} × ${step.sumB}`;
  return `<div class="dc-integer-area-caption"><span>Coefficient products; place values added later</span><small>schematic, not to scale</small></div>
    <div class="dc-integer-plane">
      <div class="dc-integer-plane-key">×</div>
      <div class="dc-integer-column-heads">${projection.columns.map(({ symbol, value }) => `<span>${symbol} = <strong>${value ?? "?"}</strong></span>`).join("")}</div>
      <div class="dc-integer-row-heads">${projection.rows.map(({ symbol, value }) => `<span>${symbol}<strong>${value ?? "?"}</strong></span>`).join("")}</div>
      <div class="dc-integer-whole ${sumCurrent ? "is-current" : ""} ${step.phase === "sum-product" ? "is-counted" : ""}"${sumCurrent ? " data-active-visual" : ""}>
        <div class="dc-integer-rectangle">${projection.regions.map((region) => regionDrawing(step, region)).join("")}</div>
        <div class="dc-integer-whole-label"><span>whole s = ${factors}</span><strong>${step.s === null ? "" : `= ${step.s}`}</strong></div>
      </div>
    </div>
    <div class="dc-integer-cross-proof ${step.phase === "cross" ? "is-current" : ""}"${step.phase === "cross" ? " data-active-visual" : ""}>
      <span>a₀·b₁ + a₁·b₀ <span aria-hidden="true">→</span> ${step.m1 === null ? "cross pair" : "the two kept regions"}</span>
      <strong>${proofEquation(step)}</strong>
    </div>`;
}

function ledgerDrawing(step, projection) {
  const digits = (slots) => slots.map(({ digit, kind }) => `<span class="dc-integer-digit is-${kind}">${digit === " " ? "&nbsp;" : digit}</span>`).join("");
  return `<div class="dc-integer-proof-memory">
      <div class="dc-integer-mini-rectangle" aria-hidden="true"><span class="is-subtracted">−m₂</span><span>a₀b₁</span><span>a₁b₀</span><span class="is-subtracted">−m₀</span></div>
      <div><span>Whole − two corners → cross pair</span><strong>${proofEquation(step)}</strong></div>
    </div>
    <div class="dc-integer-ledger ${step.phase === "shift" ? "is-current" : "is-complete"}" style="--dc-integer-digits:${projection.ledger.width}"${step.phase === "shift" ? " data-active-visual" : ""}>
      <div class="dc-integer-ledger-head"><span>Decimal place values</span><span>ones ↓</span></div>
      ${projection.ledger.rows.map((row) => `<div class="dc-integer-ledger-row"><span class="dc-integer-shift-label">${row.label}${row.shift ? ` × 10<sup>${row.shift}</sup>` : ""}</span><div class="dc-integer-digit-row">${digits(row.slots)}</div></div>`).join("")}
      <div class="dc-integer-ledger-result"><span>${step.result === null ? "sum next" : "sum"}</span><div class="dc-integer-digit-row">${projection.ledger.result === null ? `<span class="dc-integer-sum-pending">?</span>` : digits(projection.ledger.result)}</div></div>
      <div class="dc-integer-zero-key"><span aria-hidden="true">00</span> appended zeros show the decimal shifts</div>
    </div>`;
}

function renderIntegerMultiplication(step) {
  if (step.n === 1) return `<div class="dc-integer-board dc-integer-base-board">
    <div class="dc-integer-base-label">One decimal digit per factor</div>
    <div class="dc-integer-base-product ${step.phase === "base-product" ? "is-current" : ""}">
      <span class="dc-integer-base-factor">${step.a}</span><span>×</span><span class="dc-integer-base-factor">${step.b}</span>
      <span aria-hidden="true">→</span><strong class="dc-integer-base-value ${step.phase === "base-product" ? "is-counted" : ""} ${step.phase === "complete" ? "is-complete" : ""}"${step.phase === "base-product" ? " data-active-visual" : ""}>${step.baseProduct ?? "?"}</strong>
    </div>
    <div class="dc-integer-base-caption">Direct product; no split</div>
  </div>`;

  const projection = projectIntegerMultiplication(step);
  const padded = step.paddedA !== null && (step.paddedA !== step.a || step.paddedB !== step.b);
  return `<div class="dc-integer-board">
    <div class="dc-integer-inputs">${step.a1 === null
      ? `<span>${padded ? "padded " : ""}a = ${step.paddedA ?? step.a}</span><span>b = ${step.paddedB ?? step.b}</span>`
      : `<span>a = ${step.a1}·10<sup>${step.h}</sup> + ${step.a0}</span><span>b = ${step.b1}·10<sup>${step.h}</sup> + ${step.b0}</span>`}<span class="dc-integer-width">n = ${step.n}, h = ${step.h}</span></div>
    ${projection.mode === "place-value" ? ledgerDrawing(step, projection) : rectangleDrawing(step, projection)}
  </div>`;
}

function describeIntegerMultiplication(step) {
  const baseCase = step.n === 1;
  const split = step.a1 !== null;
  const projection = projectIntegerMultiplication(step);
  return {
    summary: step.message,
    state: [
      { label: "Input factors", value: `a = ${step.a}; b = ${step.b}` },
      { label: "Digit width n", value: `${step.n}${baseCase ? "; one-digit base case" : `; h = n/2 = ${step.h}`}` },
      { label: "Padded factors", value: baseCase ? "not needed" : step.paddedA === null ? "not padded" : `a = ${step.paddedA}; b = ${step.paddedB}` },
      { label: "Split factors", value: baseCase ? "not needed" : !split ? "not split" : `a = ${step.a1}·${step.base} + ${step.a0}; b = ${step.b1}·${step.base} + ${step.b0}` },
      { label: "High and low halves", value: baseCase ? "not needed" : !split ? "not split" : `a₁ = ${step.a1}; a₀ = ${step.a0}; b₁ = ${step.b1}; b₀ = ${step.b0}; each padded half occupies ${step.h} digits` },
      { label: "Product regions", value: baseCase ? "not used in the one-digit base case" : `Schematic rectangle, not to scale; columns a₁,a₀; rows b₁,b₀. ${projection.regions.map((region) => `${region.row === 0 ? "top" : "bottom"}-${region.column === 0 ? "left" : "right"}: ${region.term}${region.a === null ? "" : ` with ${region.aKey} = ${region.a}, ${region.bKey} = ${region.b}`}; ${region.corner ? `${region.coefficient} = ${computed(region.value)}` : "not evaluated separately"}`).join(". ")}` },
      { label: "Whole product rectangle", value: baseCase ? "not used in the one-digit base case" : `s = (a₁+a₀)·(b₁+b₀) covers all four unweighted coefficient products; decimal place values are applied later; ${step.s === null ? "not computed" : `${step.sumA} × ${step.sumB} = ${step.s}`}` },
      { label: "Corners removed", value: baseCase ? "not used in the one-digit base case" : projection.cross.removedIds.length ? `Subtract top-left m₂ = ${step.m2} and bottom-right m₀ = ${step.m0} once from s; both product values remain retained` : "none; no corner has been subtracted from s yet" },
      { label: "Cross region group", value: baseCase ? "not used in the one-digit base case" : `top-right a₀·b₁ plus bottom-left a₁·b₀; together m₁ = ${computed(step.m1)}; neither region is multiplied separately` },
      { label: "High product m₂", value: baseCase ? "not needed" : step.m2 === null ? "m₂ = a₁·b₁; not computed" : `m₂ = ${step.a1} × ${step.b1} = ${step.m2}` },
      { label: "Low product m₀", value: baseCase ? "not needed" : step.m0 === null ? "m₀ = a₀·b₀; not computed" : `m₀ = ${step.a0} × ${step.b0} = ${step.m0}` },
      { label: "Sum operands", value: baseCase ? "not needed" : step.sumA === null ? "a₁+a₀ and b₁+b₀; not added" : `${step.a1} + ${step.a0} = ${step.sumA}; ${step.b1} + ${step.b0} = ${step.sumB}` },
      { label: "Sum product s", value: baseCase ? "not needed" : step.s === null ? "s = (a₁+a₀)·(b₁+b₀); not computed" : `s = ${step.sumA} × ${step.sumB} = ${step.s}` },
      { label: "Cross coefficient m₁", value: baseCase ? "not needed" : step.m1 === null ? "m₁ = s − m₂ − m₀; not computed" : `m₁ = ${step.s} − ${step.m2} − ${step.m0} = ${step.m1}; this equals a₁·b₀ + a₀·b₁` },
      { label: "Place-value terms", value: baseCase ? "not needed" : step.term2 === null ? "m₂·10ⁿ, m₁·10ʰ, m₀; not shifted" : `m₂·10^${step.n} = ${step.term2}; m₁·10^${step.h} = ${step.term1}; m₀ = ${step.term0}` },
      { label: "Place-value alignment", value: baseCase ? "not used in the one-digit base case" : !projection.ledger.active ? `not aligned yet; decimal shifts will be m₂: ${step.n}, m₁: ${step.h}, m₀: 0 places` : `Right-aligned at the ones column; ${projection.ledger.rows.map((row) => `${row.label}: coefficient ${row.coefficient}, append ${row.shift} zero${row.shift === 1 ? "" : "s"}, displayed digits ${row.slots.map(({ digit }) => digit === " " ? "·" : digit).join("")} (= ${row.term})`).join("; ")}; · marks an empty column` },
      { label: "Recombination", value: baseCase ? "not needed" : step.result === null ? "c = m₂·10ⁿ + m₁·10ʰ + m₀; not added" : `${step.term2} + ${step.term1} + ${step.term0} = ${step.result}` },
      { label: "Direct base product", value: baseCase ? computed(step.baseProduct) : "not needed" },
      { label: "Returned product", value: step.result === null ? "not returned" : `${step.a} × ${step.b} = ${step.result}` },
      { label: "Top-level products", value: String(step.products) }
    ]
  };
}

export const integerMultiplicationModule = {
  id: "integer-multiplication",
  shortTitle: "Integer multiplication",
  title: "Multiplication of Large Integers",
  summary: "Split two decimal integers and recover their product using three products at one level.",
  complexity: "M(n) = n^{log₂3} in the idealized recursive model",
  source: { slides: "51–67" },
  objective: "Recover the cross coefficient from three products and distinguish the worked decomposition from the lecture's recursive count model.",
  codeTitle: "Three-product identities (reconstructed order)",
  input: {
    label: "Decimal factors a | b",
    hint: "Use 1–8 digits per nonnegative factor. Leading zeros are ignored; pad to a common even width unless both factors have one digit.",
    default: "23 | 14",
    presets: [
      { label: "Lecture: 23 × 14", value: "23 | 14" },
      { label: "Lecture: 1234 × 5678", value: "1234 | 5678" },
      { label: "One-digit base", value: "2 | 3" },
      { label: "Zero factor", value: "0 | 23" }
    ],
    parse: parseIntegerMultiplicationInput
  },
  pseudocode: [
    { line: 1, text: "if both factors have one digit: return a · b", basic: true },
    { line: 2, text: "pad to common even width n; h ← n/2" },
    { line: 3, text: "a = a₁·10ʰ + a₀; b = b₁·10ʰ + b₀" },
    { line: 4, text: "m₂ ← a₁ · b₁", basic: true },
    { line: 5, text: "m₀ ← a₀ · b₀", basic: true },
    { line: 6, text: "u ← a₁ + a₀; v ← b₁ + b₀" },
    { line: 7, text: "s ← u · v", basic: true },
    { line: 8, text: "m₁ ← s − m₂ − m₀" },
    { line: 9, text: "t₂ ← m₂·10ⁿ; t₁ ← m₁·10ʰ; t₀ ← m₀" },
    { line: 10, text: "return t₂ + t₁ + t₀" }
  ],
  buildTrace: buildIntegerMultiplicationTrace,
  render: renderIntegerMultiplication,
  describe: describeIntegerMultiplication,
  metrics: (step) => [{ label: "Top-level products", value: step.products, emphasis: true }],
  model(step) {
    if (step.phase !== "complete") return {
      latex: step.n === 1 ? "c=a\\cdot b" : "\\begin{gathered}a=a_1 10^h+a_0,\\quad b=b_1 10^h+b_0\\\\m_1=(a_1+a_0)(b_1+b_0)-m_2-m_0\\end{gathered}",
      notes: ["Trace one decomposition: count its products; additions, subtraction, and decimal shifts do not increase the count."]
    };
    if (step.n === 1) return {
      latex: `\\begin{aligned}c&=${step.a}\\cdot${step.b}\\\\&=${step.result}\\\\P_{\\mathrm{top}}(1)&=1\\\\M(1)&=1\\end{aligned}`,
      notes: ["The one-digit base case evaluates one product, also matching the lecture's M(1) = 1."]
    };
    const carry = step.n > 1 && (step.sumA.length > step.h || step.sumB.length > step.h);
    return {
      latex: `\\begin{aligned}c&=${step.a}\\cdot${step.b}\\\\&=${step.result}\\\\P_{\\mathrm{top}}(n)&=\\begin{cases}1&n=1\\\\3&n>1\\end{cases}\\\\M(n)&=3M(n/2),\\quad M(1)=1\\\\M(2^k)&=3^k=n^{\\log_2 3}\\approx n^{1.585}\\end{aligned}`,
      notes: [
        "P_top counts only this level's products. M is the lecture's separate idealized recursive digit-product model for n = 2ᵏ.",
        carry
          ? `The sum product here is ${step.sumA} × ${step.sumB}; a sum gains a digit. The ideal equal-halves recurrence is not a literal digit-product count for this worked example.`
          : "The ideal M model recursively expands three equal-half subproblems; this view stops after one split. In general, half-sums can gain a digit."
      ]
    };
  },
  analysis: [
    { term: "Input size", value: "n is the common decimal width after left padding; two one-digit factors use the direct base case" },
    { term: "Counted operation", value: "One top-level product: m₂ = a₁b₁, m₀ = a₀b₀, or s = (a₁+a₀)(b₁+b₀); the base case evaluates a·b once" },
    { term: "Cross coefficient", value: "m₁ = s−m₂−m₀ = a₁b₀+a₀b₁; reuse the high and low products rather than compute both cross products" },
    { term: "Place values", value: "c = m₂·10ⁿ + m₁·10^(n/2) + m₀; decimal shifts are outside the product count" },
    { term: "Notation", value: "Use slide 57's high a₁, low a₀ and slide 64's m₂,m₁,m₀ throughout; the displayed evaluation order is reconstructed" },
    { term: "Source discrepancies", value: "Slide 55 exchanges the middle and low coefficient positions, slide 56 reverses the half labels, and slide 63 repeats the high product as m₀. The trace follows the consistent general identity on slide 64." },
    { term: "Recursive model", value: "Slides 65–67 give the ideal equal-halves model M(n)=3M(n/2), M(1)=1, and for n=2ᵏ derive M(n)=n^(log₂3)≈n^1.585; the trace expands one level only" },
    { term: "Carry qualification", value: "For 1234×5678, the half-sums are 46 and 134. This extra digit explains why the ideal recurrence must not be read as this example's literal digit-multiplication count" }
  ]
};
