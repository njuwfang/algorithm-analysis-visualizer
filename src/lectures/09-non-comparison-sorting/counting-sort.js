import { buildCountingTrace, parseCountingInput, describeCounting } from "./counting-trace.js?v=20261108-1";
import { renderCounting } from "./sort-view.js?v=20261108-3";

export const countingSortModule = {
  id: "counting-sort", shortTitle: "Counting sort", title: "Counting Sort",
  summary: "Count each key, compute its output block, then place equal keys in input order.",
  complexity: "Θ(n + M)", source: { slides: "3–15, 17, 39" },
  objective: "Trace Count and Pos with 1-based indexing and explain why the key range M contributes to the cost.",
  input: {
    label: "Array A | maximum key M",
    hint: "Use 1–14 integer keys from 1 to M, then | M (1–32). Indices start at 1.",
    default: "2,3,2,1,3,2,2,3,2,2,2,1 | 3",
    presets: [
      { label: "Lecture: keys 1–3", value: "2,3,2,1,3,2,2,3,2,2,2,1 | 3" },
      { label: "Lecture exercise: keys 1–4", value: "4,1,3,4,3,4,1,1,2,3,4,3,2,1 | 4" }
    ], parse: parseCountingInput
  },
  pseudocode: [
    { line: 1, text: "Count[1..M] ← [0..0]", basic: true, basicLabel: "M array writes" },
    { line: 2, text: "for i ← 1 to n do" },
    { line: 3, text: "Count[A[i]] ← Count[A[i]] + 1", indent: 1, basic: true, basicLabel: "array write" },
    { line: 4, text: "Pos[1..M] ← [0..0]", basic: true, basicLabel: "M array writes" },
    { line: 5, text: "Pos[1] ← 1", basic: true, basicLabel: "array write" },
    { line: 6, text: "for j ← 2 to M do" },
    { line: 7, text: "Pos[j] ← Pos[j−1] + Count[j−1]", indent: 1, basic: true, basicLabel: "array write" },
    { line: 8, text: "for i ← 1 to n do" },
    { line: 9, text: "A′[Pos[A[i]]] ← A[i]", indent: 1, basic: true, basicLabel: "array write" },
    { line: 10, text: "Pos[A[i]] ← Pos[A[i]] + 1", indent: 1, basic: true, basicLabel: "array write" }
  ],
  buildTrace: buildCountingTrace, describe: describeCounting, render: renderCounting,
  metrics: step => [{ label: "Array writes", value: step.writes, emphasis: true }],
  model(step) {
    return {
      latex: step.phase === "complete" ? `\\begin{gathered}W(n,M)=3\\sum_{i=1}^{n}1+3M\\\\=3n+3M=${step.writes}\\\\T(n,M)\\in\\Theta(n+M)\\end{gathered}` : "\\operatorname{Pos}[j]=1+\\sum_{k=1}^{j-1}\\operatorname{Count}[k]",
      notes: step.phase === "complete" ? ["M is part of the input model: if M = O(n), total time is Θ(n). The lecture states the corresponding O bounds.","Only writes to Count, Pos, and A′ are counted. Scalar variables, reads, and loop guards are excluded."] : ["Start retains each key’s first slot. Pos advances to its next free slot during placement; # identifies the original input index."]
    };
  },
  analysis: [
    { term: "Input size", value: "n keys in 1..M. M is supplied separately and may exceed the largest present key; absent keys still have Count and Pos entries." },
    { term: "Counted operation", value: "One write to an entry of Count, Pos, or A′. Each source vector initialization contributes M writes in one trace event. Start and # labels are retained display metadata, not additional algorithm arrays or writes." },
    { term: "Exact sum", value: "Count initialization M, counting n, Pos initialization M, Pos[1] one, prefix positions M−1, output n, and pointer advances n: W=3n+3M." },
    { term: "Stability", value: "The forward scan and increasing Pos entries retain the input order of equal keys. Each output # label identifies its original A index." },
    { term: "Large key range", value: "Slide 17 has n=10 and M=10000, so initializing and scanning the key range can dominate. This drawing limits M to 32; that is a display limit, not a restriction of the lecture algorithm." },
    { term: "Cost assumptions", value: "Unit-cost integer indexing, arithmetic and writes. No key-to-key comparisons; loop guards still test indices. All cases run the same loops for given n and M. The explicit loops give Θ(n+M), tightening the lecture's O(n+M)." }
  ]
};
