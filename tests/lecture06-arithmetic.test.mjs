import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import {
  buildPowerOneTrace, buildPowerSquaringTrace, parsePower,
  powerOneModule, powerSquaringModule
} from "../src/lectures/06-decrease-conquer/power.js";
import { buildEuclidTrace, parseEuclid, euclidModule } from "../src/lectures/06-decrease-conquer/euclid.js";

function squaringCount(n) {
  if (n === 0) return 0;
  const bits = n.toString(2);
  return bits.length + [...bits].filter((bit) => bit === "1").length;
}

test("both power traces compute exact results without changing their input", () => {
  for (const a of [-3, -1, 1, 2, 3]) {
    for (let n = 0; n <= 16; n += 1) {
      const input = { a, n };
      const first = buildPowerOneTrace(input);
      const second = buildPowerSquaringTrace(input);
      assert.deepEqual(input, { a, n });
      assert.equal(first.at(-1).result, a ** n);
      assert.equal(second.at(-1).result, a ** n);
      assert.equal(first.at(-1).multiplications, n);
      assert.equal(second.at(-1).multiplications, squaringCount(n));
      assert.deepEqual(second, buildPowerSquaringTrace(input));
    }
  }
});

test("squaring follows a single half-size call chain and counts each actual multiplication", () => {
  const trace = buildPowerSquaringTrace({ a: 2, n: 5 });
  assert.deepEqual(trace.filter((step) => step.phase === "call").map((step) => step.activeExponent), [5, 2, 1, 0]);
  assert.deepEqual(trace.filter((step) => step.phase === "multiply").map((step) => step.equation), ["1 × 1 = 1", "1 × 2 = 2", "2 × 2 = 4", "4 × 4 = 16", "16 × 2 = 32"]);
  for (let i = 1; i < trace.length; i += 1) {
    const delta = trace[i].multiplications - trace[i - 1].multiplications;
    assert.equal(delta, trace[i].phase === "multiply" ? 1 : 0);
    if (delta) assert.ok([4, 5].includes(trace[i].activeLine));
  }
  assert.equal(trace.at(-1).frames.length, 0);
  assert.equal(buildPowerSquaringTrace({ a: 2, n: 0 }).at(-1).multiplications, 0);
});

test("power input rejects ambiguous, invalid, and inexact values", () => {
  for (const raw of ["", "2", "2,3,4", "0,5", "10,1", "2,-1", "2,1.5", "2,17", "a,5", "Infinity,2"]) {
    assert.throws(() => parsePower(raw), Error, raw);
  }
  assert.deepEqual(parsePower("-2, 5"), { a: -2, n: 5 });
  for (const module of [powerOneModule, powerSquaringModule]) {
    const final = module.buildTrace({ a: -2, n: 2 }).at(-1);
    assert.equal(final.equation, "(-2)^2 = 4");
    assert.match(module.describe(final).state.find(({ label }) => label === "Returned powers").value, /\(-2\)\^2=4/);
  }
});

function divisorsGcd(m, n) {
  for (let candidate = Math.max(m, n); candidate >= 1; candidate -= 1) {
    if (m % candidate === 0 && n % candidate === 0) return candidate;
  }
}

test("Euclid matches independent common-divisor results and preserves the gcd at each reduction", () => {
  for (let m = 1; m <= 20; m += 1) {
    for (let n = 0; n <= 20; n += 1) {
      const expected = divisorsGcd(m, n);
      const input = { m, n };
      const trace = buildEuclidTrace(input);
      assert.equal(trace.at(-1).result, expected, `${m},${n}`);
      assert.deepEqual(input, { m, n });
      for (const step of trace.filter((item) => item.phase === "reduce")) {
        assert.equal(divisorsGcd(step.m, step.n), expected);
        if (step.secondArguments.length >= 3) assert.ok(step.secondArguments.at(-1) <= step.secondArguments.at(-3) / 2);
      }
    }
  }
});

test("Euclid counts only remainder evaluations, with no division at the zero base case", () => {
  const trace = buildEuclidTrace({ m: 60, n: 24 });
  assert.deepEqual(trace.at(-1).rows, [{ m: 60, n: 24, remainder: 12 }, { m: 24, n: 12, remainder: 0 }]);
  assert.equal(trace.at(-1).operations, 2);
  for (let i = 1; i < trace.length; i += 1) {
    assert.equal(trace[i].operations - trace[i - 1].operations, trace[i].activeLine === 3 ? 1 : 0);
  }
  assert.equal(buildEuclidTrace({ m: 60, n: 0 }).at(-1).operations, 0);
  for (const raw of ["", "60", "60,24,2", "0,24", "60,-1", "60,1.5", "1000001,24", "60,Infinity"]) assert.throws(() => parseEuclid(raw));
});

test("Lecture06 arithmetic modules obey the stable trace and text-state contracts", () => {
  for (const module of [powerOneModule, powerSquaringModule, euclidModule]) {
    assert.equal(validateModule(module, "06-decrease-conquer"), true);
  }
});
