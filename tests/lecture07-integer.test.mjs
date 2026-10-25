import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import {
  buildIntegerMultiplicationTrace, parseIntegerMultiplicationInput,
  integerMultiplicationModule, projectIntegerMultiplication
} from "../src/lectures/07-divide-conquer/integer-multiplication.js";

const stateValue = (step, label) => integerMultiplicationModule.describe(step).state.find((row) => row.label === label)?.value;

test("both source integer decompositions retain the correct three products and cross coefficient", () => {
  for (const expected of [
    { a: "23", b: "14", n: 2, h: 1, a1: "2", a0: "3", b1: "1", b0: "4", m2: "2", m0: "12", sumA: "5", sumB: "5", s: "25", m1: "11", term2: "200", term1: "110", term0: "12", result: "322" },
    { a: "1234", b: "5678", n: 4, h: 2, a1: "12", a0: "34", b1: "56", b0: "78", m2: "672", m0: "2652", sumA: "46", sumB: "134", s: "6164", m1: "2840", term2: "6720000", term1: "284000", term0: "2652", result: "7006652" }
  ]) {
    const trace = buildIntegerMultiplicationTrace(expected);
    const final = trace.at(-1);
    for (const [key, value] of Object.entries(expected)) assert.equal(final[key], value, key);
    assert.equal(final.products, 3);
    assert.deepEqual(trace.filter((step) => step.products && ["high-product", "low-product", "sum-product"].includes(step.phase)).map((step) => [step.phase, step.products]), [["high-product", 1], ["low-product", 2], ["sum-product", 3]]);
    assert.notEqual(final.m0, final.m2, "do not repeat slide 63's incorrect low-product operand");
    assert.equal(BigInt(final.m1), BigInt(final.a1) * BigInt(final.b0) + BigInt(final.a0) * BigInt(final.b1));
  }
});

test("count only actual top-level products and retain each result after its event", () => {
  const trace = buildIntegerMultiplicationTrace({ a: "1234", b: "5678" });
  const countedPhases = new Map([["high-product", 4], ["low-product", 5], ["sum-product", 7], ["base-product", 1]]);
  for (let i = 0; i < trace.length; i += 1) {
    const step = trace[i];
    assert.equal(step.products - (trace[i - 1]?.products ?? 0), countedPhases.has(step.phase) ? 1 : 0);
    if (countedPhases.has(step.phase)) assert.equal(step.activeLine, countedPhases.get(step.phase));
    for (const field of ["m2", "m0", "s", "m1", "term2", "term1", "term0", "result"]) {
      if (trace[i - 1]?.[field] !== null && i > 0) assert.equal(step[field], trace[i - 1][field], `${field} is retained`);
    }
  }
  assert.deepEqual(trace.map((step) => step.phase), ["initial", "pad", "split", "high-product", "low-product", "sum-operands", "sum-product", "cross", "shift", "complete"]);
  assert.equal(trace.find((step) => step.phase === "sum-operands").s, null);
  assert.equal(trace.find((step) => step.phase === "cross").term2, null);
  assert.equal(trace.find((step) => step.phase === "shift").result, null);
});

test("padding, zero, carries, and eight-digit factors produce exact serializable snapshots", () => {
  const cases = [
    { a: "123", b: "4", paddedA: "0123", paddedB: "0004", n: 4 },
    { a: "99", b: "99", paddedA: "99", paddedB: "99", n: 2 },
    { a: "0", b: "23", paddedA: "00", paddedB: "23", n: 2 },
    { a: "99999999", b: "99999999", paddedA: "99999999", paddedB: "99999999", n: 8 },
    { a: "1000000", b: "1", paddedA: "01000000", paddedB: "00000001", n: 8 }
  ];
  for (const input of cases) {
    const trace = buildIntegerMultiplicationTrace(input);
    const final = trace.at(-1);
    assert.equal(final.n, input.n);
    assert.equal(final.paddedA, input.paddedA);
    assert.equal(final.paddedB, input.paddedB);
    assert.equal(final.products, 3);
    assert.equal(final.result, (BigInt(input.a) * BigInt(input.b)).toString());
    assert.deepEqual(JSON.parse(JSON.stringify(trace)), trace, "no BigInt values escape into trace snapshots");
    assert.deepEqual(trace, buildIntegerMultiplicationTrace(input));
  }
  const large = buildIntegerMultiplicationTrace(cases[3]).at(-1);
  assert.equal(large.result, "9999999800000001", "result exceeds Number.MAX_SAFE_INTEGER and must remain exact");
  assert.equal(large.sumA, "19998");
  assert.equal(large.sumB, "19998");
  assert.equal(large.m1, "199960002");
});

test("one-digit factors use exactly one direct product, including zero", () => {
  for (let a = 0; a <= 9; a += 1) for (let b = 0; b <= 9; b += 1) {
    const trace = buildIntegerMultiplicationTrace({ a: String(a), b: String(b) });
    const final = trace.at(-1);
    assert.equal(final.n, 1);
    assert.equal(final.result, String(a * b));
    assert.equal(final.products, 1);
    assert.equal(final.m2, null);
    assert.equal(final.m0, null);
    assert.equal(final.s, null);
    assert.deepEqual(trace.map((step) => step.phase), ["initial", "base-product", "complete"]);
    assert.equal(trace[1].activeLine, 1);
    assert.equal(trace[1].products - trace[0].products, 1);
  }
});

test("integer parser preserves the decimal-only domain and explicit input limits", () => {
  assert.deepEqual(parseIntegerMultiplicationInput(" 00123 | 0004 "), { a: "123", b: "4" });
  assert.deepEqual(parseIntegerMultiplicationInput("0 | 0"), { a: "0", b: "0" });
  for (const raw of ["", "23", "23,14", "23 |", "|14", "1|2|3", "-1|2", "+1|2", "1.0|2", "1e2|3", "0x10|2", "123456789|1", "000000001|1", "NaN|2", "Infinity|2", "1 2|3"]) {
    assert.throws(() => parseIntegerMultiplicationInput(raw), Error, raw);
  }
});

test("the ideal recursive digit model never masquerades as the exact worked-level count", () => {
  const trace = buildIntegerMultiplicationTrace({ a: "1234", b: "5678" });
  for (const step of trace.slice(0, -1)) {
    assert.doesNotMatch(integerMultiplicationModule.model(step).latex, /M\(n\)|1\.585/);
  }
  const model = integerMultiplicationModule.model(trace.at(-1));
  assert.match(model.latex, /P_\{\\mathrm\{top\}\}/);
  assert.match(model.latex, /M\(n\)&=3M\(n\/2\)/);
  assert.ok(model.notes.some((note) => note.includes("46 × 134") && note.includes("not a literal")));
  assert.equal(trace.at(-1).products, 3);
  const twoDigits = integerMultiplicationModule.model(buildIntegerMultiplicationTrace({ a: "23", b: "14" }).at(-1));
  assert.ok(twoDigits.notes.some((note) => note.includes("stops after one split")));
  assert.ok(twoDigits.notes.every((note) => !note.includes("not a literal")), "the two-digit example's three one-digit products do match M(2)=3");
  const base = integerMultiplicationModule.model(buildIntegerMultiplicationTrace({ a: "2", b: "3" }).at(-1));
  assert.match(base.latex, /M\(1\)&=1/);
  assert.doesNotMatch(base.latex, /M\(n\/2\)/);
});

test("integer traces and complete text states stay pure, stable, and faithful to retained relationships", () => {
  assert.equal(validateModule(integerMultiplicationModule, "07-divide-conquer"), true);
  const input = { a: "23", b: "14" };
  const trace = buildIntegerMultiplicationTrace(input);
  assert.deepEqual(input, { a: "23", b: "14" });
  const labels = integerMultiplicationModule.describe(trace[0]).state.map((row) => row.label);
  for (const step of trace) {
    const before = JSON.stringify(step);
    const description = integerMultiplicationModule.describe(step);
    assert.deepEqual(description.state.map((row) => row.label), labels);
    assert.equal(new Set(labels).size, labels.length);
    assert.equal(description.summary, step.message);
    assert.equal(stateValue(step, "Top-level products"), String(step.products));
    assert.equal(integerMultiplicationModule.metrics(step)[0].value, step.products);
    assert.equal(JSON.stringify(step), before, "description does not mutate its snapshot");
  }
  const final = trace.at(-1);
  assert.match(stateValue(final, "Cross coefficient m₁"), /25 − 2 − 12 = 11.*a₁·b₀ \+ a₀·b₁/);
  assert.equal(stateValue(final, "Recombination"), "200 + 110 + 12 = 322");
  assert.equal(stateValue(final, "Returned product"), "23 × 14 = 322");
});

test("the coefficient rectangle pairs each column half with its row half without evaluating cross products", () => {
  for (const input of [{ a: "23", b: "14" }, { a: "1234", b: "5678" }, { a: "0", b: "23" }, { a: "99999999", b: "99999999" }]) {
    const trace = buildIntegerMultiplicationTrace(input);
    for (const step of trace) {
      const before = JSON.stringify(step);
      const picture = projectIntegerMultiplication(step);
      assert.deepEqual(picture.columns.map(({ key }) => key), ["a1", "a0"]);
      assert.deepEqual(picture.rows.map(({ key }) => key), ["b1", "b0"]);
      assert.deepEqual(picture.regions.map(({ row, column, aKey, bKey }) => [row, column, aKey, bKey]), [
        [0, 0, "a1", "b1"], [0, 1, "a0", "b1"], [1, 0, "a1", "b0"], [1, 1, "a0", "b0"]
      ]);
      for (const region of picture.regions) {
        assert.equal(region.a, step[region.aKey]);
        assert.equal(region.b, step[region.bKey]);
        assert.equal(region.value, region.id === "high" ? step.m2 : region.id === "low" ? step.m0 : null);
      }
      assert.deepEqual(picture.whole.regionIds, ["high", "cross-top", "cross-bottom", "low"]);
      assert.deepEqual(picture.whole.factors, [step.sumA, step.sumB]);
      assert.equal(picture.whole.value, step.s);
      assert.equal(JSON.stringify(step), before, "the visual proof adds no operation and changes no retained result");
      assert.deepEqual(picture, projectIntegerMultiplication(step));
    }
  }
});

test("removing the two known corners leaves exactly the two formal cross regions", () => {
  const trace = buildIntegerMultiplicationTrace({ a: "1234", b: "5678" });
  for (const step of trace) {
    const picture = projectIntegerMultiplication(step);
    const recovered = step.m1 !== null;
    assert.deepEqual(picture.cross.removedIds, recovered ? ["high", "low"] : []);
    assert.deepEqual(picture.cross.retainedIds, ["cross-top", "cross-bottom"]);
    assert.deepEqual(picture.cross.terms, ["a₀·b₁", "a₁·b₀"]);
    assert.deepEqual(picture.regions.filter(({ removed }) => removed).map(({ id }) => id), recovered ? ["high", "low"] : []);
    if (recovered) {
      assert.equal(picture.cross.value, "2840");
      assert.equal(BigInt(step.s) - BigInt(step.m2) - BigInt(step.m0), BigInt(step.m1));
      assert.equal(step.products, 3, "recovering the formal cross pair does not add a fourth product");
    }
  }
  const cross = trace.find((step) => step.phase === "cross");
  assert.match(stateValue(cross, "Corners removed"), /top-left m₂ = 672.*bottom-right m₀ = 2652.*once/);
  assert.match(stateValue(cross, "Cross region group"), /top-right a₀·b₁.*bottom-left a₁·b₀.*neither region is multiplied separately/);
});

test("the decimal ledger aligns overlapping integer coefficients by their shifts and preserves carries", () => {
  for (const input of [{ a: "23", b: "14" }, { a: "1234", b: "5678" }, { a: "0", b: "23" }, { a: "99999999", b: "99999999" }]) {
    const trace = buildIntegerMultiplicationTrace(input);
    const shift = trace.find((step) => step.phase === "shift");
    const final = trace.at(-1);
    const before = projectIntegerMultiplication(trace.find((step) => step.phase === "cross"));
    assert.equal(before.ledger.active, false);
    assert.ok(before.ledger.rows.every(({ slots }) => slots.length === 0));
    for (const step of [shift, final]) {
      const picture = projectIntegerMultiplication(step);
      assert.equal(picture.mode, "place-value");
      assert.deepEqual(picture.ledger.rows.map(({ shift }) => shift), [step.n, step.h, 0]);
      for (const row of picture.ledger.rows) {
        const text = row.slots.map(({ digit }) => digit).join("");
        assert.equal(row.slots.length, picture.ledger.width);
        assert.equal(text.trim(), `${row.coefficient}${"0".repeat(row.shift)}`);
        assert.equal(BigInt(text.trim()), BigInt(row.term));
        assert.equal(row.slots.filter(({ kind }) => kind === "shift").length, row.shift);
        assert.ok(row.slots.filter(({ kind }) => kind === "shift").every(({ digit }) => digit === "0"));
      }
      assert.equal(picture.ledger.rows.reduce((sum, { term }) => sum + BigInt(term), 0n).toString(), final.result);
      assert.equal(step.products, 3);
    }
    assert.equal(projectIntegerMultiplication(shift).ledger.result, null);
    assert.equal(projectIntegerMultiplication(final).ledger.result.map(({ digit }) => digit).join("").trim(), final.result);
  }
  const source = projectIntegerMultiplication(buildIntegerMultiplicationTrace({ a: "1234", b: "5678" }).at(-1));
  assert.deepEqual(source.ledger.rows.map(({ slots }) => slots.map(({ digit }) => digit).join("")), ["6720000", " 284000", "   2652"]);
  assert.equal(source.ledger.result.map(({ digit }) => digit).join(""), "7006652", "add shifted integers with carries rather than concatenate coefficient blocks");
});

test("new visual relationships have stable text labels even when the rectangle is inactive", () => {
  let expected;
  for (const input of [{ a: "2", b: "3" }, { a: "0", b: "0" }, { a: "23", b: "14" }, { a: "123", b: "4" }]) {
    for (const step of buildIntegerMultiplicationTrace(input)) {
      const labels = integerMultiplicationModule.describe(step).state.map(({ label }) => label);
      expected ??= labels;
      assert.deepEqual(labels, expected);
      for (const label of ["Product regions", "Whole product rectangle", "Corners removed", "Cross region group", "Place-value alignment"]) assert.ok(stateValue(step, label));
      if (step.n === 1) {
        assert.equal(projectIntegerMultiplication(step).mode, "base");
        assert.equal(projectIntegerMultiplication(step).regions.length, 0);
        assert.equal(stateValue(step, "Product regions"), "not used in the one-digit base case");
      }
    }
  }
});
