import test from "node:test";
import assert from "node:assert/strict";
import { deriveTraceChanges, formatTraceChanges } from "../src/core/trace-delta.js";
import { hanoiModule } from "../src/lectures/03-analysis/hanoi.js";


test("trace deltas report only changed and added rows in current-state order", () => {
  const previous = [
    { label: "Active pseudocode", value: "Line 3" },
    { label: "Peg A", value: "3, 2, 1 (bottom to top)" },
    { label: "Peg B", value: "empty" },
    { label: "Disk moves", value: "0" }
  ];
  const current = [
    { label: "Active pseudocode", value: "Line 2" },
    { label: "Peg A", value: "3, 2 (bottom to top)" },
    { label: "Peg B", value: "empty" },
    { label: "Peg C", value: "1 (bottom to top)" },
    { label: "Disk moves", value: "1" }
  ];

  assert.deepEqual(deriveTraceChanges(previous, current), [
    { label: "Active pseudocode", from: "Line 3", to: "Line 2" },
    { label: "Peg A", from: "3, 2, 1 (bottom to top)", to: "3, 2 (bottom to top)" },
    { label: "Peg C", from: null, to: "1 (bottom to top)" },
    { label: "Disk moves", from: "0", to: "1" }
  ]);
});


test("trace deltas append removed rows in their previous-state order", () => {
  const previous = [
    { label: "Candidate", value: "P1" },
    { label: "Temporary comparison", value: "P1 to P2" },
    { label: "Discarded branch", value: "left" }
  ];
  const current = [{ label: "Candidate", value: "P2" }];

  assert.deepEqual(deriveTraceChanges(previous, current), [
    { label: "Candidate", from: "P1", to: "P2" },
    { label: "Temporary comparison", from: "P1 to P2", to: null },
    { label: "Discarded branch", from: "left", to: null }
  ]);
});


test("trace deltas are empty when every labeled value is unchanged", () => {
  const snapshot = [
    { label: "Peg A", value: "3, 2, 1 (bottom to top)" },
    { label: "Disk moves", value: "0" }
  ];

  assert.deepEqual(deriveTraceChanges(snapshot, snapshot.map((row) => ({ ...row }))), []);
  assert.equal(formatTraceChanges([]), "No state changes.");
});


test("the first trace step has no synthetic from-nowhere changes", () => {
  const initial = [{ label: "Peg A", value: "3, 2, 1 (bottom to top)" }];

  assert.deepEqual(deriveTraceChanges(null, initial), []);
});


test("formatted changes preserve labels and explicit before-and-after values", () => {
  const message = formatTraceChanges([
    { label: "Peg A", from: "3, 2, 1", to: "3, 2" },
    { label: "Peg C", from: null, to: "1" },
    { label: "Active disk", from: "1", to: null }
  ]);

  assert.match(message, /Peg A: 3, 2, 1 to 3, 2/);
  assert.match(message, /Peg C: added as 1/);
  assert.match(message, /Active disk: removed; previously 1/);
  assert.match(message, /Peg A[\s\S]*Peg C[\s\S]*Active disk/);
});


test("duplicate labels cannot make a delta ambiguous", () => {
  assert.throws(
    () => deriveTraceChanges(
      [{ label: "Disk moves", value: "0" }],
      [
        { label: "Disk moves", value: "1" },
        { label: " disk MOVES ", value: "1" }
      ]
    ),
    /duplicate label/i
  );
});


test("internal keys keep shell and author rows from colliding", () => {
  const changes = deriveTraceChanges(
    [
      { key: "shell:active", label: "Active pseudocode", value: "Line 1" },
      { key: "state:active", label: "Active pseudocode", value: "waiting" }
    ],
    [
      { key: "shell:active", label: "Active pseudocode", value: "Line 2" },
      { key: "state:active", label: "Active pseudocode", value: "running" }
    ]
  );

  assert.deepEqual(changes, [
    { label: "Active pseudocode", from: "Line 1", to: "Line 2" },
    { label: "Active pseudocode", from: "waiting", to: "running" }
  ]);
});


test("Hanoi descriptions expose the exact state changes caused by a disk move", () => {
  const trace = hanoiModule.buildTrace(hanoiModule.input.parse("3"));
  const moveIndex = trace.findIndex((step) => step.phase === "move");
  const before = hanoiModule.describe(trace[moveIndex - 1]).state;
  const after = hanoiModule.describe(trace[moveIndex]).state;
  const changes = deriveTraceChanges(before, after);

  assert.deepEqual(changes, [
    { label: "Peg A", from: "3, 2, 1 (bottom to top)", to: "3, 2 (bottom to top)" },
    { label: "Peg C", from: "empty", to: "1 (bottom to top)" },
    { label: "Disk moves", from: "0", to: "1" },
    { label: "Disk moved this step", from: "none", to: "1" }
  ]);
});


test("Hanoi deltas identify the recursive call that becomes active", () => {
  const trace = hanoiModule.buildTrace(hanoiModule.input.parse("3"));
  const changes = deriveTraceChanges(
    hanoiModule.describe(trace[0]).state,
    hanoiModule.describe(trace[1]).state
  );
  const activeCall = changes.find(({ label }) => label === "Active recursive call");

  assert.ok(activeCall, "the exact recursive call must be part of the nonvisual delta");
  assert.match(activeCall.from, /Hanoi\(3/);
  assert.match(activeCall.to, /Hanoi\(2/);
});


test("Hanoi return deltas expose the popped frame rather than delaying it", () => {
  const trace = hanoiModule.buildTrace(hanoiModule.input.parse("3"));
  const returnIndex = trace.findIndex((step) => step.phase === "return");
  const changes = deriveTraceChanges(
    hanoiModule.describe(trace[returnIndex - 1]).state,
    hanoiModule.describe(trace[returnIndex]).state
  );
  const activeCall = changes.find(({ label }) => label === "Active recursive call");
  const depth = changes.find(({ label }) => label === "Recursive call depth");

  assert.ok(activeCall, "returning must expose the caller that becomes active");
  assert.match(activeCall.from, /Hanoi\(1/);
  assert.match(activeCall.to, /Hanoi\(2/);
  assert.deepEqual(depth, { label: "Recursive call depth", from: "3", to: "2" });
});
