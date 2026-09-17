import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import { hanoiModule } from "../src/lectures/03-analysis/hanoi.js";
import { maxElementModule } from "../src/lectures/03-analysis/max-element.js";
import { uniqueElementModule } from "../src/lectures/03-analysis/unique-element.js";

function withActivity(overrides) {
  return {
    ...hanoiModule,
    activity: { ...hanoiModule.activity, ...overrides }
  };
}

test("validates the optional activity contract", async (t) => {
  assert.equal(validateModule(hanoiModule, "03-analysis"), true);

  const validState = (input) => hanoiModule.activity.create(input);
  const cases = [
    {
      name: "requires a controls function",
      module: withActivity({ controls: undefined }),
      message: /activity\.controls must be a function/
    },
    {
      name: "requires create to return a state object",
      module: withActivity({ create: () => null }),
      message: /activity\.create must return a state object/
    },
    {
      name: "requires a created-state message",
      module: withActivity({ create: (input) => ({ ...validState(input), message: "" }) }),
      message: /activity\.create state needs message/
    },
    {
      name: "requires render to return HTML",
      module: withActivity({ render: () => null }),
      message: /activity\.render must return HTML/
    },
    {
      name: "requires a structured activity description",
      module: withActivity({ describe: undefined }),
      message: /activity\.describe must be a function/
    },
    {
      name: "validates the activity description",
      module: withActivity({ describe: (state) => ({ summary: state.message, state: [] }) }),
      message: /activity\.describe\.state must be a non-empty array/
    },
    {
      name: "requires metrics to return a non-empty array",
      module: withActivity({ metrics: () => ({}) }),
      message: /activity\.metrics must return a non-empty array/
    },
    {
      name: "requires each metric label and value",
      module: withActivity({ metrics: () => [{ label: "Moves" }] }),
      message: /activity\.metrics\[0\]\.value is required/
    },
    {
      name: "requires controls to return an array",
      module: withActivity({ controls: () => null }),
      message: /activity\.controls must return an array/
    },
    {
      name: "requires each control action and label",
      module: withActivity({ controls: () => [{ action: "", label: "Undo" }] }),
      message: /activity\.controls\[0\]\.action is required/
    },
    {
      name: "validates optional control properties",
      module: withActivity({ controls: () => [{ action: "undo", label: "Undo", disabled: "no" }] }),
      message: /activity\.controls\[0\]\.disabled must be a boolean/
    }
  ];

  for (const item of cases) {
    await t.test(item.name, () => {
      assert.throws(() => validateModule(item.module, "03-analysis"), item.message);
    });
  }
});


test("requires a LaTeX mathematical model", () => {
  const module = {
    ...hanoiModule,
    model: () => ({ tokens: ["M(n)"], notes: [] })
  };

  assert.throws(() => validateModule(module, "03-analysis"), /model for trace state 0\.latex is required/);
});

test("requires a complete structured description for every trace state", async (t) => {
  const cases = [
    {
      name: "requires the describe function",
      describe: undefined,
      message: /describe must be a function/
    },
    {
      name: "requires a summary",
      describe: () => ({ summary: "", state: [{ label: "Peg A", value: "3, 2, 1" }] }),
      message: /describe for trace state 0\.summary is required/
    },
    {
      name: "requires at least one state row",
      describe: (step) => ({ summary: step.message, state: [] }),
      message: /describe for trace state 0\.state must be a non-empty array/
    },
    {
      name: "requires textual labels and values",
      describe: (step) => ({ summary: step.message, state: [{ label: "Peg A", value: 3 }] }),
      message: /describe for trace state 0\.state\[0\]\.value is required/
    },
    {
      name: "requires unique state labels for unambiguous deltas",
      describe: (step) => ({
        summary: step.message,
        state: [
          { label: "Disk moves", value: "0" },
          { label: " disk MOVES ", value: "0" }
        ]
      }),
      message: /state has duplicate label " disk MOVES "/
    },
    {
      name: "validates optional details",
      describe: (step) => ({ summary: step.message, state: [{ label: "Peg A", value: "3, 2, 1" }], details: [""] }),
      message: /describe for trace state 0\.details\[0\] must be a non-empty string/
    }
  ];

  for (const item of cases) {
    await t.test(item.name, () => {
      assert.throws(
        () => validateModule({ ...hanoiModule, describe: item.describe }, "03-analysis"),
        item.message
      );
    });
  }
});

test("requires stable state and metric labels across a trace", async (t) => {
  await t.test("state labels retain their order and meaning", () => {
    assert.throws(
      () => validateModule({
        ...hanoiModule,
        describe(step) {
          const description = hanoiModule.describe(step);
          if (step.phase !== "initial") description.state[0].label = "Source peg";
          return description;
        }
      }, "03-analysis"),
      /describe for trace state 1 labels must remain stable/
    );
  });

  await t.test("metric labels remain stable", () => {
    assert.throws(
      () => validateModule({
        ...hanoiModule,
        metrics(step) {
          return [{
            label: step.phase === "initial" ? "Disk moves" : "Moves so far",
            value: step.moves,
            emphasis: true
          }];
        }
      }, "03-analysis"),
      /metrics for trace state 1 labels must remain stable/
    );
  });
});

test("a description cannot reuse a metric label for a different value", () => {
  assert.throws(
    () => validateModule({
      ...hanoiModule,
      describe(step) {
        const description = hanoiModule.describe(step);
        description.state.find(({ label }) => label === "Disk moves").value = "different";
        return description;
      }
    }, "03-analysis"),
    /reuses metric label "Disk moves" with a different value/
  );
});


test("validates an optional code-panel title", () => {
  assert.equal(validateModule({ ...hanoiModule, codeTitle: "Recursive procedure" }, "03-analysis"), true);
  assert.throws(
    () => validateModule({ ...hanoiModule, codeTitle: " " }, "03-analysis"),
    /codeTitle must be a non-empty string/
  );
});


test("validates an optional counted-quantity label", () => {
  const pseudocode = hanoiModule.pseudocode.map((line, index) => index === 0
    ? { ...line, basic: true, basicLabel: "disk move" }
    : line);
  assert.equal(validateModule({ ...hanoiModule, pseudocode }, "03-analysis"), true);
  assert.throws(
    () => validateModule({ ...hanoiModule, pseudocode: [{ line: 1, text: "work", basicLabel: "work" }] }, "03-analysis"),
    /basicLabel requires basic: true/
  );
});


test("requires a spoken equivalent for mathematical pseudocode", () => {
  const missingSpoken = hanoiModule.pseudocode.map((line, index) => index === 0
    ? { line: line.line, latex: "T(n)=2T(n-1)+1" }
    : line);
  assert.throws(
    () => validateModule({ ...hanoiModule, pseudocode: missingSpoken }, "03-analysis"),
    /pseudocode\[0\]\.spoken is required for a latex line/
  );

  const withSpoken = missingSpoken.map((line, index) => index === 0
    ? { ...line, spoken: "T of n equals two times T of n minus 1, plus 1" }
    : line);
  assert.equal(validateModule({ ...hanoiModule, pseudocode: withSpoken }, "03-analysis"), true);
});


test("unpublished reference modules retain the shared contract", () => {
  assert.equal(validateModule(maxElementModule, "03-analysis"), true);
  assert.equal(validateModule(uniqueElementModule, "03-analysis"), true);
});
