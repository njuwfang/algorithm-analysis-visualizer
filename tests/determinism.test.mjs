import test from "node:test";
import assert from "node:assert/strict";
import { routes } from "../src/lectures/registry.js";


test("every default and prepared input produces a deterministic, input-pure trace", () => {
  for (const { module } of routes) {
    const rawInputs = [module.input.default, ...module.input.presets.map((preset) => preset.value)];

    for (const raw of new Set(rawInputs)) {
      const firstInput = module.input.parse(raw);
      const secondInput = module.input.parse(raw);
      const inputSnapshot = structuredClone(firstInput);
      const firstTrace = module.buildTrace(firstInput);
      const secondTrace = module.buildTrace(secondInput);

      assert.deepEqual(firstInput, inputSnapshot, `${module.id} mutated parsed input ${raw}`);
      assert.deepEqual(firstTrace, secondTrace, `${module.id} produced a nondeterministic trace for ${raw}`);
    }
  }
});
