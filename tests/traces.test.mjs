import test from "node:test";
import assert from "node:assert/strict";
import { buildBinaryIterativeTrace } from "../src/lectures/03-analysis/binary-iterative.js";
import { buildHanoiTrace, hanoiModule } from "../src/lectures/03-analysis/hanoi.js";
import { buildBinaryRecursiveTrace } from "../src/lectures/03-analysis/binary-recursive.js";
import { buildMaxElementTrace } from "../src/lectures/03-analysis/max-element.js";
import { buildUniqueElementTrace } from "../src/lectures/03-analysis/unique-element.js";
import {
  buildMasterTheoremTrace,
  classifyMasterCase,
  masterTheoremModule,
  parseMasterTheoremInput
} from "../src/lectures/03-analysis/master-theorem.js";
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


test("Master Theorem traces make the three level-work profiles explicit", () => {
  assert.doesNotMatch(
    masterTheoremModule.input.presets.map((preset) => preset.label).join(" "),
    /dominates?|balanced|root|leaves/i,
    "prepared inputs should not reveal the outcome"
  );

  const cases = [
    {
      raw: "2, 2, 1, 16",
      masterCase: "balanced",
      activeLine: 6,
      levelWork: [16, 16, 16, 16, 16],
      totalWork: 80,
      result: "Θ(n log n)"
    },
    {
      raw: "4, 2, 1, 16",
      masterCase: "leaves",
      activeLine: 6,
      levelWork: [16, 32, 64, 128, 256],
      totalWork: 496,
      result: "Θ(n^2)"
    },
    {
      raw: "2, 2, 2, 16",
      masterCase: "root",
      activeLine: 6,
      levelWork: [256, 128, 64, 32, 16],
      totalWork: 496,
      result: "Θ(n^2)"
    },
    {
      raw: "1, 2, 0, 16",
      masterCase: "balanced",
      activeLine: 6,
      levelWork: [1, 1, 1, 1, 1],
      totalWork: 5,
      result: "Θ(log n)"
    }
  ];

  for (const expected of cases) {
    const input = parseMasterTheoremInput(expected.raw);
    const trace = buildMasterTheoremTrace(input);
    const levelStates = trace.filter((step) => ["root", "level", "leaf"].includes(step.phase));
    const final = trace.at(-1);

    assert.equal(trace.length, input.depth + 3, expected.raw);
    assert.deepEqual(trace[0].levels.map((level) => level.levelWork), expected.levelWork, expected.raw);
    assert.equal(levelStates.length, input.depth + 1, expected.raw);
    assert.equal(final.masterCase, expected.masterCase, expected.raw);
    assert.equal(final.activeLine, expected.activeLine, expected.raw);
    assert.equal(final.levels.reduce((sum, level) => sum + level.levelWork, 0), expected.totalWork, expected.raw);
    assert.equal(final.result.text, expected.result, expected.raw);

    for (const [levelIndex, state] of levelStates.entries()) {
      const level = state.levels[levelIndex];
      assert.equal(level.nodes, input.a ** levelIndex, `${expected.raw}, level ${levelIndex}`);
      assert.equal(level.subproblemSize, input.n / (input.b ** levelIndex), `${expected.raw}, level ${levelIndex}`);
      assert.ok(Math.abs(level.workPerNode - level.subproblemSize ** input.d) < 1e-9, `${expected.raw}, work per node at level ${levelIndex}`);
      assert.ok(Math.abs(level.levelWork - level.nodes * level.workPerNode) < 1e-9, `${expected.raw}, total work at level ${levelIndex}`);
      assert.equal(state.currentLevel, levelIndex, `${expected.raw}, current level ${levelIndex}`);
      assert.equal(state.revealedThrough, levelIndex, `${expected.raw}, revealed level ${levelIndex}`);
      assert.equal(state.activeLine, levelIndex === 0 ? 1 : 4, `${expected.raw}, level ${levelIndex}`);

      if (levelIndex > 0) {
        const previous = state.levels[levelIndex - 1];
        assert.ok(Math.abs(level.levelWork / previous.levelWork - state.ratio) < 1e-9, `${expected.raw}, ratio at level ${levelIndex}`);
      }

      const html = masterTheoremModule.render(state);
      assert.match(html, new RegExp(`Level ${levelIndex}:`), `${expected.raw}, accessible level ${levelIndex}`);
      assert.doesNotMatch(html, /NaN|Infinity|undefined/, `${expected.raw}, rendered level ${levelIndex}`);
    }

    assert.equal(final.levels[0].nodes, 1, `${expected.raw}, root count`);
    assert.equal(final.levels[0].subproblemSize, input.n, `${expected.raw}, root size`);
    assert.equal(final.levels.at(-1).nodes, input.a ** input.depth, `${expected.raw}, leaf count`);
    assert.equal(final.levels.at(-1).subproblemSize, 1, `${expected.raw}, leaf size`);
    assert.match(masterTheoremModule.render(final), /master-reading is-outcome/, `${expected.raw}, visible outcome`);
  }
});


test("Master Theorem input errors are specific", () => {
  assert.throws(() => parseMasterTheoremInput(""), /four values/);
  assert.deepEqual(
    parseMasterTheoremInput("2, 2, 0.5, 16"),
    { a: 2, b: 2, d: 0.5, n: 16, depth: 4 }
  );
  const fractionalTrace = buildMasterTheoremTrace(parseMasterTheoremInput("2, 2, 0.5, 16"));
  assert.equal(fractionalTrace.at(-1).masterCase, "leaves");
  assert.equal(fractionalTrace.at(-1).result.text, "Θ(n)");
  assert.ok(fractionalTrace.at(-1).levels.every((level) => Number.isFinite(level.levelWork)));
  assert.throws(() => parseMasterTheoremInput("2.5, 2, 1, 16"), /a, b, and n must be whole numbers/);
  assert.throws(() => parseMasterTheoremInput("2, 2, unknown, 16"), /d must be a valid number/);
  assert.throws(() => parseMasterTheoremInput("0, 2, 1, 16"), /Choose a from 1 to 8/);
  assert.throws(() => parseMasterTheoremInput("2, 1, 1, 16"), /Choose b from 2 to 8/);
  assert.throws(() => parseMasterTheoremInput("2, 2, 5, 16"), /Choose d from 0 to 4/);
  assert.throws(() => parseMasterTheoremInput("2, 2, 1, 12"), /exact power of b = 2/);
  assert.throws(() => parseMasterTheoremInput("2, 2, 1, 128"), /no larger than b\^6/);
});


test("Master Theorem intuition remains correct for fractional exponents", () => {
  const cases = [
    { raw: "2, 2, 0.5, 16", masterCase: "leaves", work: [4, Math.sqrt(32), 8, Math.sqrt(128), 16] },
    { raw: "2, 4, 0.5, 64", masterCase: "balanced", work: [8, 8, 8, 8] },
    { raw: "1, 4, 0.5, 64", masterCase: "root", work: [8, 4, 2, 1] },
    { raw: "3, 2, 1, 16", masterCase: "leaves", work: [16, 24, 36, 54, 81] }
  ];

  for (const expected of cases) {
    const trace = buildMasterTheoremTrace(parseMasterTheoremInput(expected.raw));
    const final = trace.at(-1);
    assert.equal(final.masterCase, expected.masterCase, expected.raw);
    for (const [index, work] of expected.work.entries()) {
      assert.ok(Math.abs(final.levels[index].levelWork - work) < 1e-9, `${expected.raw}, level ${index}`);
    }
    const rootWork = final.levels[0].levelWork;
    const geometricTotal = Math.abs(final.ratio - 1) < 1e-10
      ? (final.depth + 1) * rootWork
      : rootWork * ((final.ratio ** (final.depth + 1)) - 1) / (final.ratio - 1);
    const displayedTotal = final.levels.reduce((sum, level) => sum + level.levelWork, 0);
    assert.ok(Math.abs(displayedTotal - geometricTotal) < 1e-8, `${expected.raw}, geometric sum`);
    for (const step of trace) {
      const rendered = masterTheoremModule.render(step);
      const metrics = JSON.stringify(masterTheoremModule.metrics(step));
      assert.doesNotMatch(`${rendered}${metrics}`, /NaN|Infinity|undefined/, expected.raw);
    }
  }

  const exactBoundary = Math.log(3) / Math.log(2);
  assert.equal(classifyMasterCase({ a: 3, b: 2, d: exactBoundary }).id, "balanced");
  assert.equal(classifyMasterCase({ a: 3, b: 2, d: exactBoundary - 1e-6 }).id, "leaves");
  assert.equal(classifyMasterCase({ a: 3, b: 2, d: exactBoundary + 1e-6 }).id, "root");
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
