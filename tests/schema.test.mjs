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


test("unpublished reference modules retain the shared contract", () => {
  assert.equal(validateModule(maxElementModule, "03-analysis"), true);
  assert.equal(validateModule(uniqueElementModule, "03-analysis"), true);
});
