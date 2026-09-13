import test from "node:test";
import assert from "node:assert/strict";
import { buildBinaryIterativeTrace } from "../src/lectures/03-analysis/binary-iterative.js";
import { buildHanoiTrace, hanoiModule } from "../src/lectures/03-analysis/hanoi.js";
import { buildBinaryRecursiveTrace } from "../src/lectures/03-analysis/binary-recursive.js";
import { buildMaxElementTrace } from "../src/lectures/03-analysis/max-element.js";
import { buildUniqueElementTrace } from "../src/lectures/03-analysis/unique-element.js";
import { routes } from "../src/lectures/registry.js";


test("iterative binary digit trace separates checks and repetitions", () => {
  const final = buildBinaryIterativeTrace(16).at(-1);
  assert.equal(final.result, 5);
  assert.equal(final.bodyExecutions, 4);
  assert.equal(final.comparisons, 5);
});


test("binary digit traces return the digit count for base, power-of-two, and general inputs", () => {
  for (let n = 1; n <= 256; n += 1) {
    const expectedDigits = n.toString(2).length;
    const iterative = buildBinaryIterativeTrace(n).at(-1);
    const recursive = buildBinaryRecursiveTrace(n).at(-1);

    assert.equal(iterative.result, expectedDigits, `iterative result for ${n}`);
    assert.equal(iterative.comparisons, expectedDigits, `iterative checks for ${n}`);
    assert.equal(iterative.bodyExecutions, expectedDigits - 1, `iterative repetitions for ${n}`);
    assert.equal(recursive.result, expectedDigits, `recursive result for ${n}`);
    assert.equal(recursive.calls, expectedDigits, `recursive calls for ${n}`);
    assert.equal(recursive.additions, expectedDigits - 1, `recursive additions for ${n}`);
  }
});


test("Tower of Hanoi uses two to the n minus one moves", () => {
  const trace = buildHanoiTrace(3);
  const firstMove = trace.find((step) => step.phase === "move");
  const firstCall = trace.find((step) => step.phase === "call");
  const deepestCall = trace.find((step) => step.phase === "call" && step.callStack.length === 3);
  const firstReturn = trace.find((step) => step.phase === "return");
  const final = trace.at(-1);
  assert.equal(trace[0].activeDisk, null);
  assert.deepEqual(firstCall.callStack.map((frame) => frame.n), [3, 2]);
  assert.deepEqual(deepestCall.callStack.map((frame) => frame.n), [3, 2, 1]);
  assert.equal(firstCall.activeLabel, "Call");
  assert.equal(firstMove.activeDisk, 1);
  assert.equal(firstReturn.activeLabel, "Return");
  assert.equal(trace.filter((step) => step.phase === "move").length, 7);
  assert.equal(trace.length, 22);
  assert.equal(final.moves, 7);
  assert.equal(final.activeDisk, null);
  assert.deepEqual(final.pegs, [[], [], [3, 2, 1]]);
});


test("Tower of Hanoi traces remain legal throughout the supported range", () => {
  for (let n = 1; n <= 7; n += 1) {
    const trace = buildHanoiTrace(n);
    const expectedMoves = 2 ** n - 1;

    assert.equal(trace.length, 3 * (2 ** n) - 2, `trace length for ${n} disks`);
    assert.equal(trace.filter((step) => step.phase === "move").length, expectedMoves);
    assert.equal(trace.at(-1).moves, expectedMoves);
    assert.deepEqual(trace.at(-1).pegs, [[], [], Array.from({ length: n }, (_, index) => n - index)]);

    for (const [index, step] of trace.entries()) {
      assert.ok(step.callStack.length <= n, `call depth at step ${index} for ${n} disks`);
      assert.equal(step.pegs.flat().length, n, `disk conservation at step ${index} for ${n} disks`);
      for (const peg of step.pegs) {
        assert.ok(peg.every((disk, diskIndex) => diskIndex === 0 || peg[diskIndex - 1] > disk));
      }

      if (index > 0) {
        const previous = trace[index - 1];
        const moveDelta = step.moves - previous.moves;
        assert.equal(moveDelta, step.phase === "move" ? 1 : 0, `move counter at step ${index}`);
        if (JSON.stringify(step.pegs) !== JSON.stringify(previous.pegs)) {
          assert.equal(step.phase, "move", `peg change at step ${index}`);
        }
      }
    }
  }
});


test("Tower of Hanoi practice rejects an illegal move", () => {
  const activity = hanoiModule.activity;
  let state = activity.create(3);
  state = activity.reduce(state, { type: "select-peg", value: 0 });
  state = activity.reduce(state, { type: "select-peg", value: 2 });
  assert.equal(state.activeDisk, 1);
  state = activity.reduce(state, { type: "select-peg", value: 0 });
  state = activity.reduce(state, { type: "select-peg", value: 1 });
  state = activity.reduce(state, { type: "select-peg", value: 1 });
  state = activity.reduce(state, { type: "select-peg", value: 2 });
  assert.equal(state.error, true);
  assert.equal(state.moves, 2);
});


test("recursive binary digit trace counts additions", () => {
  const final = buildBinaryRecursiveTrace(16).at(-1);
  assert.equal(final.result, 5);
  assert.equal(final.additions, 4);
  assert.equal(final.calls, 5);
});


test("unpublished reference traces remain correct", () => {
  const maximum = buildMaxElementTrace([4, 7, 2, 9, 5]).at(-1);
  assert.equal(maximum.result, 9);
  assert.equal(maximum.comparisons, 4);

  const distinct = buildUniqueElementTrace([5, 8, 11, 14]).at(-1);
  assert.equal(distinct.result, true);
  assert.equal(distinct.comparisons, 6);

  const duplicate = buildUniqueElementTrace([5, 5, 8, 11]).at(-1);
  assert.equal(duplicate.result, false);
  assert.equal(duplicate.comparisons, 1);
});


test("every module rejects an empty input with a readable error", () => {
  for (const { module } of routes) {
    assert.throws(
      () => module.input.parse(""),
      (error) => error instanceof Error && error.message.trim().length > 0,
      module.id
    );
  }
});
