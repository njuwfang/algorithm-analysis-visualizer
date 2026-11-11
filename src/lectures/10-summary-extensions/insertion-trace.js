import {records, indexed, inversionPairs, pairText, snapshot} from "./shared.js?v=20261110-1";

export function buildInsertionInversions(values) {
  const original = records(values), a = snapshot(original), trace = [];
  const initialPairs = inversionPairs(original);
  let held = null, hole = null, i = null, j = null, shifts = 0, comparisons = 0, removed = null, test = null;
  const add = (phase, activeLine, message) => {
    const logical = a.map((item, index) => index === hole ? held : item);
    trace.push(snapshot({phase, activeLine, ...(phase === "ready" ? {activeLabel:"Ready"} : {}), message, original, a, logical, held, hole, i, j,
      shifts, comparisons, removed, test, initialPairs, remaining: inversionPairs(logical)}));
  };
  add("ready", null, "An inversion is an earlier key larger than a later key. Follow how insertion removes these pairs.");
  for (i = 1; i < a.length; i += 1) {
    held = a[i]; a[i] = null; hole = i; j = i - 1; removed = null; test = null;
    add("pick", 2, `Hold ${held.value} from A[${i}]. The square marks its logical insertion position.`);
    while (j >= 0) {
      comparisons += 1; test = a[j].value > held.value;
      add("compare", 3, `${a[j].value} > ${held.value} is ${test}. ${test ? "Shift this larger key next." : "The key can be placed after it."}`);
      if (!test) break;
      removed = {i: j, j: hole, left: {...a[j]}, right: {...held}};
      a[hole] = a[j]; a[j] = null; hole = j; j -= 1; shifts += 1;
      add("shift", 4, `Shift ${removed.left.value} right. Moving held key ${held.value} one logical position left removes exactly this inversion.`);
    }
    if (j < 0) add("boundary", 3, "The held key reached the beginning; the index check performs no key comparison.");
    a[hole] = held; held = null; hole = null; test = null;
    add("place", 5, `Place the key at A[${j + 1}]. The prefix through A[${i}] is sorted.`);
  }
  i = null; j = null; removed = null;
  add("complete", 6, `Sorted. ${shifts} shifts removed all ${initialPairs.length} original inversions.`);
  return trace;
}

export function describeInsertionInversions(step) {
  return {summary: step.message, state: [
    {label: "Original array", value: indexed(step.original)},
    {label: "Stored array", value: indexed(step.a)},
    {label: "Logical order", value: indexed(step.logical)},
    {label: "Held key", value: step.held ? `${step.held.value}(#${step.held.id})` : "none"},
    {label: "Hole", value: step.hole === null ? "none" : `A[${step.hole}]`},
    {label: "Insertion indices", value: step.i === null ? "none" : `i=${step.i}; j=${step.j}`},
    {label: "Key test", value: step.test === null ? "not evaluated" : String(step.test)},
    {label: "Original inversions", value: pairText(step.initialPairs)},
    {label: "Remaining inversions", value: pairText(step.remaining)},
    {label: "Last removed pair", value: step.removed ? pairText([step.removed]) : "none"},
    {label: "Inversion relationship", value: `${step.remaining.length} remaining + ${step.shifts} removed = ${step.initialPairs.length} original`},
    {label: "Key comparisons", value: String(step.comparisons)},
    {label: "Shifts", value: String(step.shifts)}
  ], details: ["Indices and original record identities # are zero-based. Equal keys do not form an inversion.",
    "Replace the square with the held key to read the logical order. Each shift exchanges that held key with one larger logical neighbor.",
    "The pair diagram and its bookkeeping are explanatory metadata. They are excluded from insertion sort's running-time model."]};
}
