import {buildAmericanFlagTrace,parseAmericanFlagInput,describeAmericanFlag} from "./american-flag-trace.js?v=20261109-2";
import {renderAmericanFlag} from "./american-flag-view.js?v=20261109-2";

export const americanFlagSortModule={
  id:"american-flag-sort",shortTitle:"American flag sort",title:"American Flag Sort",
  summary:"Turn digit counts into bucket boundaries, then permute the original array through cycles of swaps.",
  complexity:"Worst-case Θ(nd) for fixed decimal base, n ≥ 2",
  source:{slides:"Instructor-requested extension; not in the lecture deck",url:"https://xlinux.nist.gov/dads/HTML/americanFlagSort.html"},
  objective:"Trace how Start, End and Next guide in-place cycle permutations, then recursively refine digit buckets.",
  input:{label:"Array A · decimal integers",hint:"Enter 1–14 positive integers up to 99999. # labels track original items through swaps.",
    default:"2,3,2,1,3,2,2,3,2,2,2,1",presets:[
      {label:"Counting-sort input: one digit",value:"2,3,2,1,3,2,2,3,2,2,2,1"},
      {label:"Same four-key exercise",value:"4,1,3,4,3,4,1,1,2,3,4,3,2,1"},
      {label:"Radix input: two digits",value:"23,10,18,51,5,13,31,54,48,62,29,8,37"},
      {label:"One four-position cycle",value:"2,3,4,1"}
    ],parse:parseAmericanFlagInput},
  pseudocode:[
    {line:1,text:"Flag(A, lo, hi, p): // hi excluded"},
    {line:2,text:"if hi − lo ≤ 1 or p = d: return",indent:1},
    {line:3,text:"Count ← digit-p frequencies in A[lo..hi)",indent:1},
    {line:4,text:"prefix sums → Start, End; Next ← Start",indent:1},
    {line:5,text:"for each nonempty bucket b, in order",indent:1},
    {line:6,text:"while Next[b] < End[b]",indent:2},
    {line:7,text:"i ← Next[b]; q ← digit p of A[i]",indent:3},
    {line:8,text:"if q = b: Next[b] ← Next[b] + 1",indent:3},
    {line:9,text:"else",indent:3},
    {line:10,text:"swap A[i], A[Next[q]]; Next[q]++",indent:4,basic:true,basicLabel:"swap"},
    {line:11,text:"for each nonempty bucket b",indent:1},
    {line:12,text:"Flag(A, Start[b], End[b], p + 1)",indent:2},
    {line:13,text:"return",indent:1}
  ],buildTrace:buildAmericanFlagTrace,describe:describeAmericanFlag,render:renderAmericanFlag,
  metrics:step=>[{label:"Swaps",value:step.swaps,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}S=\\sum_c(\\ell_c-1)=${step.swaps}\\\\T_{\\mathrm{worst}}(n,d)\\in\\Theta(nd)\\quad(n\\ge2)\\end{gathered}`:"\\operatorname{Start}[b]=lo+\\sum_{t<b}\\operatorname{Count}[t]",
    notes:step.phase==="complete"?["A cycle touching ℓ distinct positions uses ℓ−1 swaps. Zero swaps can still require counting and scanning each digit; a single item is a constant-time base case.","The same array is permuted, with extra bucket tables and recursion storage. Equal-key order is not guaranteed."]:["Bucket b owns [Start[b], End[b]); End is excluded. Next[b] is its first unfilled slot. A swap fills one destination slot and advances that bucket’s Next."]};},
  analysis:[
    {term:"Variant",value:"Decimal, recursive American flag sort using swap-based cycles. Every current-digit bucket is counted explicitly; no insertion-sort cutoff is used."},
    {term:"From counting to placement",value:"Current-digit counts determine fixed bucket ranges. Only Next changes during permutation; Start and End remain fixed for the call."},
    {term:"Cycle mechanism",value:"Anchor i holds an item belonging to another bucket q. Swapping it with A[Next[q]] fills a q slot, while the displaced item returns to i for the next probe. The cycle closes when the item at i belongs to bucket b. The cycle trail names the slots being rotated; the individual swaps share anchor i."},
    {term:"Counted operation",value:"One pairwise exchange at line 10. Counting, prefix sums, probes, already-correct slots, pointer advances and recursion do not increment Swaps. This unit differs from Counting Sort's array-write count."},
    {term:"Correctness",value:"All filled intervals [Start[b], Next[b]) have digit b and are never overwritten. Each swap or already-correct step advances one Next, so a k-item call fills exactly k positions. Recursion orders the remaining digits within each fixed range."},
    {term:"Space and stability",value:"No n-item output array is used. Bucket tables and recursion still require auxiliary storage. Whole records retain their # identities, but equal-key order can change, so this variant is unstable."},
    {term:"Input conventions",value:"Positive decimal keys use width d from the maximum key, with leading zeros for digit selection. Array positions are 1-based; ranges have excluded upper endpoints. Base cases have at most one item or p=d."},
    {term:"Time model",value:"With unit-cost integer digit extraction and fixed decimal base, T(k,r)=Σ_b T(k_b,r−1)+Θ(k+10). Worst-case time is Θ(nd) for n≥2; fixed d gives Θ(n). Swap count alone does not measure this total time."}
  ]
};
