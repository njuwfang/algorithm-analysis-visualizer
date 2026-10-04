import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import {
  buildRussianPeasantTrace,
  parseRussianPeasantInput,
  russianPeasantModule
} from "../src/lectures/06-decrease-conquer/russian-peasant.js";

test("Russian peasant multiplication reproduces the lecture rows and retained sum", () => {
  const trace = buildRussianPeasantTrace(parseRussianPeasantInput("20,26"));
  const final = trace.at(-1);
  assert.deepEqual(final.rows.map(({ n, m }) => [n, m]), [[20, 26], [10, 52], [5, 104], [2, 208], [1, 416]]);
  assert.deepEqual(final.rows.map(({ retained }) => retained), [false, false, true, false, true]);
  assert.deepEqual(final.selected, [104, 416]);
  assert.equal(final.result, 520);
  assert.equal(final.halvings, 4);
  assert.equal(trace.find((step) => step.phase === "select" && step.n === 5).selected[0], 104);
  assert.ok(trace.slice(0, -1).every((step) => step.result === null), "the diagram retains terms before summing them");
  assert.doesNotMatch(russianPeasantModule.model(trace[0]).latex, /Theta/);
  assert.match(russianPeasantModule.model(final).latex, /H\(1\)=0/);
});

test("multiplication diagrams connect half/double transitions and retained terms to the final sum", () => {
  const trace = buildRussianPeasantTrace({ n: 20, m: 26 });
  const halved = trace.find((step) => step.phase === "halve");
  const selected = trace.find((step) => step.phase === "select" && step.n === 5);
  const final = trace.at(-1);
  assert.match(russianPeasantModule.render(halved), /peasant-ledger-transition is-counted/);
  assert.match(russianPeasantModule.render(halved), /⌊n\/2⌋/);
  assert.match(russianPeasantModule.render(halved), /peasant-doubling-arrow/);
  assert.match(russianPeasantModule.render(selected), /peasant-retain-arrow/);
  assert.match(russianPeasantModule.render(final), /104 \+ 416/);
  assert.match(russianPeasantModule.render(final), /<strong>= 520<\/strong>/);
  const transitions = russianPeasantModule.describe(final).state.find((row) => row.label === "Row transitions").value;
  assert.match(transitions, /n = ⌊5\/2⌋ = 2; m = 2 × 104 = 208/);
});

test("multiplication handles even and odd reductions and stops at n=1", () => {
  for (let n = 1; n <= 512; n += 1) {
    const m = 26;
    const input = { n, m };
    const trace = buildRussianPeasantTrace(input);
    const final = trace.at(-1);
    assert.equal(final.result, n * m, `n=${n}`);
    assert.equal(final.halvings, Math.floor(Math.log2(n)), `n=${n}`);
    assert.ok(trace.every((step) => step.n >= 1));
    assert.equal(final.n, 1);
    assert.equal(final.rows.length, final.halvings + 1);
    let count = 0;
    for (const [index, step] of trace.entries()) {
      assert.equal(step.halvings - count, step.phase === "halve" ? 1 : 0);
      if (step.phase === "halve") {
        assert.equal(step.activeLine, 4);
        assert.equal(step.n, Math.floor(trace[index - 1].n / 2));
        assert.equal(step.m, trace[index - 1].m * 2);
      }
      count = step.halvings;
    }
    assert.deepEqual(input, { n, m });
  }
  const base = buildRussianPeasantTrace({ n: 1, m: 26 }).at(-1);
  assert.equal(base.halvings, 0);
  assert.deepEqual(base.selected, [26]);
});

test("multiplication bounds arithmetic and rejects malformed factors", () => {
  assert.deepEqual(parseRussianPeasantInput("20 26"), { n: 20, m: 26 });
  assert.throws(() => parseRussianPeasantInput("20"), /two positive integers/);
  assert.throws(() => parseRussianPeasantInput("20,26,30"), /two positive integers/);
  for (const raw of ["0,26", "-20,26", "20.5,26", "1000001,26", "20,Infinity"]) {
    assert.throws(() => parseRussianPeasantInput(raw), /positive integers from 1/);
  }
  const large = buildRussianPeasantTrace(parseRussianPeasantInput("1000000,1000000")).at(-1);
  assert.equal(large.result, 1_000_000_000_000);
  assert.ok(large.rows.every(({ n, m }) => Number.isSafeInteger(n) && Number.isSafeInteger(m)));
});

test("multiplication preserves snapshots and the nonvisual ledger describes every row", () => {
  assert.equal(validateModule(russianPeasantModule, "06-decrease-conquer"), true);
  for (const preset of russianPeasantModule.input.presets) {
    const input = russianPeasantModule.input.parse(preset.value);
    const trace = russianPeasantModule.buildTrace(input);
    assert.deepEqual(trace, russianPeasantModule.buildTrace(input));
    const labels = russianPeasantModule.describe(trace[0]).state.map((row) => row.label);
    for (const step of trace) {
      const description = russianPeasantModule.describe(step);
      assert.deepEqual(description.state.map((row) => row.label), labels);
      assert.equal(description.state.find((row) => row.label === "Halvings").value, String(step.halvings));
      for (const [index, row] of step.rows.entries()) {
        assert.ok(description.state.find((item) => item.label === "Rows").value.includes(`Row ${index + 1}: n = ${row.n}, m = ${row.m}`));
      }
    }
  }
  const trace = buildRussianPeasantTrace({ n: 20, m: 26 });
  assert.equal(trace[0].rows[0].retained, null);
  assert.deepEqual(trace[0].selected, []);
  assert.match(russianPeasantModule.describe(trace.at(-1)).state.find((row) => row.label === "Final sum").value, /104 \+ 416 = 520/);
});
