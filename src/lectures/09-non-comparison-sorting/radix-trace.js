import { parseArray } from "../../core/utils.js";
import { projectRadixProof } from "./radix-proof.js?v=20261108-2";

export function parseRadixInput(raw) {
  const values = parseArray(raw, { min: 1, max: 14 });
  if (values.some(value => !Number.isInteger(value) || value < 1 || value > 99999)) {
    throw new Error("Enter positive integer keys from 1 to 99999; digits are processed in base 10.");
  }
  return values;
}

export function buildRadixTrace(input) {
  const values = parseRadixInput(input.join(","));
  const original = values.map((value, index) => ({ value, origin: index + 1 }));
  const d = String(Math.max(...values)).length;
  const state = {
    original, order: structuredClone(original), passInput: structuredClone(original), d, pass: 0, place: 1,
    bins: Array.from({ length: 10 }, () => []), gathered: [],
    i: null, bin: null, current: null, inspected: 0,
    moves: 0, enqueues: 0, dequeues: 0, completed: []
  };
  const trace = [];
  const emit = (phase, activeLine, message) => trace.push(structuredClone({ ...state, phase, activeLine, message,
    ...(phase === "ready" ? { activeLabel: "Ready" } : {}) }));
  emit("ready", null, "Read decimal digits from right to left. FIFO order preserves earlier passes; # in trace messages identifies the original input position.");
  emit("initialize", 1, "Create 10 empty FIFO queues, bin 0 through bin 9. No key has moved.");
  for (let pass = 1; pass <= d; pass += 1) {
    state.pass = pass; state.place = 10 ** (pass - 1);
    state.passInput = [...state.order];
    state.gathered = []; state.i = null; state.bin = null; state.current = null; state.inspected = 0;
    emit("pass-start", 2, pass === 1
      ? "Pass 1: order the units digit by gathering bins 0 through 9. This establishes the first sorted digit."
      : `Pass ${pass}/${d}: the last ${pass - 1} digit${pass === 2 ? " is" : "s are"} already ordered. Group by the ${state.place}s digit and keep that earlier order inside each bin.`);
    for (let i = 1; i <= state.order.length; i += 1) {
      const item = state.order[i - 1];
      const bin = Math.floor(item.value / state.place) % 10;
      state.i = i; state.bin = bin; state.current = item; state.inspected = i;
      state.bins[bin].push(item);
      state.moves += 1; state.enqueues += 1;
      emit("distribute", 4, `A[${i}]=${item.value} (#${item.origin}): ${state.place}s digit ${bin}; append to bin ${bin}'s rear.`);
    }
    state.i = null; state.bin = null; state.current = null;
    emit("gather-start", 5, "Gather bins 0 → 9. Remove from each queue's front, preserving arrival order.");
    for (let bin = 0; bin <= 9; bin += 1) {
      while (state.bins[bin].length) {
        state.bin = bin;
        state.current = state.bins[bin].shift();
        state.gathered.push(state.current);
        state.moves += 1; state.dequeues += 1;
        emit("gather", 7, `Remove ${state.current.value} (#${state.current.origin}) from bin ${bin}'s front → output position ${state.gathered.length}.`);
      }
    }
    state.order = [...state.gathered];
    state.completed.push({ pass, place: state.place, order: [...state.order] });
    state.i = null; state.bin = null; state.current = null;
    emit("pass-complete", 8, `Pass ${pass} complete: bins 0 → 9 order the ${state.place}s digit; FIFO preserves the earlier digits inside each bin. The last ${pass} digit${pass === 1 ? " is" : "s are"} now sorted.`);
  }
  emit("complete", 9, `After ${d} passes, the sorted last ${d} digit${d === 1 ? " covers" : "s cover"} each whole key. A is sorted, using ${state.moves} key moves.`);
  return trace;
}

export function describeRadix(step) {
  const items = values => values.map(item => `${item.value} (#${item.origin})`).join(", ") || "empty";
  const digit = step.current === null ? null : Math.floor(step.current.value / step.place) % 10;
  const proof = projectRadixProof(step);
  return {
    summary: step.message,
    state: [
      { label: "Input size n", value: String(step.original.length) },
      { label: "Original input", value: items(step.original) },
      { label: "Digit count d", value: String(step.d) },
      { label: "Decimal bins", value: "10 FIFO queues labeled 0..9; m=10 denotes the number of bins" },
      { label: "Current pass", value: step.pass === 0 ? "not started" : `${step.pass} of ${step.d}; ${step.place}s digit` },
      { label: "Pass input A", value: step.passInput.map((item, index) => `A[${index + 1}]=${item.value} (#${item.origin})`).join("; ") },
      { label: "Current array A", value: items(step.order) },
      { label: "Distribution progress", value: `${step.inspected} of ${step.original.length} input keys enqueued in this pass` },
      { label: "Input index i", value: step.i === null ? "none" : String(step.i) },
      { label: "Current key and digit", value: step.current === null ? "none" : `${step.current.value} (#${step.current.origin}), padded ${String(step.current.value).padStart(step.d, "0")}; ${step.place}s digit=${digit}` },
      { label: "Active bin", value: step.bin === null ? "none" : String(step.bin) },
      ...step.bins.map((bin, index) => ({ label: `Bin ${index}`, value: `front → ${items(bin)} → rear` })),
      { label: "Gathered output", value: items(step.gathered) },
      { label: "Completed pass orders", value: step.completed.map(pass => `after ${pass.place}s: ${items(pass.order)}`).join("; ") || "none" },
      { label: "Stable pass invariant", value: step.completed.length ? `Last completed pass: sorted by key modulo ${10 ** step.completed.at(-1).pass}; equal digit groups preserve their prior-pass order.` : "No completed pass yet; append at rear and remove at front without rearranging." },
      { label: "Correctness premise", value: !proof.active ? "No pass started; the first pass needs no earlier digit order." : proof.priorDigits === 0 ? "Base case: no earlier digits need ordering; bins 0..9 order the units digit." : `Before this pass, the last ${proof.priorDigits} digits are sorted: ${step.passInput.map(item => item.value % step.place).join(" ≤ ")}.` },
      { label: "Observed digit groups", value: proof.active ? proof.groups.filter(group => group.items.length).map(group => `digit ${group.digit}: ${items(group.items)} in arrival order`).join("; ") || "no keys enqueued yet" : "none" },
      { label: "FIFO correctness witness", value: !proof.witness ? "none yet" : proof.priorDigits === 0 ? `Bin ${proof.witness.digit}: ${items(proof.witness.items)}; each has units digit ${proof.witness.digit}; their input order is retained.` : `Bin ${proof.witness.digit}: ${items(proof.witness.items)}; lower ${proof.priorDigits} digits remain ${proof.lower.join(" ≤ ")}, in the same order as the pass input.` },
      { label: "Gathered suffix values", value: proof.suffixes.length ? `Last ${step.pass} digits of gathered ${proof.checkpoint ? "output" : "prefix"}: ${proof.suffixes.join(" ≤ ")}` : "none gathered yet" },
      { label: "Pass conclusion", value: !proof.checkpoint ? "not yet established for the full array" : proof.verified ? `Verified: all original items are retained, equal-digit groups keep arrival order, and the last ${step.pass} digits are sorted.${step.phase === "complete" ? ` These ${step.d} digits cover every whole key, so A is sorted.` : ""}` : "verification failed" },
      { label: "Digit marks", value: !proof.active ? "no active digit" : `In the pass input and queues: the separated, bold current ${step.place}s digit is new; the grouped lower ${proof.priorDigits} digits keep their earlier order. ${proof.checkpoint ? `Output: the last ${step.pass} digits are marked as verified; separators begin a new current-digit group.` : "Output separators begin a new current-digit group; a partially gathered output is not a completed pass."}` },
      { label: "Current transfer", value: step.current === null ? "none" : step.phase === "distribute" ? `A[${step.i}] → bin ${step.bin} rear` : `bin ${step.bin} front → output[${step.gathered.length}]` },
      { label: "Queue insertions", value: String(step.enqueues) },
      { label: "Queue removals", value: String(step.dequeues) },
      { label: "Leading-zero convention", value: `Keys are padded to ${step.d} decimal digits for digit selection; original numeric values are unchanged.` },
      { label: "Count scope", value: "One key move is an enqueue during distribution or a dequeue into the gathered array. Digit extraction, queue creation, bin visits, and final array adoption are excluded." },
      { label: "Key moves", value: String(step.moves) }
    ]
  };
}
