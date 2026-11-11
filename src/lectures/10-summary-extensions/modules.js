import {parseKeys} from "./shared.js?v=20261110-1";
import {buildInsertionInversions,describeInsertionInversions} from "./insertion-trace.js?v=20261110-1";
import {buildMergeInversions,buildHybridMerge,parseHybrid,describeMergeProcess} from "./merge-trace.js?v=20261110-1";
import {buildDecisionTrace,parseDecisionInput,describeDecision} from "./decision-trace.js?v=20261110-1";
import {buildConnections,parseConnection,describeConnections,buildSelection,parseSelection,describeSelection} from "./reasoning-traces.js?v=20261110-1";
import {renderConnections,renderInsertion,renderMerge,renderDecision,renderSelection} from "./views.js?v=20261110-1";

const extension="Instructor-requested synthesis/extension of Lectures 06–09; no new source deck";
const keysHint="Use 1–10 integer keys from −99 to 99. Indices and original record identities # start at zero.";
const arrays=[
  {label:"Three inversions",value:"3,1,2,5,4"},
  {label:"Reverse order",value:"5,4,3,2,1"},
  {label:"Already ordered",value:"1,2,3,4,5"},
  {label:"Equal keys and payload identities",value:"2,1,2,1,2"}
];

export const connectionsModule={
  id:"strategy-connections",shortTitle:"Strategy connections",title:"Connecting Lectures 06–09",
  summary:"Compare what each familiar algorithm retains, transforms, or exploits before selecting its cost model.",
  complexity:"Models depend on the retained subproblems, representation, and key assumptions",source:{slides:extension},
  objective:"Distinguish recursive structure from representation and key information, including strategies that overlap.",
  input:{label:"Method | size n | optional M or d",hint:"Methods: binary-search, mergesort, horner (n = degree), counting-sort (add M), american-flag (add d). Size n: 2–64.",
    default:"binary-search | 16",presets:[
      {label:"06 · binary search",value:"binary-search | 16"},
      {label:"07 · mergesort",value:"mergesort | 8"},
      {label:"08 · Horner’s rule",value:"horner | 4"},
      {label:"09 · counting sort",value:"counting-sort | 10 | 4"},
      {label:"Overlap · American Flag",value:"american-flag | 8 | 2"}
    ],parse:parseConnection},
  codeTitle:"Reasoning steps",
  pseudocode:[
    {line:1,text:"Identify what is retained or transformed.",basic:true,basicLabel:"reasoning move"},
    {line:2,text:"Name the operation and its assumptions.",basic:true,basicLabel:"reasoning move"},
    {line:3,text:"Account for local and recursive work.",basic:true,basicLabel:"reasoning move"},
    {line:4,text:"Generalize; keep every size parameter.",basic:true,basicLabel:"reasoning move"}
  ],buildTrace:buildConnections,render:renderConnections,describe:describeConnections,
  metrics:step=>[{label:"Connections examined",value:step.checks,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}${step.example.latex}\\\\${step.example.growth}\\end{gathered}`:step.method==="counting-sort"?`n=${step.n},\\quad M=${step.parameter}`:step.method==="american-flag"?`n=${step.n},\\quad d=${step.parameter}`:`n=${step.n}`,
    notes:[step.phase==="complete"?"These are models of familiar algorithms, not an execution count from this walkthrough. Base cases are constant-time; Horner’s n is degree, and binary-search probes use a worst-case one-probe recurrence.":"First identify structure and the counted operation. The four reasoning moves are not algorithm runtime operations.",...(step.phase==="complete"&&step.method==="american-flag"?["Fixed decimal base and unit-cost digit operations; n≥2. Counts establish ranges, recursive digit groups refine them, and swaps are only one part of total time."]:[])]};},
  analysis:[
    {term:"Review scope",value:"Lecture 06 reduces to one smaller instance; Lecture 07 solves several. Lecture 08 changes the instance or representation; Lecture 09 exploits restricted values or digits. These are compatible ideas, not exclusive labels."},
    {term:"One branch versus two",value:"Binary search retains one half with constant local work; mergesort retains both halves and merges. Similar subproblem sizes do not imply similar recurrences."},
    {term:"Representation",value:"Horner reuses a nested polynomial accumulator. Presorting makes equal keys adjacent; AVL changes the structure of an ordered collection. The existing FFT extension also changes representation before multiplying."},
    {term:"Fewer expensive products",value:"The integer and Strassen modules reduce the number of recursive products while adding reconstruction work. Include both parts of their recurrences; comparing only product counts does not count all work."},
    {term:"Input assumptions",value:"Counting retains n and range M; radix methods retain n, digit width d, and the base. Interpolation search additionally needs distribution assumptions for its expected behavior; sorted input alone is insufficient."},
    {term:"Crossing categories",value:"American Flag combines digit counts and prefix-sum boundaries with cycles and recursive refinement. Quickselect and the already-introduced Quicksort reuse partitioning but retain different sets of recursive subproblems."}
  ]
};

export const insertionInversionsModule={
  id:"insertion-inversions",shortTitle:"Inversions and insertion",title:"Inversions and Adaptive Insertion Sort",
  summary:"Measure disorder by out-of-order pairs and see one inversion disappear with every shift.",
  complexity:"Θ(n + I) time; exactly I shifts",source:{slides:extension,url:"https://algs4.cs.princeton.edu/21elementary/"},
  objective:"Explain why a shift removes exactly one inversion and derive insertion sort’s dependence on both n and I.",
  input:{label:"Array A",hint:keysHint,default:arrays[0].value,presets:arrays,parse:parseKeys},
  pseudocode:[
    {line:1,text:"for i ← 1 to n − 1"},
    {line:2,text:"hold key ← A[i]; j ← i − 1",indent:1},
    {line:3,text:"while j ≥ 0 and A[j] > key",indent:1},
    {line:4,text:"A[j+1] ← A[j]; j ← j − 1",indent:2,basic:true,basicLabel:"one shift"},
    {line:5,text:"A[j+1] ← key",indent:1},
    {line:6,text:"return A"}
  ],buildTrace:buildInsertionInversions,render:renderInsertion,describe:describeInsertionInversions,
  metrics:step=>[{label:"Shifts",value:step.shifts,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}S=I_0=${step.initialPairs.length}\\\\T(n,I_0)\\in\\Theta(n+I_0)\\end{gathered}`:"R+S=I_0",notes:[step.phase==="complete"?"I₀ is the input’s inversion count. Each shift removes one pair; scanning/placement also costs Θ(n). When I₀=O(n), insertion takes Θ(n); reverse distinct keys have I₀=n(n−1)/2.":"R is the number of inversions still present; S is the number of shifts so far. Read the square as the held key when following the logical order."]};},
  analysis:[
    {term:"Definition",value:"An inversion is a pair of positions i<j with A[i]>A[j]. Equal keys are not inversions. n is the number of records; I₀ is the original number of inversions."},
    {term:"Shift convention",value:"The lecture uses shifts rather than adjacent swaps. A square visually marks the held key’s logical position; it is explanatory ownership notation, not an extra store counted by the algorithm."},
    {term:"One pair per shift",value:"The held key passes one larger neighbor. Their order changes, while every other pair of record identities keeps its relative order. Exactly that inversion disappears."},
    {term:"Count and total time",value:"S=I₀ shifts. Successful key tests cause shifts; at most n−1 additional failed key tests stop insertions. Placement and loop overhead cost Θ(n), yielding Θ(n+I₀) under unit-cost comparisons/moves."},
    {term:"Correctness and stability",value:"After placing the key, the prefix through i is sorted and contains the same records. Strict > tests preserve the order of equal records."},
    {term:"Visualization cost",value:"The inversion grid is computed for teaching and is excluded from the insertion algorithm’s cost model. The trace history also lies outside the auxiliary-space model; ordinary shift-based insertion needs one held key."}
  ]
};

export const mergeInversionsModule={
  id:"merge-inversions",shortTitle:"Count inversions by merge",title:"Counting Inversions with Merge",
  summary:"Count a batch of cross-half inversions whenever a smaller right key precedes the remaining left keys.",
  complexity:"Θ(n log n) total time for n≥2",source:{slides:extension,url:"https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/Inversions.html"},
  objective:"Partition inversions into left, right, and cross contributions and count each exactly once during a stable merge.",
  input:{label:"Array A",hint:keysHint,default:arrays[0].value,presets:arrays,parse:parseKeys},
  pseudocode:[
    {line:1,text:"Count(A, lo, hi):  // hi excluded"},
    {line:2,text:"if hi − lo ≤ 1: return 0",indent:1},
    {line:3,text:"mid ← floor((lo + hi)/2)",indent:1},
    {line:4,text:"left ← Count(A, lo, mid)",indent:1},
    {line:5,text:"right ← Count(A, mid, hi)",indent:1},
    {line:6,text:"copy halves to L, R; cross ← 0",indent:1},
    {line:7,text:"while both remain: compare heads",indent:1},
    {line:8,text:"if L head ≤ R head: emit L head",indent:2},
    {line:9,text:"else: cross += |L remaining|; emit R",indent:2,basic:true,basicLabel:"inversion contribution"},
    {line:10,text:"append remaining tail to output",indent:1},
    {line:11,text:"copy output into A[lo..hi−1]",indent:1},
    {line:12,text:"return left + right + cross",indent:1}
  ],buildTrace:buildMergeInversions,render:renderMerge,describe:describeMergeProcess,
  metrics:step=>[{label:"Inversions counted",value:step.inversions,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}I=I_L+I_R+I_{\\times}=${step.inversions}\\\\T(n)\\in\\Theta(n\\log n)\\quad(n\\ge2)\\end{gathered}`:"\\begin{gathered}I=I_L+I_R+I_{\\times}\\\\T(n)=2T(n/2)+\\Theta(n)\\end{gathered}",notes:["The displayed count is a mathematical quantity, not the number of executed comparisons: a single batch addition can count many pairs. Equal halves express the power-of-two recurrence; arbitrary sizes use floor/ceiling halves. T(0), T(1)=Θ(1)."]};},
  analysis:[
    {term:"Three disjoint cases",value:"Every original pair lies entirely in the left half, entirely in the right half, or crosses from left to right. Recursive calls count the first two; merge counts the third."},
    {term:"Batch reason",value:"If the right head is smaller than the left head, it is smaller than all remaining left keys because L is sorted. Add their number in constant-time arithmetic, then emit the right head."},
    {term:"No equality contribution",value:"When heads are equal, emit left. Equality is not an inversion, and left-first ties preserve record stability."},
    {term:"Count versus time",value:"Inversions counted is the result accumulated, not a runtime-operation count. One merge needs Θ(k) time for k keys, even if one addition counts Θ(k) pairs. The visual list of those pairs is explanatory metadata excluded from the algorithm model."},
    {term:"Conventions",value:"Zero-based half-open ranges; floor midpoint; empty/singleton bases return zero. Temporary output is shown separately and copied back only after the merge finishes."},
    {term:"Space and arithmetic",value:"Standard merge buffering needs O(n) auxiliary records plus O(log n) call depth; counters and comparisons use the unit-cost model. Retained drawings and trace snapshots are excluded."}
  ]
};

export const decisionTreeModule={
  id:"sorting-lower-bound",shortTitle:"Sorting lower bound",title:"Why Comparison Sorting Needs Many Comparisons",
  summary:"Follow a three-key decision tree, then count the leaves required by any comparison sorting procedure.",
  complexity:"Worst-case Ω(n log n) comparisons for distinct keys",source:{slides:extension,url:"https://courses.csail.mit.edu/6.006/fall09/lecture_notes/lecture10.pdf"},
  objective:"Distinguish one executed path from worst-case height and explain the assumptions behind the comparison-sorting lower bound.",
  input:{label:"Three distinct keys",hint:"Enter exactly three distinct integer keys from −99 to 99. Leaves refer to original zero-based indices.",default:"9,4,6",presets:[
    {label:"Three-comparison path",value:"9,4,6"}, {label:"Two-comparison path",value:"1,2,3"}, {label:"Reverse order",value:"3,2,1"}
  ],parse:parseDecisionInput},
  codeTitle:"Decision-tree reasoning",
  pseudocode:[
    {line:1,text:"Start with 3! = 6 possible orders."},
    {line:2,text:"Ask the current binary key comparison.",basic:true,basicLabel:"key comparison"},
    {line:3,text:"Keep orders consistent with its answer."},
    {line:4,text:"Stop when one order remains."},
    {line:5,latex:"2^h\\ge 3!=6\\;\\Longrightarrow\\;h\\ge3",spoken:"Six leaves require worst-case height at least three."},
    {line:6,latex:"n!\\le2^h\\;\\Longrightarrow\\;h\\ge\\log_2(n!)",spoken:"For n distinct keys, the worst-case height is at least log base two of n factorial."}
  ],buildTrace:buildDecisionTrace,render:renderDecision,describe:describeDecision,
  metrics:step=>[{label:"Key comparisons",value:step.comparisons,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?"\\begin{gathered}n!\\le2^h\\;\\Longrightarrow\\;h\\ge\\log_2(n!)\\\\h\\in\\Omega(n\\log n)\\end{gathered}":step.phase==="capacity"?"2^2=4<6\\le8=2^3":"N=3!=6",notes:[step.phase==="complete"?"h is the maximum comparisons on any path, not the comparisons for this input. Distinct keys give n! possible orders; each binary answer branches at most twice. Key indexing and digit extraction lie outside this model.":"The counter records only this input’s comparisons. Some paths take two; at least one must take three. Branch pruning and proof steps add no key comparisons."]};},
  analysis:[
    {term:"Model",value:"The algorithm learns the relative order of distinct keys through binary comparisons only. Internal nodes are comparisons; each leaf identifies an ordering of original indices."},
    {term:"Why n! leaves",value:"There are n! possible strict relative orders, and each needs a distinguishable output ordering. A binary tree of height h has at most 2^h leaves."},
    {term:"Growth without Stirling",value:"For n≥2, the largest floor(n/2) factors of n! are each at least n/2. Thus log₂(n!)≥floor(n/2) log₂(n/2), which gives Ω(n log n) as n grows."},
    {term:"Worst case",value:"The bound guarantees a long path for some input; it does not require every input to take that many comparisons. The prepared two-comparison path makes the distinction concrete."},
    {term:"Counting and radix",value:"Counting uses values as array addresses; radix reads digits. They exploit additional operations and key restrictions, so their Θ(n+M) or Θ(d(n+b)) models do not contradict the comparison-only lower bound."},
    {term:"Source boundary",value:"The six-leaf example and capacity argument follow the MIT notes. Their aside about binary insertion sort and their repeated-whole-array MSD example are outside this extension; recursive MSD remains as implemented in Lecture 09."}
  ]
};

export const hybridModule={
  id:"hybrid-mergesort",shortTitle:"Hybrid mergesort",title:"Combining Mergesort and Insertion Sort",
  summary:"Recursively divide large ranges, sort small leaves by insertion, then merge their retained results.",
  complexity:"Fixed-cutoff worst-case Θ(n log n), n≥2",source:{slides:extension,url:"https://algs4.cs.princeton.edu/22mergesort/"},
  objective:"Trace the boundary between two familiar algorithms and compare their actual key-comparison counts under the same input and operation definition.",
  input:{label:"Array A | insertion cutoff k",hint:"Use 1–10 integer keys (−99 to 99), then | and k from 1 to 10. k=1 gives standard mergesort.",default:"4,1,3,2,5 | 3",presets:[
    {label:"Same input · cutoff 3",value:"4,1,3,2,5 | 3"},
    {label:"Same input · cutoff 1",value:"4,1,3,2,5 | 1"},
    {label:"Same input · cutoff 5",value:"4,1,3,2,5 | 5"},
    {label:"Reverse order · cutoff 6",value:"6,5,4,3,2,1 | 6"}
  ],parse:parseHybrid},
  pseudocode:[
    {line:1,text:"Hybrid(A, lo, hi, k): // hi excluded"},
    {line:2,text:"if hi − lo ≤ 1: return",indent:1},
    {line:3,text:"if hi − lo ≤ k: use insertion",indent:1},
    {line:4,text:"for i in lo+1..hi−1: hold key; j←i−1",indent:2},
    {line:5,text:"while j≥lo and A[j]>key",indent:2,basic:true,basicLabel:"key comparison"},
    {line:6,text:"shift A[j] right; j ← j−1",indent:3},
    {line:7,text:"place key; return after insertion",indent:2},
    {line:8,text:"else: split; Hybrid both halves",indent:1},
    {line:9,text:"while both remain: compare heads",indent:1,basic:true,basicLabel:"key comparison"},
    {line:10,text:"emit smaller head; ties go left",indent:2},
    {line:11,text:"append tail; copy output back",indent:1},
    {line:12,text:"return"}
  ],buildTrace:buildHybridMerge,render:renderMerge,describe:describeMergeProcess,
  metrics:step=>[{label:"Key comparisons",value:step.comparisons,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?"\\begin{gathered}b=\\min(k,n)\\\\T_{\\mathrm{worst}}(n,k)\\in\\Theta\\!\\left(n\\log\\frac{n}{b}+nb\\right)\\end{gathered}":"\\begin{gathered}n\\le k:\\quad T=T_{\\mathrm{ins}}(n)\\\\n>k:\\quad T=T_L+T_R+\\Theta(n)\\end{gathered}",notes:["T_L and T_R are the floor/ceiling-half subproblem costs. n≤1 is a constant-time base case. For fixed k and n≥2 the worst-case total time is Θ(n log n). Larger cutoffs reduce recursive levels but can increase insertion work. Key-comparison counts alone do not establish a timing improvement or an optimal cutoff."]};},
  analysis:[
    {term:"The combination",value:"Mergesort controls the large recursive structure; insertion sort handles leaves with at most k keys. This extension uses a mergesort hybrid because Quicksort has already been introduced."},
    {term:"One common counter",value:"Count each evaluated insertion A[j]>key test and each evaluated merge-head comparison. Exclude index guards, moves, allocations, and recursion checks. A head comparison and its following emission are separate events."},
    {term:"Baseline",value:"At completion, compare with standard stable mergesort (cutoff 1) on exactly the same input. The separately computed baseline and retained trace history are excluded from the hybrid algorithm’s work."},
    {term:"Correctness",value:"Insertion returns stable sorted leaves. Each parent merges stable sorted children, taking left on equality. Induction gives a stable sorted whole array."},
    {term:"Cost assumptions",value:"Unit-cost comparisons, moves, and index arithmetic; linear merge buffering. For b=min(k,n), worst-case leaf work is Θ(nb), and merge levels add Θ(n log(n/b)). A fixed cutoff preserves Θ(n log n) growth for n≥2; k≥n gives insertion alone."},
    {term:"Practical interpretation",value:"The best elapsed-time cutoff is implementation- and machine-dependent. The illustration offers deterministic comparison counts, with no benchmark or universal speedup claim. Extra buffering is O(n) in the general hybrid; a whole-array insertion leaf needs only its held key, excluding visualization storage."}
  ]
};

export const selectionModule={
  id:"choosing-algorithms",shortTitle:"Choose and justify",title:"Choosing an Algorithm from Its Assumptions",
  summary:"Inspect a task, its data, and its required properties before revealing a justified candidate.",
  complexity:"Depends on n, disorder, key range, and the required operations",source:{slides:extension},
  objective:"Produce a candidate and justify its correctness and cost using explicit input parameters and constraints.",
  input:{label:"Case | integer keys",hint:"Cases: disorder, range, stable, updates. Use 1–10 keys (−99 to 99); range uses keys 1–16.",default:"disorder | 3,1,2,5,4",presets:[
    {label:"Disorder · three inversions",value:"disorder | 3,1,2,5,4"},
    {label:"Small range · stable integer records",value:"range | 2,1,3,2,4,1"},
    {label:"Stable records · equal keys",value:"stable | 4,2,4,1,2"},
    {label:"Updates between searches",value:"updates | 4,2,6,1,3,5,7"}
  ],parse:parseSelection},
  codeTitle:"Selection reasoning",
  pseudocode:[
    {line:1,text:"Write a candidate and an assumption."},
    {line:2,text:"Check task, data, required property.",basic:true,basicLabel:"criterion checked"},
    {line:3,text:"Choose a candidate meeting them."},
    {line:4,text:"Explain why its structure helps."},
    {line:5,text:"Name the operation; justify the cost."}
  ],buildTrace:buildSelection,render:renderSelection,describe:describeSelection,
  metrics:step=>[{label:"Criteria checked",value:step.checked,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}${step.example.latex.replace(",\\qquad", "\\\\")}\\end{gathered}`:step.checked>=2?step.kind==="disorder"?`n=${step.n},\\quad I=${step.inversions}`:step.kind==="range"?`n=${step.n},\\quad M=${step.range}`:`n=${step.n}`:"\\text{Task}\\;\\to\\;\\text{Data}\\;\\to\\;\\text{Needs}",notes:[step.phase==="complete"?step.example.assumption:"Write a short justification before revealing the worked candidate. Criteria checked is reasoning progress, not runtime. Other candidates are valid when their assumptions and costs are justified."]};},
  analysis:[
    {term:"Constructed response",value:"Before stepping, write a candidate, the counted operation, one correctness property, and a cost model. Use your own plain text or paper; no screenshot, account, or AI tool is needed. This is learning practice, not a graded assessment."},
    {term:"Guided completion",value:"Each Next step reveals one criterion. Use it to revise your justification, then compare with the worked candidate. A candidate is an example, not a unique answer or a timing contest."},
    {term:"Disorder",value:"Count actual inversions in the supplied input; a custom input can have many. Insertion’s Θ(n+I) makes disorder explicit. A general comparison sort remains a valid alternative."},
    {term:"Range and stability",value:"Range uses positive integer keys and permits stable output buffering. For general comparison records, stable mergesort needs a left-first equality rule. Preserve records, not only a reconstructed list of key values."},
    {term:"Changing tasks",value:"For a changing ordered collection, AVL is a representation choice. n means the current number of distinct keys; duplicate occurrences can be stored as counts. The model concerns each search/insertion, not sorting one fixed array."},
    {term:"Near transfer",value:"For [1,2,4,3,5], count the inversions, predict insertion shifts, and write a cost justification before opening its trace. Self-check: one inversion, one shift, and Θ(n+I) total time."},
    {term:"Independent problem",value:"A batch has no useful initial order, potentially huge integer keys, and equal-key records whose arrival order must be preserved; an output buffer is allowed. Propose an algorithm, operation count model, and correctness argument. Then explain what changes if insertions arrive between searches."},
    {term:"Independent self-check",value:"Stable mergesort is a valid batch choice: left-first ties, Θ(n log n) time and O(n) buffering; large key range M may make counting unattractive. Radix is another valid answer when digit width and base are included. A changing collection motivates the AVL representation and its per-operation bound. Alternatives earn the same reasoning credit when their assumptions are justified; this is ungraded self-checking."}
  ]
};
