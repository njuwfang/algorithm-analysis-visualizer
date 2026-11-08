import { parseArray } from "../../core/utils.js";

export function parseCountingInput(raw) {
  const parts = String(raw).split("|").map(part => part.trim());
  if (parts.length !== 2 || parts.some(part => !part)) {
    throw new Error("Enter integer keys followed by | M, for example 2,3,2,1 | 3.");
  }
  const values = parseArray(parts[0], { min: 1, max: 14 });
  const M = Number(parts[1]);
  if (!Number.isInteger(M) || M < 1 || M > 32) throw new Error("M must be an integer from 1 to 32 for this trace.");
  if (values.some(value => !Number.isInteger(value) || value < 1 || value > M)) {
    throw new Error(`Every key must be an integer from 1 to M (${M}).`);
  }
  return { values, M };
}

export function buildCountingTrace(input) {
  const { values, M } = parseCountingInput(`${input.values.join(",")} | ${input.M}`);
  const state = {
    values, M, counts: Array(M).fill(null), positions: Array(M).fill(null),
    starts: Array(M).fill(null), output: Array(values.length).fill(null),
    origins: Array(values.length).fill(null), i: null, j: null, key: null,
    destination: null, before: null, writes: 0, writeDelta: 0, placed: 0
  };
  const trace = [];
  const emit = (phase, activeLine, message, writeDelta = 0) => {
    state.writeDelta = writeDelta;
    state.writes += writeDelta;
    trace.push(structuredClone({ ...state, phase, activeLine, message,
      ...(phase === "ready" ? { activeLabel: "Ready" } : {}) }));
  };
  emit("ready", null, `Use keys as indices into Count[1..${M}], then compute each key's first output position. Indices start at 1.`);
  state.counts.fill(0);
  emit("initialize-count", 1, `Initialize all ${M} Count entries to 0: ${M} array writes.`, M);
  for (let i = 1; i <= values.length; i += 1) {
    state.i = i;
    state.key = values[i - 1];
    state.before = state.counts[state.key - 1];
    state.counts[state.key - 1] += 1;
    emit("count", 3, `Read A[${i}]=${state.key}; Count[${state.key}]: ${state.before} → ${state.before + 1}.`, 1);
  }
  state.i = null; state.key = null; state.before = null;
  state.positions.fill(0);
  emit("initialize-pos", 4, `Initialize all ${M} Pos entries to 0: ${M} array writes.`, M);
  state.j = 1;
  state.positions[0] = 1; state.starts[0] = 1;
  emit("first-position", 5, "Pos[1] ← 1: the smallest key's block starts at output position 1.", 1);
  for (let j = 2; j <= M; j += 1) {
    state.j = j;
    state.positions[j - 1] = state.positions[j - 2] + state.counts[j - 2];
    state.starts[j - 1] = state.positions[j - 1];
    emit("prefix", 7, `Pos[${j}] ← Pos[${j - 1}] + Count[${j - 1}] = ${state.positions[j - 2]} + ${state.counts[j - 2]} = ${state.positions[j - 1]}.`, 1);
  }
  state.j = null;
  for (let i = 1; i <= values.length; i += 1) {
    state.i = i; state.key = values[i - 1];
    state.destination = state.positions[state.key - 1];
    state.output[state.destination - 1] = state.key;
    state.origins[state.destination - 1] = i;
    state.placed += 1;
    emit("place", 9, `A′[Pos[${state.key}]] ← A[${i}]: place ${state.key} at A′[${state.destination}].`, 1);
    state.before = state.positions[state.key - 1];
    state.positions[state.key - 1] += 1;
    emit("advance", 10, `Pos[${state.key}]: ${state.before} → ${state.before + 1}; the next ${state.key} will use the next slot.`, 1);
  }
  state.i = null; state.key = null; state.destination = null; state.before = null;
  emit("complete", null, `A′ is sorted. Equal keys retain their input order; ${state.writes} array writes, with no key-to-key comparisons.`);
  return trace;
}

export function describeCounting(step) {
  const indexed = (name, values) => values.map((value, index) => `${name}[${index + 1}]=${value === null ? "not initialized" : value}`).join("; ");
  return {
    summary: step.message,
    state: [
      { label: "Input size n", value: String(step.values.length) },
      { label: "Key range", value: `1..${step.M}; M=${step.M}; all indices are 1-based` },
      { label: "Input array A", value: indexed("A", step.values) },
      { label: "Input index i", value: step.i === null ? "none" : String(step.i) },
      { label: "Position index j", value: step.j === null ? "none" : String(step.j) },
      { label: "Current key", value: step.key === null ? "none" : String(step.key) },
      { label: "Frequencies Count", value: indexed("Count", step.counts) },
      { label: "Next positions Pos", value: indexed("Pos", step.positions) },
      { label: "Initial block starts", value: indexed("Start", step.starts) },
      { label: "Key blocks in A′", value: step.starts.map((start, k) => start === null ? `key ${k + 1}: not determined` : step.counts[k] === 0 ? `key ${k + 1}: empty block at ${start}` : `key ${k + 1}: positions ${start}..${start + step.counts[k] - 1}`).join("; ") },
      { label: "Output array A′", value: step.output.map((value, index) => `A′[${index + 1}]=${value === null ? "empty" : `${value} from A[${step.origins[index]}]`}`).join("; ") },
      { label: "Current placement", value: step.destination === null ? "none" : `A[${step.i}]=${step.key} → A′[${step.destination}]` },
      { label: "Written output keys", value: String(step.placed) },
      { label: "Current array update", value: step.phase === "count" ? `Count[${step.key}]: ${step.before} → ${step.before + 1}` : step.phase === "advance" ? `Pos[${step.key}]: ${step.before} → ${step.before + 1}` : "none" },
      { label: "Writes this step", value: String(step.writeDelta) },
      { label: "Stability rule", value: "Scan A from 1 to n; each key uses its next free output position. Equal keys retain increasing original input indices (# labels)." },
      { label: "Count scope", value: "Every assignment to a Count, Pos, or A′ entry counts one array write. Vector initialization counts M writes; scalar assignments and guards are excluded. No key-to-key comparison is used." },
      { label: "Array writes", value: String(step.writes) }
    ]
  };
}
