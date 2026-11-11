import {parseKeys, records, indexed, pairText, snapshot} from "./shared.js?v=20261110-1";

export function parseHybrid(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2) throw new Error("Enter integer keys | cutoff, for example 3,1,2,5,4 | 2.");
  const values = parseKeys(parts[0]), cutoff = Number(parts[1].trim());
  if (!parts[1].trim() || !Number.isInteger(cutoff) || cutoff < 1 || cutoff > 10) throw new Error("The insertion cutoff must be an integer from 1 to 10.");
  return {values, cutoff};
}

export function baselineMergeComparisons(values) {
  let count = 0;
  function sort(items) {
    if (items.length <= 1) return items;
    const middle = Math.floor(items.length / 2), left = sort(items.slice(0, middle)), right = sort(items.slice(middle)), out = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) { count += 1; out.push(left[i] <= right[j] ? left[i++] : right[j++]); }
    return [...out, ...left.slice(i), ...right.slice(j)];
  }
  sort([...values]); return count;
}

export function buildMergeInversions(values) { return buildMergeProcess(values, 1, false); }
export function buildHybridMerge({values, cutoff}) { return buildMergeProcess(values, cutoff, true); }

function buildMergeProcess(values, cutoff, hybrid) {
  const original = records(values), a = snapshot(original), frames = [], trace = [], batches = [];
  const baseline = baselineMergeComparisons(values);
  let activeId = 0, comparisons = 0, inversions = 0, shifts = 0, held = null, hole = null, insertionIndex = null, scan = null;
  const stack = [], lines = hybrid ? {enter:1, base:2, split:8, init:8, compare:9, emit:10, batch:10, tail:11, copy:11, done:12} :
    {enter:1, base:2, split:3, init:6, compare:7, emit:8, batch:9, tail:10, copy:11, done:12};
  function add(phase, activeLine, message) {
    trace.push(snapshot({phase, activeLine, ...(phase === "ready" ? {activeLabel:"Ready"} : {}), message, original, a, frames, activeId, stack, comparisons, inversions, shifts,
      held, hole, insertionIndex, scan, cutoff, hybrid, batches, baseline}));
  }
  function makeFrame(lo, hi, parent = null) {
    const frame = {id: frames.length, parent, lo, hi, depth: stack.length, status:"pending", middle:null,
      left:[], right:[], leftUsed:0, rightUsed:0, out:[], batch:[], cross:0, total:null, result:null, children:[]};
    frames.push(frame); return frame;
  }
  const root = makeFrame(0, a.length);
  add("ready", null, hybrid ? `Sort with insertion leaves of at most ${cutoff} keys; count key comparisons in both stages.` : "Count inversions within each half, then count cross-half inversions while merging.");
  function solve(frame) {
    activeId = frame.id; stack.push(frame.id); frame.status = "active";
    add("enter", lines.enter, `Enter range [${frame.lo},${frame.hi}); the upper endpoint is excluded.`);
    if (frame.hi - frame.lo <= 1) {
      frame.result = a.slice(frame.lo, frame.hi); frame.total = 0; frame.status = "complete";
      add("base", lines.base, "A range of at most one key is sorted and has no inversions.");
      stack.pop(); return 0;
    }
    if (hybrid && frame.hi - frame.lo <= cutoff) {
      frame.status = "insertion";
      add("cutoff", 3, `This ${frame.hi - frame.lo}-key range meets cutoff ${cutoff}; use insertion sort here.`);
      for (insertionIndex = frame.lo + 1; insertionIndex < frame.hi; insertionIndex += 1) {
        held = a[insertionIndex]; a[insertionIndex] = null; hole = insertionIndex; scan = insertionIndex - 1;
        add("pick", 4, `Hold ${held.value}; insert it within [${frame.lo},${insertionIndex + 1}).`);
        while (scan >= frame.lo) {
          comparisons += 1; const larger = a[scan].value > held.value;
          add("insertion-compare", 5, `${a[scan].value} > ${held.value} is ${larger}. Count one key comparison.`);
          if (!larger) break;
          const shifted = a[scan]; a[hole] = shifted; a[scan] = null; hole = scan; scan -= 1; shifts += 1;
          add("insertion-shift", 6, `Shift ${shifted.value} right within this insertion leaf.`);
        }
        a[hole] = held; held = null; hole = null;
        add("insertion-place", 7, `Place the held key at A[${scan + 1}].`);
      }
      insertionIndex = null; scan = null; frame.result = a.slice(frame.lo, frame.hi); frame.total = 0; frame.status = "complete";
      add("leaf-return", 7, "Return the sorted insertion leaf to its parent.");
      stack.pop(); return 0;
    }
    frame.middle = Math.floor((frame.lo + frame.hi) / 2); frame.status = "split";
    const left = makeFrame(frame.lo, frame.middle, frame.id), right = makeFrame(frame.middle, frame.hi, frame.id);
    frame.children = [left.id, right.id];
    add("split", lines.split, `Split at ${frame.middle}; retain both subproblems.`);
    const leftCount = solve(left); activeId = frame.id;
    add("left-return", hybrid ? 8 : 4, "The left sorted result is retained; solve the right range next.");
    const rightCount = solve(right); activeId = frame.id;
    add("right-return", hybrid ? 8 : 5, "Both sorted halves are retained; merge them next.");
    frame.left = a.slice(frame.lo, frame.middle); frame.right = a.slice(frame.middle, frame.hi); frame.status = "merging";
    add("merge-ready", lines.init, "Read the two sorted halves into merge queues; the output starts empty.");
    while (frame.leftUsed < frame.left.length && frame.rightUsed < frame.right.length) {
      const l = frame.left[frame.leftUsed], r = frame.right[frame.rightUsed];
      comparisons += 1; frame.batch = [];
      add("merge-compare", lines.compare, `${l.value} ≤ ${r.value} is ${l.value <= r.value}. Count one key comparison.`);
      if (l.value <= r.value) {
        frame.out.push(l); frame.leftUsed += 1;
        add("take-left", lines.emit, `Emit left key ${l.value}. No new cross-half inversions; ties go left.`);
      } else {
        if (!hybrid) {
          frame.batch = frame.left.slice(frame.leftUsed).map(item => ({left:{...item}, right:{...r}}));
          frame.cross += frame.batch.length; inversions += frame.batch.length;
          batches.push({frame:frame.id, pairs:snapshot(frame.batch)});
        }
        frame.out.push(r); frame.rightUsed += 1;
        add("take-right", lines.batch, hybrid ? `Emit right key ${r.value}; comparisons were counted in the preceding step.` :
          `Emit right key ${r.value}. All ${frame.batch.length} remaining left keys are larger: add ${frame.batch.length} inversions at once.`);
      }
    }
    frame.batch = [];
    frame.out.push(...frame.left.slice(frame.leftUsed), ...frame.right.slice(frame.rightUsed));
    frame.leftUsed = frame.left.length; frame.rightUsed = frame.right.length;
    add("tail", lines.tail, "Append the remaining queue tail without another key comparison.");
    a.splice(frame.lo, frame.hi - frame.lo, ...frame.out); frame.result = snapshot(frame.out); frame.total = leftCount + rightCount + frame.cross; frame.status = "complete";
    add("copy-back", lines.copy, `Copy the sorted output back into A[${frame.lo}..${frame.hi - 1}].`);
    add("return", lines.done, hybrid ? "Return the sorted range." : `Return ${leftCount} left + ${rightCount} right + ${frame.cross} cross = ${frame.total} inversions for this range.`);
    stack.pop(); return frame.total;
  }
  solve(root); activeId = root.id;
  add("complete", null, hybrid ? `Sorted with ${comparisons} key comparisons. Standard mergesort on this same input uses ${baseline}; this is a comparison-count observation, not a timing claim.` :
    `Sorted. The disjoint left, right, and cross contributions count all ${inversions} inversions exactly once.`);
  return trace;
}

export function describeMergeProcess(step) {
  const frame = step.frames.find(item => item.id === step.activeId);
  return {summary:step.message, state:[
    {label:"Original array", value:indexed(step.original)}, {label:"Current array", value:indexed(step.a)},
    {label:"Active range", value:`[${frame.lo},${frame.hi}); upper endpoint excluded`},
    {label:"Call stack", value:step.stack.map(id => {const f=step.frames[id];return `[${f.lo},${f.hi})`;}).join(" → ") || "empty"},
    {label:"Recursive ranges", value:step.frames.map(f=>`#${f.id} [${f.lo},${f.hi}), parent ${f.parent === null ? "none" : `#${f.parent}`}, ${f.status}; returned ${f.result ? indexed(f.result) : "not returned"}${step.hybrid ? "" : `; inversions ${f.total === null ? "not returned" : f.total}`}`).join("; ")},
    {label:"Left queue", value:indexed(frame.left)}, {label:"Right queue", value:indexed(frame.right)},
    {label:"Queue positions", value:`left consumed ${frame.leftUsed}/${frame.left.length}; right consumed ${frame.rightUsed}/${frame.right.length}`},
    {label:"Merge output", value:indexed(frame.out)}, {label:"Current inversion batch", value:pairText(frame.batch)},
    {label:"Active cross contribution", value:String(frame.cross)},
    {label:"Retained contributions", value:step.batches.map(batch=>`range #${batch.frame}: ${pairText(batch.pairs)}`).join("; ") || "none"},
    {label:"Held insertion key", value:step.held ? `${step.held.value}(#${step.held.id})` : "none"},
    {label:"Insertion position", value:step.hole === null ? "none" : `i=${step.insertionIndex}; scan=${step.scan}; hole A[${step.hole}]`},
    {label:"Cutoff", value:step.hybrid ? String(step.cutoff) : "not used"},
    {label:"Baseline comparisons", value:step.hybrid && step.phase === "complete" ? String(step.baseline) : "not revealed"},
    {label:"Key comparisons", value:String(step.comparisons)},
    {label:"Inversions counted", value:String(step.inversions)}, {label:"Insertion shifts", value:String(step.shifts)}
  ].filter(row=>!step.hybrid || !["Current inversion batch","Active cross contribution","Retained contributions","Inversions counted"].includes(row.label)), details:["All ranges use zero-based [lo,hi) endpoints. Original record identities # distinguish equal keys; ties are taken from the left.",
    "Queue outputs are temporary. A changes when the completed output is copied back; insertion leaves additionally hold one key beside a square.",
    step.hybrid ? "Comparison counts include both insertion-key tests and merge-head tests; they exclude index guards, copying, and the separately computed standard-mergesort baseline." : "An inversion batch contains every unconsumed left key paired with the emitted smaller right key. Comparison counts exclude index guards, copying, and explanatory pair bookkeeping."]};
}
