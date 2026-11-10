import {buildMsdTrace,parseMsdInput,describeMsd} from "./msd-trace.js?v=20261109-1";
import {renderMsd} from "./extension-view.js?v=20261109-2";

export const msdRadixSortModule={
  id:"msd-radix-sort",shortTitle:"MSD radix sort",title:"MSD Radix Sort",
  summary:"Fix a leading digit, then recursively sort only the keys sharing that prefix.",
  complexity:"Worst-case Θ(nd) for decimal keys, n ≥ 2",source:{slides:"Instructor-requested extension; not in the lecture deck",url:"https://xlinux.nist.gov/dads/HTML/topdownRadixSort.html"},
  objective:"Trace the prefix recursion and its base cases, contrasting MSD's early stopping with LSD's complete digit passes.",
  input:{label:"Array A · decimal integers",hint:"Enter 1–14 positive integers up to 99999. Use the same padded digit width as LSD.",
    default:"23,10,18,51,5,13,31,54,48,62,29,8,37",presets:[
      {label:"Same two-digit input as LSD",value:"23,10,18,51,5,13,31,54,48,62,29,8,37"},
      {label:"Same three-digit exercise",value:"329,3,457,657,92,839,87,436,720,355,444"},
      {label:"Equal keys · inspect every digit",value:"329,329,329"}
    ],parse:parseMsdInput},
  pseudocode:[
    {line:1,text:"MSD(S, p):  // initially p = 0"},
    {line:2,text:"if |S| ≤ 1 or p = d: return S",indent:1},
    {line:3,text:"create empty bins B[0..9]",indent:1},
    {line:4,text:"for each item x in S, in order",indent:1},
    {line:5,text:"b ← digit p of x, from the left",indent:2,basic:true,basicLabel:"digit inspection"},
    {line:6,text:"append x to B[b]",indent:2},
    {line:7,text:"for each nonempty B[b], b = 0..9",indent:1},
    {line:8,text:"B[b] ← MSD(B[b], p + 1)",indent:2},
    {line:9,text:"return concatenate B[0], …, B[9]",indent:1}
  ],buildTrace:buildMsdTrace,render:renderMsd,describe:describeMsd,
  metrics:step=>[{label:"Digit inspections",value:step.inspections,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}D=${step.inspections}\\le nd=${step.original.length*step.d}\\\\T_{\\mathrm{worst}}(n,d)\\in\\Theta(nd)\\quad(n\\ge2)\\end{gathered}`:"\\begin{gathered}D(k,r)=k+\\sum_b D(k_b,r-1)\\\\D(k,0)=0\\\\D(0,r)=D(1,r)=0\\end{gathered}",notes:step.phase==="complete"?["Fixed decimal base. Singleton groups stop early; equal keys can require every digit. A single key is a constant-time base case with zero inspections."]:["k is the current group size; r is the number of remaining digits; k_b is the size of digit bin b. Total time adds Θ(k+10) work per nontrivial call, including appends, bin visits, and concatenation."]};},
  analysis:[
    {term:"Scope",value:"Instructor-requested extension based on NIST's top-down radix sort. Numeric inputs and zero padding match the existing LSD module; the equal-key case repeats a source key."},
    {term:"Fixed prefix",value:"Every node contains only keys sharing its displayed prefix. * denotes digits not fixed by that prefix. Child groups occupy consecutive ranges in increasing digit order."},
    {term:"Base cases",value:"Return when the group has at most one key or all d digit positions are fixed. Empty bins do not generate recursive calls."},
    {term:"Counted operation",value:"One current-digit read at line 5. Enqueueing is a separate event without another inspection. D equals the sum of group sizes over calls that actually distribute."},
    {term:"Correctness",value:"Different leading-digit bins are already in their final relative order. Recursively ordering the remaining digits within each bin completes the parent. No comparison merge or repeated whole-array LSD pass is used."},
    {term:"Stable convention",value:"Items are appended in arrival order, and equal keys finish in the same final group. This queue-based implementation is stable; not every MSD implementation is."},
    {term:"Cost model",value:"Unit-cost integer digit extraction, indexing, and queue operations. For group size k and r remaining digits, T(k,r)=Σ_b T(k_b,r−1)+Θ(k+10), with constant-time return base cases. For fixed decimal base, worst-case Θ(nd) holds for n≥2; fixed d gives Θ(n). Equal keys attain the worst case; singleton groups can stop early. This is not a bit-complexity bound."}
  ]
};
