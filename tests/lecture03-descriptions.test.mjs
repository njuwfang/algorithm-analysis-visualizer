import test from "node:test";
import assert from "node:assert/strict";
import { binaryIterativeModule } from "../src/lectures/03-analysis/binary-iterative.js";
import { binaryRecursiveModule } from "../src/lectures/03-analysis/binary-recursive.js";
import { hanoiModule } from "../src/lectures/03-analysis/hanoi.js";
import { masterTheoremModule } from "../src/lectures/03-analysis/master-theorem.js";

const modules = [
  binaryIterativeModule,
  hanoiModule,
  binaryRecursiveModule,
  masterTheoremModule
];

function stateValue(description, label) {
  return description.state.find((item) => item.label === label)?.value;
}

function assertUsefulDescription(module, step, position) {
  const description = module.describe(step);
  assert.equal(typeof description.summary, "string", `${module.id} ${position} summary type`);
  assert.ok(description.summary.trim(), `${module.id} ${position} summary`);
  assert.ok(Array.isArray(description.state), `${module.id} ${position} state array`);
  assert.ok(description.state.length > 0, `${module.id} ${position} state is nonempty`);

  for (const [index, item] of description.state.entries()) {
    assert.equal(typeof item.label, "string", `${module.id} ${position} state ${index} label type`);
    assert.ok(item.label.trim(), `${module.id} ${position} state ${index} label`);
    assert.equal(typeof item.value, "string", `${module.id} ${position} state ${index} value type`);
    assert.ok(item.value.trim(), `${module.id} ${position} state ${index} value`);
  }

  if (description.details !== undefined) {
    assert.ok(Array.isArray(description.details), `${module.id} ${position} details array`);
    assert.ok(description.details.length > 0, `${module.id} ${position} details are nonempty`);
    for (const detail of description.details) {
      assert.equal(typeof detail, "string", `${module.id} ${position} detail type`);
      assert.ok(detail.trim(), `${module.id} ${position} detail`);
    }
  }

  assert.doesNotMatch(
    JSON.stringify(description),
    /\b(?:amber|teal|indigo|green|red|highlighted|band width)\b/i,
    `${module.id} ${position} does not depend on visual styling`
  );
  return description;
}

test("published Lecture 03 modules describe their initial, middle, and final states", () => {
  for (const module of modules) {
    const input = module.input.parse(module.input.default);
    const trace = module.buildTrace(input);
    const selected = [
      [trace[0], "initial"],
      [trace[Math.floor(trace.length / 2)], "middle"],
      [trace.at(-1), "final"]
    ];

    for (const [step, position] of selected) {
      assertUsefulDescription(module, step, position);
    }
  }
});

test("iterative and recursive binary descriptions expose counts and execution state", () => {
  const iterativeTrace = binaryIterativeModule.buildTrace(16);
  const iterativeMiddle = binaryIterativeModule.describe(iterativeTrace.find((step) => step.phase === "divide"));
  const iterativeFinal = binaryIterativeModule.describe(iterativeTrace.at(-1));
  assert.equal(stateValue(iterativeMiddle, "Current n"), "8");
  assert.equal(stateValue(iterativeFinal, "Condition checks"), "5");
  assert.equal(stateValue(iterativeFinal, "Loop repetitions"), "4");

  const recursiveTrace = binaryRecursiveModule.buildTrace(16);
  const recursiveInitial = binaryRecursiveModule.describe(recursiveTrace[0]);
  const recursiveMiddle = binaryRecursiveModule.describe(recursiveTrace.find((step) => step.phase === "base"));
  const recursiveFinal = binaryRecursiveModule.describe(recursiveTrace.at(-1));
  assert.match(stateValue(recursiveInitial, "Pending recurrence rows"), /A\(8\) = A\(4\) \+ 1/);
  assert.match(stateValue(recursiveMiddle, "Call stack, outermost to active"), /BinRec\(16\).*BinRec\(1\)/);
  assert.equal(stateValue(recursiveFinal, "Current result"), "5");
  assert.equal(stateValue(recursiveFinal, "Additions performed"), "4");
  assert.equal(stateValue(recursiveFinal, "Pending recurrence rows"), "none");
});

test("Hanoi descriptions name every peg and the active recursive calls", () => {
  const trace = hanoiModule.buildTrace(3);
  const initial = hanoiModule.describe(trace[0]);
  const middle = hanoiModule.describe(trace[Math.floor(trace.length / 2)]);
  const final = hanoiModule.describe(trace.at(-1));

  assert.equal(stateValue(initial, "Peg A"), "3, 2, 1 (bottom to top)");
  assert.match(stateValue(middle, "Call stack, outermost to active"), /Hanoi\(3, A to C, auxiliary B\)/);
  assert.equal(stateValue(final, "Peg A"), "empty");
  assert.equal(stateValue(final, "Peg C"), "3, 2, 1 (bottom to top)");
  assert.equal(stateValue(final, "Disk moves"), "7");
  assert.equal(stateValue(final, "Call stack, outermost to active"), "empty");
});

test("Master Theorem descriptions enumerate the revealed level calculations", () => {
  const input = masterTheoremModule.input.parse(masterTheoremModule.input.default);
  const trace = masterTheoremModule.buildTrace(input);
  const initial = masterTheoremModule.describe(trace[0]);
  const middleStep = trace.find((step) => step.phase === "level" && step.currentLevel === 2);
  const middle = masterTheoremModule.describe(middleStep);
  const final = masterTheoremModule.describe(trace.at(-1));

  assert.deepEqual(initial.details, [
    "Level 0: 1 subproblem of size 16, 16 work each, 16 total level work."
  ]);
  assert.equal(stateValue(initial, "Levels revealed"), "1 of 5");
  assert.equal(middle.details.length, 3);
  assert.match(middle.details.at(-1), /Level 2: 4 subproblems of size 4, 4 work each, 16 total level work/);
  assert.match(stateValue(final, "Conclusion"), /Every level contributes equally; T\(n\) is in Θ\(n log n\)/);
  assert.equal(stateValue(final, "Levels revealed"), "5 of 5");
  assert.equal(final.details.length, 5);
});
