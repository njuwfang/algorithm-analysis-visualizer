import { buildRadixTrace, parseRadixInput, describeRadix } from "./radix-trace.js?v=20261108-3";
import { renderRadix } from "./sort-view.js?v=20261108-3";

export const radixSortModule = {
  id: "radix-sort", shortTitle: "Radix sort", title: "Radix Sort",
  summary: "Distribute by one digit, gather FIFO bins, and retain the earlier digit order.",
  complexity: "Θ(d(n + m)); Θ(n) for fixed decimal width", source: { slides: "18–39" },
  objective: "Explain why stable least-significant-digit passes sort whole keys, and relate distribution and gathering to 2dn key moves.",
  input: {
    label: "Array A · decimal integers",
    hint: "Enter 1–14 positive integers up to 99999. Short keys use leading zeros for digit selection.",
    default: "23,10,18,51,5,13,31,54,48,62,29,8,37",
    presets: [
      { label: "Lecture: two digits", value: "23,10,18,51,5,13,31,54,48,62,29,8,37" },
      { label: "Lecture exercise: three digits", value: "329,3,457,657,92,839,87,436,720,355,444" }
    ], parse: parseRadixInput
  },
  pseudocode: [
    { line: 1, text: "create empty FIFO bins 0..9" },
    { line: 2, text: "for p ← 0 to d − 1 do" },
    { line: 3, text: "for each key x in A, in order", indent: 1 },
    { line: 4, text: "enqueue x in bin ⌊x / 10ᵖ⌋ mod 10", indent: 2, basic: true, basicLabel: "key move" },
    { line: 5, text: "for b ← 0 to 9, in order", indent: 1 },
    { line: 6, text: "while bin b is not empty", indent: 2 },
    { line: 7, text: "dequeue its front into the output", indent: 3, basic: true, basicLabel: "key move" },
    { line: 8, text: "use gathered order as A for next pass", indent: 1 },
    { line: 9, text: "return A" }
  ],
  buildTrace: buildRadixTrace, describe: describeRadix, render: renderRadix,
  metrics: step => [{ label: "Key moves", value: step.moves, emphasis: true }],
  model(step) {
    return {
      latex: step.phase === "complete" ? `\\begin{gathered}K(n,d)=\\sum_{p=0}^{d-1}(n+n)\\\\=2dn=${step.moves}\\\\T_{10}(n,d)\\in\\Theta(dn)\\end{gathered}` : "\\begin{gathered}\\text{After }p\\text{ stable passes:}\\\\\\text{ordered by the last }p\\text{ digits}\\end{gathered}",
      notes: step.phase === "complete" ? ["After d passes, the sorted suffix covers the entire padded key; the numeric keys are therefore sorted. Decimal bins are fixed (m=10); fixed d gives Θ(n).", "The lecture gives O(m + dn). Visiting every bin each pass gives Θ(m + d(n+m)) for variable m; with decimal m=10, both yield Θ(dn). Key moves omit bin visits and digit extraction."] : [step.pass <= 1 ? "Base case: gathering bins 0 through 9 sorts the units digit. Larger digits are handled in later passes." : `Inductive step: the incoming last ${step.pass-1} digits are sorted. Bins order the new digit; FIFO preserves the earlier order inside each bin, extending the sorted suffix to ${step.pass} digits.`]
    };
  },
  analysis: [
    { term: "Input size", value: "n positive integers with d decimal digits after leading-zero padding; d is the maximum input width. Bins are 0..9. A single-digit key still takes one full pass." },
    { term: "Reconstructed procedure", value: "The deck supplies distribution/gathering diagrams rather than pseudocode. This outline uses its FIFO queues, least-to-most significant digits, and unchanged arrival order." },
    { term: "Counted operation", value: "One enqueue or one dequeue into the output is a key move: n of each per pass, exactly 2dn. Adopting the gathered buffer is a reference change. Queue creation, arithmetic, and bin/loop checks are excluded." },
    { term: "Why stability matters", value: "Induction: the units pass establishes one sorted digit. Assume the last p−1 digits are sorted. Bins 0..9 order the new digit, while FIFO preserves the lower-digit order among keys in the same bin, establishing p sorted digits. After d passes this suffix is each whole padded key. The checkpoint retains the actual incoming array, an observed bin's FIFO order, and the numerical output suffixes." },
    { term: "Source notation", value: "Slide 37 says digits 0..m, whereas slide 38 speaks of m bins. Here m is the number of bins, 10, with labels 0..m−1. The drawing remains decimal." },
    { term: "Cost qualification", value: "Slide 38's O(m+dn) omits repeated traversal of empty bins. This implementation visits all 10 bins each pass; with fixed m this is Θ(dn). For variable m its outline costs Θ(m+d(n+m)); linear in n also requires fixed d." },
    { term: "Source discrepancy", value: "Slide 34's tens-digit diagram omits 54 from bin 5. It is retained after 51, matching slides 35–36 and the original input." },
    { term: "Scope", value: "Positive decimal integers only, as in the worked example. The deck mentions strings and floating-point keys without specifying their representations; no such extension is added." }
  ]
};
