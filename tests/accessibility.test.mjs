import test from "node:test";
import assert from "node:assert/strict";
import { lectures } from "../src/lectures/registry.js";

function assertDescription(description, context) {
  assert.equal(typeof description?.summary, "string", `${context}: summary must be text`);
  assert.ok(description.summary.trim(), `${context}: summary must not be empty`);
  assert.ok(Array.isArray(description.state) && description.state.length > 0, `${context}: state rows are required`);
  for (const [index, row] of description.state.entries()) {
    assert.ok(typeof row?.label === "string" && row.label.trim(), `${context}: state row ${index} needs a label`);
    assert.ok(typeof row?.value === "string" && row.value.trim(), `${context}: state row ${index} needs a value`);
  }
  if (description.details !== undefined) {
    assert.ok(Array.isArray(description.details), `${context}: details must be an array`);
    description.details.forEach((detail, index) => {
      assert.ok(typeof detail === "string" && detail.trim(), `${context}: detail ${index} must not be empty`);
    });
  }
}

test("every published prepared input has a complete text description for every step", () => {
  for (const lecture of lectures) {
    for (const module of lecture.modules) {
      const inputs = [module.input.default, ...module.input.presets.map((preset) => preset.value)];
      for (const raw of new Set(inputs)) {
        const trace = module.buildTrace(module.input.parse(raw));
        const expectedStateLabels = module.describe(trace[0]).state.map(({ label }) => label.trim().toLowerCase());
        const expectedMetricLabels = module.metrics(trace[0]).map(({ label }) => label.trim().toLowerCase());
        trace.forEach((step, index) => {
          const context = `${lecture.id}/${module.id}, input ${raw}, step ${index + 1}`;
          const description = module.describe(step);
          const metrics = module.metrics(step);
          assertDescription(description, context);
          assert.deepEqual(
            description.state.map(({ label }) => label.trim().toLowerCase()),
            expectedStateLabels,
            `${context}: state labels must remain stable`
          );
          assert.deepEqual(
            metrics.map(({ label }) => label.trim().toLowerCase()),
            expectedMetricLabels,
            `${context}: metric labels must remain stable`
          );
        });
      }
    }
  }
});

test("published hands-on activities expose structured state and keyboard semantics", () => {
  for (const lecture of lectures) {
    for (const module of lecture.modules.filter((candidate) => candidate.activity)) {
      const parsed = module.input.parse(module.input.default);
      const activityState = module.activity.create(parsed);
      const context = `${lecture.id}/${module.id} activity`;
      assertDescription(module.activity.describe(activityState), context);

      const html = module.activity.render(activityState);
      assert.match(html, /data-activity-action=/, `${context}: an activity action is required`);
      assert.match(html, /(?:<button\b|role="button")/, `${context}: actions need button semantics`);
      assert.match(html, /aria-label=/, `${context}: actions need accessible names`);
    }
  }
});

test("completed Hanoi practice removes inert peg actions and exposes disabled state", () => {
  const hanoi = lectures
    .flatMap((lecture) => lecture.modules)
    .find((module) => module.id === "hanoi");
  let activityState = hanoi.activity.create(hanoi.input.parse("1"));
  const initialLabels = hanoi.activity.describe(activityState).state.map(({ label }) => label);
  const initialMetricLabels = hanoi.activity.metrics(activityState).map(({ label }) => label);
  activityState = hanoi.activity.reduce(activityState, { type: "select-peg", value: "0" });
  activityState = hanoi.activity.reduce(activityState, { type: "select-peg", value: "2" });

  assert.equal(activityState.solved, true);
  const html = hanoi.activity.render(activityState);
  assert.doesNotMatch(html, /data-activity-action="select-peg"/);
  assert.match(html, /aria-disabled="true"/);
  const finalDescription = hanoi.activity.describe(activityState);
  assert.deepEqual(finalDescription.state.map(({ label }) => label), initialLabels);
  assert.deepEqual(hanoi.activity.metrics(activityState).map(({ label }) => label), initialMetricLabels);
  assert.match(finalDescription.state.find(({ label }) => label === "Puzzle status").value, /solved/);
  assert.equal(finalDescription.state.find(({ label }) => label === "Last move").value, "Move 1: disk 1 from peg A to peg C");
  assert.equal(finalDescription.details, undefined, "practice state should not repeat the cumulative move history");
});

test("generic rendered elements with accessible names also receive explicit semantics", () => {
  const unnamedGenericRole = /<(?:div|span)\b(?=[^>]*\baria-label=)(?![^>]*\brole=)[^>]*>/;

  for (const lecture of lectures) {
    for (const module of lecture.modules) {
      const trace = module.buildTrace(module.input.parse(module.input.default));
      trace.forEach((step, index) => {
        assert.doesNotMatch(
          module.render(step),
          unnamedGenericRole,
          `${lecture.id}/${module.id}, step ${index + 1}: a named generic element needs a role`
        );
      });
    }
  }
});
