import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../src/core/schema.js";
import { buildInsertionSortTrace, insertionSortModule } from "../src/lectures/06-decrease-conquer/insertion-sort.js";
import { buildShellsortTrace, parseShellsortInput, shellsortModule, shellsortSortedPrefix } from "../src/lectures/06-decrease-conquer/shellsort.js";

test("Insertion Sort follows the drawn lecture array, including the i = 0 pass", () => {
  const input = [6, 4, 1, 7, 3, 2, 5];
  const trace = buildInsertionSortTrace(input);
  const final = trace.at(-1);
  assert.deepEqual(input, [6, 4, 1, 7, 3, 2, 5]);
  assert.deepEqual(final.values, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(final.comparisons, 16);
  assert.deepEqual(final.passCounts, [0, 1, 2, 1, 4, 5, 3]);
  assert.deepEqual(trace.filter((step) => step.phase === "hold").map((step) => step.i), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(trace.length, 44);
  assert.equal(trace.filter((step) => step.i === 0 && step.phase === "compare").length, 0);
  const shift = trace.find((step) => step.phase === "shift");
  assert.deepEqual(shift.values, [6, 6, 1, 7, 3, 2, 5]);
  assert.equal(shift.held, 4);
  assert.equal(shift.hole, 0);
  assert.equal(shift.activeLine, 5);
  assert.equal(shift.comparisons, 1);
  assert.deepEqual(trace.filter((step) => step.phase === "insert").map((step) => step.values.slice(0, step.i + 1)), [
    [6], [4, 6], [1, 4, 6], [1, 4, 6, 7], [1, 3, 4, 6, 7], [1, 2, 3, 4, 6, 7], [1, 2, 3, 4, 5, 6, 7]
  ]);
  const caption = insertionSortModule.input.presets.find(({ label }) => label === "Lecture caption");
  const captionTrace = buildInsertionSortTrace(insertionSortModule.input.parse(caption.value));
  assert.deepEqual(captionTrace[0].values, [6, 4, 1, 7, 2, 5, 3]);
  assert.deepEqual(captionTrace.at(-1).values, [1, 2, 3, 4, 5, 6, 7]);
});

test("Insertion Sort counts the key comparison and excludes the index guard", () => {
  for (const [input, count] of [
    [[1, 2, 3, 4, 5], 4],
    [[5, 4, 3, 2, 1], 10],
    [[2, 2, 2, 2, 2], 4],
    [[7], 0]
  ]) {
    const trace = buildInsertionSortTrace(input);
    assert.equal(trace.at(-1).comparisons, count);
    for (let index = 1; index < trace.length; index += 1) {
      const step = trace[index];
      const delta = step.comparisons - trace[index - 1].comparisons;
      assert.equal(delta, step.phase === "compare" ? 1 : 0);
      if (step.phase === "compare") {
        assert.equal(step.activeLine, 4);
        assert.equal(step.comparisonResult, step.values[step.j] > step.held);
      }
      if (step.phase === "insert" && step.j === -1) assert.match(step.message, /adds no key comparison/);
    }
  }
});

// Independent count: each inversion causes one true comparison. A pass adds
// one false comparison exactly when an earlier key is <= the held key.
function expectedInsertionCount(values) {
  let inversions = 0;
  let terminatingComparisons = 0;
  for (let right = 1; right < values.length; right += 1) {
    let hasEarlierNotLarger = false;
    for (let left = 0; left < right; left += 1) {
      if (values[left] > values[right]) inversions += 1;
      else hasEarlierNotLarger = true;
    }
    if (hasEarlierNotLarger) terminatingComparisons += 1;
  }
  return inversions + terminatingComparisons;
}

function* smallArrays(length, prefix = []) {
  if (!length) { yield prefix; return; }
  for (const value of [-1, 0, 1]) yield* smallArrays(length - 1, [...prefix, value]);
}

test("Both sorting traces preserve keys and order small arrays with duplicates", () => {
  for (let length = 1; length <= 5; length += 1) {
    for (const input of smallArrays(length)) {
      const expected = [...input].sort((a, b) => a - b);
      const insertion = buildInsertionSortTrace(input).at(-1);
      const shellsort = buildShellsortTrace(input).at(-1);
      assert.deepEqual(insertion.values, expected);
      assert.deepEqual(shellsort.values, expected);
      assert.equal(insertion.comparisons, expectedInsertionCount(input));
    }
  }
});

test("Shellsort reproduces all three lecture rows using integer gap reduction", () => {
  const trace = buildShellsortTrace(parseShellsortInput("SHELLSORTEXAMPLE"));
  const rows = trace.filter((step) => step.phase === "pass-complete");
  assert.deepEqual(rows.map((step) => [step.h, step.values.join("")]), [
    [13, "PHELLSORTEXAMSLE"],
    [4, "LEEAMHLEPSOLTSXR"],
    [1, "AEEEHLLLMOPRSSTX"]
  ]);
  assert.deepEqual(trace.filter((step) => step.phase === "decrease-gap").map((step) => step.h), [4, 1, 0]);
  for (const row of rows) {
    for (let index = row.h; index < row.values.length; index += 1) {
      assert.ok(row.values[index - row.h] <= row.values[index], `gap ${row.h}, index ${index}`);
    }
  }
  assert.equal(trace.at(-1).comparisons, 59);
  assert.equal(trace.filter((step) => step.phase === "compare").length, 59);
});

test("Shellsort follows each insertion key through its h-spaced sorted prefix", () => {
  const inputs = [
    parseShellsortInput("SHELLSORTEXAMPLE"),
    Array.from({ length: 16 }, (_, index) => 16 - index),
    Array.from({ length: 16 }, (_, index) => index - 8),
    [4, 4, 2, 2, 3, 3, 1, 1],
    [3, 2, 1],
    [2, 2]
  ];
  const assertOrdered = (values, context) => {
    for (let index = 1; index < values.length; index += 1) {
      assert.ok(values[index - 1] <= values[index], context);
    }
  };

  for (const input of inputs) {
    const trace = buildShellsortTrace(input);
    const starts = trace.flatMap((step, index) => step.phase === "insertion-start" ? [{ step, index }] : []);
    const completions = trace.filter((step) => step.phase === "insertion-complete");
    const expectedInsertions = trace.filter((step) => step.phase === "pass").reduce((sum, step) => sum + Math.max(0, input.length - step.h), 0);
    assert.equal(starts.length, expectedInsertions);
    assert.equal(completions.length, expectedInsertions);
    for (const step of trace.filter((step) => !["insertion-start", "compare", "exchange", "insertion-complete"].includes(step.phase))) {
      assert.equal(step.insertionKey, null, "gap-level states do not retain a completed insertion key");
      assert.equal(step.keyIndex, null);
      assert.deepEqual(step.insertionPath, []);
      const described = new Map(shellsortModule.describe(step).state.map(({ label, value }) => [label, value]));
      assert.equal(described.get("Insertion key"), "none");
      assert.equal(described.get("Key position"), "none");
      assert.equal(described.get("Insertion path"), "none");
    }

    for (const { step: start, index: startIndex } of starts) {
      const endIndex = trace.findIndex((step, index) => index > startIndex && step.phase === "insertion-complete");
      assert.ok(endIndex > startIndex, `insertion h=${start.h}, i=${start.i} must finish`);
      const finish = trace[endIndex];
      const chain = [];
      for (let index = start.i % start.h; index <= start.i; index += start.h) chain.push(index);
      assert.equal(start.activeLine, 4);
      assert.equal(start.keyIndex, start.i);
      assert.equal(start.insertionKey, start.values[start.i]);
      assert.deepEqual(start.insertionPath, [start.i]);
      assertOrdered(chain.slice(0, -1).map((index) => start.values[index]), "the earlier chain prefix is sorted before insertion");

      const expectedPath = [start.i];
      for (let index = startIndex; index <= endIndex; index += 1) {
        const step = trace[index];
        assert.equal(step.h, start.h);
        assert.equal(step.i, start.i);
        assert.equal(step.insertionKey, start.insertionKey);
        assert.ok(chain.includes(step.keyIndex), "the key remains within this insertion's chain prefix");
        assert.equal(step.values[step.keyIndex], start.insertionKey, "the pointer follows the key that began at i");
        // The insertion key may interrupt the order temporarily. The other
        // processed keys remain ordered while exchanges move it left.
        assertOrdered(chain.filter((position) => position !== step.keyIndex).map((position) => step.values[position]), "removing the insertion key leaves the earlier sorted keys ordered");
        for (let position = 0; position < input.length; position += 1) {
          if (!chain.includes(position)) assert.equal(step.values[position], start.values[position], "this insertion cannot alter another chain or a future key");
        }
        if (step.phase === "compare") assert.equal(step.keyIndex, step.j, "comparison j points to the insertion key");
        if (step.phase === "exchange") {
          assert.equal(step.keyIndex, step.j - step.h, "exchange moves the key one h-spaced position left");
          assert.equal(step.keyIndex, trace[index - 1].keyIndex - step.h);
          expectedPath.push(step.keyIndex);
        }
        assert.deepEqual(step.insertionPath, expectedPath, "the movement trail adds a position only after an exchange");
        const described = new Map(shellsortModule.describe(step).state.map(({ label, value }) => [label, value]));
        assert.equal(described.get("Insertion key"), `${start.insertionKey} from A[${start.i}]`, "the text retains the original insertion key and index");
        assert.equal(described.get("Key position"), `A[${step.keyIndex}]`, "the text position follows the key in the drawing");
        assert.equal(described.get("Insertion path"), expectedPath.map((position) => `A[${position}]`).join(" → "), "the text movement trail matches completed exchanges");
        const describedIndices = (label) => [...described.get(label).matchAll(/A\[(\d+)\]/g)].map((match) => Number(match[1]));
        const wholeChain = [];
        for (let position = start.i % start.h; position < input.length; position += start.h) wholeChain.push(position);
        assert.deepEqual(describedIndices("Active subarray"), wholeChain, "the enlarged active subarray has a complete nonvisual equivalent");
        const prefix = step.phase === "insertion-complete" ? chain : chain.filter((position) => position < step.keyIndex);
        assert.deepEqual(describedIndices("Sorted prefix"), prefix, "the sorted bracket excludes the moving key until insertion finishes");
        assertOrdered(prefix.map((position) => step.values[position]), "the prefix identified as sorted is currently ordered");
        if (index > 0) assert.equal(step.comparisons - trace[index - 1].comparisons, step.phase === "compare" ? 1 : 0);
      }
      assert.equal(finish.activeLine, null, "insertion completion summarizes the loop without executing another comparison");
      assert.match(shellsortModule.describe(finish).state.find(({ label }) => label === "Insertion status").value, /complete/i);
      assertOrdered(chain.map((index) => finish.values[index]), "the extended chain prefix is sorted after insertion");
      assert.deepEqual([...finish.values].sort(), [...start.values].sort(), "exchanges preserve every key");
      assert.equal(new Set(trace.slice(startIndex, endIndex + 1).map((step) => step.insertionPath)).size, endIndex - startIndex + 1, "every state owns its path snapshot");
    }
  }
});

test("Shellsort insertion tracking distinguishes equal keys and boundary exits", () => {
  const equal = buildShellsortTrace([2, 2]);
  const equalStart = equal.find((step) => step.phase === "insertion-start");
  const equalFinish = equal.find((step) => step.phase === "insertion-complete");
  assert.equal(equalStart.keyIndex, 1);
  assert.equal(equalFinish.keyIndex, 1);
  assert.equal(equalFinish.comparisons, 1, "equal keys terminate with one false comparison");
  assert.equal(equal.filter((step) => step.phase === "exchange").length, 0);

  const descending = buildShellsortTrace([3, 2, 1]);
  const finalInsertion = descending.filter((step) => step.i === 2 && step.h === 1);
  assert.deepEqual(finalInsertion.filter((step) => step.phase === "exchange").map((step) => step.keyIndex), [1, 0]);
  assert.equal(finalInsertion.at(-1).phase, "insertion-complete");
  assert.equal(finalInsertion.at(-1).keyIndex, 0);
  assert.equal(finalInsertion.at(-1).comparisons, 3, "reaching the left boundary adds no key comparison");
  const lecture = buildShellsortTrace(parseShellsortInput("SHELLSORTEXAMPLE"));
  assert.deepEqual(lecture.filter((step) => step.phase === "pass").map((pass) => [pass.h, lecture.filter((step) => step.h === pass.h && step.phase === "insertion-start").length]), [[13, 3], [4, 12], [1, 15]]);
});

function shellsortGroups(step) {
  if (step.h < 1) return [];
  return Array.from({ length: Math.min(step.h, step.values.length) }, (_, remainder) => {
    const indices = [];
    for (let index = remainder; index < step.values.length; index += step.h) indices.push(index);
    return { remainder, indices };
  });
}

function describedShellsortPrefixes(step) {
  const value = shellsortModule.describe(step).state.find(({ label }) => label === "Subarray sorted prefixes")?.value;
  assert.equal(typeof value, "string", "every state has the aggregate prefix description");
  return [...value.matchAll(/Group\s*(\d+):\s*(.*?)(?=;\s*Group\s*\d+:|$)/g)].map((match) => ({
    remainder: Number(match[1]),
    entries: [...match[2].matchAll(/A\[(\d+)\]\s*=\s*([^,;]+)/g)].map((entry) => ({ index: Number(entry[1]), value: entry[2].trim() }))
  }));
}

test("Shellsort retains each row's completed prefix while other rows insert", () => {
  const inputs = [
    parseShellsortInput("SHELLSORTEXAMPLE"),
    Array.from({ length: 16 }, (_, index) => 16 - index),
    Array.from({ length: 16 }, (_, index) => index),
    [4, 4, 2, 2, 3, 3, 1, 1, 4, 4, 2, 2, 3, 3, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [3, 2, 1]
  ];
  let checkedRowSwitches = 0;
  let checkedMovedKeys = 0;
  const checkedGaps = new Set();
  for (const input of inputs) {
    const trace = buildShellsortTrace(input);
    let previousGap = null;
    let completedPrefixes = new Map();
    let previousInsertion = null;
    for (const step of trace) {
      const groups = shellsortGroups(step);
      // This oracle advances a row only on its insertion-complete event,
      // rather than deriving inactive membership from the current outer i.
      if (step.h !== previousGap) {
        completedPrefixes = new Map(groups.map(({ remainder, indices }) => [remainder, indices.slice(0, 1)]));
        previousInsertion = null;
        previousGap = step.h;
      }
      if (step.phase === "pass-complete") {
        completedPrefixes = new Map(groups.map(({ remainder, indices }) => [remainder, [...indices]]));
      }
      const active = step.i === null || step.h < 1 ? null : step.i % step.h;
      if (step.phase === "insertion-complete") {
        const { indices } = groups.find(({ remainder }) => remainder === active);
        completedPrefixes.set(active, indices.slice(0, indices.indexOf(step.i) + 1));
        previousInsertion = { remainder: active, indices: [...completedPrefixes.get(active)] };
      }
      const textGroups = describedShellsortPrefixes(step);
      assert.deepEqual(textGroups.map(({ remainder }) => remainder), groups.map(({ remainder }) => remainder), "text includes every current h-spaced group in order");
      for (const { remainder, indices } of groups) {
        let expected = completedPrefixes.get(remainder);
        if (remainder === active && step.phase !== "insertion-complete") {
          expected = indices.slice(0, indices.indexOf(step.keyIndex));
        }
        const before = structuredClone(step);
        const actual = shellsortSortedPrefix(step, Object.freeze([...indices]));
        assert.deepEqual(actual, expected, `h=${step.h}, i=${step.i}, phase=${step.phase}, group=${remainder}`);
        assert.deepEqual(step, before, "the prefix helper does not mutate the trace state");
        assert.deepEqual(shellsortSortedPrefix(step, indices), actual, "prefix membership is deterministic");
        const textEntries = textGroups.find((group) => group.remainder === remainder).entries;
        assert.deepEqual(textEntries, actual.map((index) => ({ index, value: String(step.values[index]) })), "text names exactly the same indexed keys as the row bracket");
        for (let position = 1; position < actual.length; position += 1) {
          assert.ok(step.values[actual[position - 1]] <= step.values[actual[position]], "every claimed prefix is currently nondecreasing");
        }
        if (step.phase === "insertion-start" && previousInsertion && previousInsertion.remainder !== active && remainder === previousInsertion.remainder) {
          assert.deepEqual(actual, previousInsertion.indices, "switching to another row retains the completed row's bracket");
          checkedRowSwitches += 1;
        }
        if (step.phase === "exchange" && remainder === active) {
          assert.equal(step.keyIndex, step.j - step.h);
          assert.ok(!actual.includes(step.keyIndex), "the moving key is excluded until insertion completion");
          assert.ok(actual.length < indices.slice(0, indices.indexOf(step.j)).length, "the active prefix follows keyIndex rather than the stale exchange j");
          checkedMovedKeys += 1;
        }
      }
      if (step.phase === "pass") checkedGaps.add(step.h);
    }
  }
  assert.deepEqual([...checkedGaps].sort((a, b) => a - b), [1, 4, 13]);
  assert.ok(checkedRowSwitches > 0, "the inputs exercise retained inactive prefixes across row switches");
  assert.ok(checkedMovedKeys > 0, "the inputs exercise the keyIndex/j distinction after exchanges");
});

test("Shellsort's four rows retain the lecture checkpoint prefixes without claiming future keys", () => {
  const trace = buildShellsortTrace(parseShellsortInput("SHELLSORTEXAMPLE"));
  const checkpoint = trace.find((step) => step.h === 4 && step.i === 9 && step.phase === "insertion-complete");
  const groups = shellsortGroups(checkpoint);
  const expected = [[0, 4, 8], [1, 5, 9], [2, 6], [3, 7]];
  assert.deepEqual(groups.map(({ indices }) => shellsortSortedPrefix(checkpoint, indices)), expected);
  assert.deepEqual(describedShellsortPrefixes(checkpoint).map(({ entries }) => entries.map(({ index }) => index)), expected);
  for (const phase of ["initial", "grow-gap", "pass", "decrease-gap"]) {
    for (const step of trace.filter((event) => event.phase === phase && event.h > 0)) {
      for (const { indices } of shellsortGroups(step)) {
        assert.deepEqual(shellsortSortedPrefix(step, indices), indices.slice(0, 1), "a newly selected gap begins with only each row's trivial singleton prefix");
      }
    }
  }
  for (const step of trace.filter((event) => event.phase === "pass-complete")) {
    for (const { indices } of shellsortGroups(step)) assert.deepEqual(shellsortSortedPrefix(step, indices), indices, "pass completion retains the whole sorted row");
  }
  assert.equal(trace.at(-1).comparisons, 59, "prefix rendering preserves the lecture's comparison trace");
});

test("Shellsort comparison, exchange, and cursor events agree with pseudocode", () => {
  const trace = buildShellsortTrace([7, 6, 5, 4, 3, 2, 1]);
  for (let index = 1; index < trace.length; index += 1) {
    const step = trace[index];
    const previous = trace[index - 1];
    assert.equal(step.comparisons - previous.comparisons, step.phase === "compare" ? 1 : 0);
    if (step.phase === "compare") {
      assert.equal(step.activeLine, 5);
      assert.deepEqual(step.pair, [step.j, step.j - step.h]);
      assert.equal(step.comparisonResult, step.values[step.j] < step.values[step.j - step.h]);
    }
    if (step.phase === "exchange") {
      assert.equal(step.activeLine, 6);
      assert.equal(previous.phase, "compare");
      assert.equal(previous.comparisonResult, true);
      const [right, left] = step.pair;
      assert.equal(step.values[right], previous.values[left]);
      assert.equal(step.values[left], previous.values[right]);
    }
  }
});

test("Compact sorting traces retain operation events and expose bookkeeping through the next state", () => {
  const insertion = buildInsertionSortTrace([6, 4, 1]);
  assert.ok(insertion.every((step) => ["initial", "hold", "compare", "shift", "insert", "complete"].includes(step.phase)));
  const firstShiftIndex = insertion.findIndex((step) => step.phase === "shift");
  assert.equal(insertion[firstShiftIndex].j, 0);
  assert.equal(insertion[firstShiftIndex + 1].phase, "insert");
  assert.equal(insertion[firstShiftIndex + 1].j, -1);
  assert.equal(insertion[firstShiftIndex + 1].comparisons, insertion[firstShiftIndex].comparisons);
  const shell = buildShellsortTrace(parseShellsortInput("SHELLSORTEXAMPLE"));
  assert.ok(shell.every((step) => !["outer", "scan", "move", "boundary"].includes(step.phase)));
  assert.deepEqual(shell.at(-1).completedGaps, [13, 4, 1]);
  assert.equal(shell.filter((step) => step.phase === "exchange").length, 35);
});

test("Shellsort accepts lecture letters and numeric keys with specific type errors", () => {
  assert.deepEqual(parseShellsortInput("shell"), ["S", "H", "E", "L", "L"]);
  assert.deepEqual(parseShellsortInput("s, h, e"), ["S", "H", "E"]);
  assert.deepEqual(parseShellsortInput("-3, 0, 2.5"), [-3, 0, 2.5]);
  assert.throws(() => parseShellsortInput("S, 2"), /do not mix/);
  assert.throws(() => parseShellsortInput("A, !"), /letters A–Z or finite numbers/);
  assert.throws(() => parseShellsortInput("2, Infinity"), /finite numbers/);
  assert.throws(() => parseShellsortInput("A"), /between 2 and 16/);
  assert.throws(() => parseShellsortInput("ABCDEFGHIJKLMNOPQ"), /between 2 and 16/);
});

test("Numeric comparison descriptions retain keys that differ beyond four decimal places", () => {
  for (const module of [insertionSortModule, shellsortModule]) {
    const input = [0.00002, 0.00001];
    const step = module.buildTrace(input).find((state) => state.phase === "compare");
    const comparison = module.describe(step).state.find(({ label }) => label === "Current comparison").value;
    assert.match(comparison, /0\.00002/);
    assert.match(comparison, /0\.00001/);
    assert.match(comparison, /true/);
  }
});

test("Sorting descriptions expose saved keys and interleaved relationships with stable labels", () => {
  for (const module of [insertionSortModule, shellsortModule]) {
    assert.equal(validateModule(module, "06-decrease-conquer"), true);
    const input = module.input.parse(module.input.default);
    const beforeInput = structuredClone(input);
    const trace = module.buildTrace(input);
    assert.deepEqual(input, beforeInput);
    assert.deepEqual(trace, module.buildTrace(input));
    assert.equal(new Set(trace.map((step) => step.values)).size, trace.length);
    const labels = module.describe(trace[0]).state.map(({ label }) => label);
    for (const step of trace) {
      assert.deepEqual(module.describe(step).state.map(({ label }) => label), labels);
      assert.equal(module.describe(step).summary, step.message);
      assert.equal(module.describe(step).state.find(({ label }) => label === "Key comparisons").value, String(step.comparisons));
      const snapshot = structuredClone(step);
      const first = [module.describe(step), module.render(step), module.model(step)];
      assert.deepEqual(first, [module.describe(step), module.render(step), module.model(step)]);
      assert.deepEqual(step, snapshot);
    }
  }
  const shifted = buildInsertionSortTrace([6, 4, 1]).find((step) => step.phase === "shift");
  const shiftedState = insertionSortModule.describe(shifted).state;
  assert.equal(shiftedState.find(({ label }) => label === "Held key v").value, "4");
  assert.match(shiftedState.find(({ label }) => label === "Insertion position").value, /A\[0\].*replaceable/);
  const fourSorted = buildShellsortTrace(parseShellsortInput("SHELLSORTEXAMPLE")).find((step) => step.phase === "pass-complete" && step.h === 4);
  assert.match(shellsortModule.describe(fourSorted).state.find(({ label }) => label === "Gap subsequences").value, /Group 0: A\[0\] = L, A\[4\] = M, A\[8\] = P, A\[12\] = T/);
});

test("Models generalize insertion cases and qualify the Shellsort summary", () => {
  for (const module of [insertionSortModule, shellsortModule]) {
    const trace = module.buildTrace(module.input.parse(module.input.default));
    assert.doesNotMatch(module.model(trace[0]).latex, /\\Theta/);
    const model = module.model(trace.at(-1));
    assert.match(model.latex, /\\sum/);
    if (module === insertionSortModule) {
      assert.match(model.latex, /n\(n-1\)/);
      assert.match(model.latex, /\\Theta\(n\^2\)/);
    } else {
      assert.doesNotMatch(model.latex, /\\Theta/);
      assert.match(model.notes.join(" "), /not a proved universal tight bound/);
      assert.match(model.notes.join(" "), /floor/);
    }
  }
});
