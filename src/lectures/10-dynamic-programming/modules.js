import {parseFib,parseCoins,parseDpKnapsack} from "./shared.js?v=20261114-1";
import {buildFibonacciRecursive,buildFibonacciBottomUp,describeFibonacciRecursive,describeFibonacciBottomUp} from "./fibonacci-traces.js?v=20261114-1";
import {buildCoinRow,describeCoinRow} from "./coin-trace.js?v=20261114-1";
import {buildKnapsackBottomUp,buildKnapsackMemory,describeKnapsack} from "./knapsack-traces.js?v=20261114-1";
import {renderFibonacciRecursive,renderFibonacciBottomUp,renderCoinRow,renderKnapsack} from "./views.js?v=20261114-1";

const fibPresets=[{label:"n = 5",value:"5"},{label:"n = 4",value:"4"},{label:"Base n = 1",value:"1"},{label:"Base n = 0",value:"0"}];
const fibAnalysis=[
  {term:"Source convention",value:"F(0)=0, F(1)=1, F(n)=F(n−1)+F(n−2). The numeric n=5 and n=4 examples instantiate the deck's symbolic recurrence."},
  {term:"Input and arithmetic",value:"n is the target index, not the output value. Arithmetic and indexing use unit cost; the model does not charge for the increasing bit length of large Fibonacci numbers."}
];
export const fibonacciRecursiveModule={
  id:"fibonacci-recursive",shortTitle:"Fibonacci · recursion",title:"Fibonacci — Repeated Subproblems",
  summary:"Follow separate recursive calls for the same Fibonacci index and retain their returned operands.",
  complexity:"Θ(φⁿ) time; Θ(n+1) stack",source:{slides:"5–7; executable outline reconstructed from the recurrence"},
  objective:"Identify overlapping subproblems and connect repeated recursive additions to the reason for recording answers.",
  input:{label:"Fibonacci index n",hint:"Enter a nonnegative integer from 0 to 7. Each box represents a separate call.",default:"5",presets:fibPresets,parse:raw=>parseFib(raw,7)},
  pseudocode:[
    {line:1,text:"Fib(n)"}, {line:2,text:"if n ≤ 1: return n",indent:1},
    {line:3,text:"a ← Fib(n − 1)",indent:1}, {line:4,text:"b ← Fib(n − 2)",indent:1},
    {line:5,text:"return a + b",indent:1,basic:true,basicLabel:"one addition"}
  ],buildTrace:buildFibonacciRecursive,render:renderFibonacciRecursive,describe:describeFibonacciRecursive,
  metrics:step=>[{label:"Additions",value:step.additions,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}A(n)=F(n+1)-1=${step.additions}\\\\T(n)\\in\\Theta(\\varphi^n)\\end{gathered}`:"\\begin{gathered}A(n)=A(n-1)+A(n-2)+1\\\\A(0)=A(1)=0\\end{gathered}",notes:["A counts additions, not calls. φ=(1+√5)/2. Both recursive subproblems are solved each time; stack depth is Θ(n+1). Call boxes, positions, and retained snapshots are visualization metadata."]};},
  analysis:[...fibAnalysis,
    {term:"Counted operation",value:"One addition when both recursive operands have returned. Calls and base checks are not counted as additions, though they contribute to total time."},
    {term:"Overlap",value:"Each box is a fresh invocation. Repeated F(k) labels have the same mathematical answer but are recomputed. During tracing the double outline identifies the same k as the focused call; at completion it marks all repeated indices."},
    {term:"Retained results",value:"The left answer a remains in the caller while the right answer b is computed. Once both return, the caller adds and returns its result."},
    {term:"Case distinctions",value:"n=0 and n=1 return immediately with zero additions. For n≥2, A(n)=A(n−1)+A(n−2)+1, giving F(n+1)−1 additions. The source motivates overlap rather than printing this solved count; the model derives it explicitly."}
  ]
};
export const fibonacciBottomUpModule={
  id:"fibonacci-bottom-up",shortTitle:"Fibonacci · bottom-up",title:"Fibonacci — Bottom-Up Recording",
  summary:"Read two saved answers, add once, and retain the new value for later subproblems.",
  complexity:"Θ(n+1) time and table space",source:{slides:"7–9"},
  objective:"Trace the lecture's Fib(n) table and compare computing each recurrence once with repeated recursion.",
  input:{label:"Fibonacci index n",hint:"Enter a nonnegative integer from 0 to 16. The table retains all recorded values.",default:"5",presets:fibPresets,parse:raw=>parseFib(raw,16)},
  pseudocode:[{line:1,text:"F[0] ← 0"},{line:2,text:"F[1] ← 1"},{line:3,text:"for i ← 2 to n do"},
    {line:4,text:"F[i] ← F[i−1] + F[i−2]",indent:1,basic:true,basicLabel:"one addition"},{line:5,text:"return F[n]"}],
  buildTrace:buildFibonacciBottomUp,render:renderFibonacciBottomUp,describe:describeFibonacciBottomUp,
  metrics:step=>[{label:"Additions",value:step.additions,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}A(n)=\\max(0,n-1)=${step.additions}\\\\T(n),S(n)\\in\\Theta(n+1)\\end{gathered}`:"F[i]\\leftarrow F[i-1]+F[i-2]",notes:["Each i from 2 through n needs one addition. Initialization and loop checks still take time. The full F table is retained, as in the lecture; both base slots are initialized even for n=0."]};},
  analysis:[...fibAnalysis,
    {term:"Order and correctness",value:"Before computing F[i], F[i−1] and F[i−2] have already been recorded. Induction on i proves each new entry matches the Fibonacci recurrence."},
    {term:"Count",value:"The loop executes max(0,n−1) recurrence additions. Source base cases n=0 and n=1 require none; overall time and full-table space are Θ(n+1), including these constant-size cases."},
    {term:"Source terminology",value:"Slide 8 calls bottom-up recording memoization. This module follows its stated bottom-up iteration and slide 9's exact pseudocode. The later knapsack memory-function module demonstrates demand-driven recursion with caching."},
    {term:"Comparison",value:"With n=5, recursive evaluation uses seven additions while bottom-up uses four. Both return five, but only the table method reuses each recorded subproblem."}
  ]
};
export const coinRowModule={
  id:"coin-row",shortTitle:"Coin-row problem",title:"Coin-Row Problem",
  summary:"Compare taking the last coin with skipping it, then recover an optimal nonadjacent selection.",
  complexity:"Θ(n) time and table space",source:{slides:"10–20, 68–69; executable outline reconstructed"},
  objective:"Explain both recurrence candidates, the two-position jump after taking a coin, and extraction of an actual optimal set.",
  input:{label:"Coin values c₁, …, cₙ",hint:"Use 1–10 positive integer values from 1 to 99. Adjacent original positions cannot both be chosen.",default:"5,1,2,10,6,2",presets:[
    {label:"Lecture worked row",value:"5,1,2,10,6,2"},{label:"Lecture exercise",value:"7,2,1,12,5"},
    {label:"Single coin",value:"5"},{label:"Equal values · ties",value:"2,2,2"}
  ],parse:parseCoins},
  pseudocode:[
    {line:1,text:"F[0] ← 0"},{line:2,text:"F[1] ← c₁"},{line:3,text:"for i ← 2 to n"},
    {line:4,text:"take ← cᵢ+F[i−2]; skip ← F[i−1]",indent:1},
    {line:5,text:"F[i] ← max(take, skip)",indent:1,basic:true,basicLabel:"one max comparison"},
    {line:6,text:"k ← n; chosen ← ∅"},{line:7,text:"while k > 0"},
    {line:8,text:"if k=1 or F[k]>F[k−1]: take k; k←max(0,k−2)",indent:1},
    {line:9,text:"else: skip k; k ← k−1",indent:1},{line:10,text:"return F[n], chosen"}
  ],buildTrace:buildCoinRow,render:renderCoinRow,describe:describeCoinRow,
  metrics:step=>[{label:"Max comparisons",value:step.comparisons,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}C(n)=\\sum_{i=2}^{n}1=n-1=${step.comparisons}\\\\T(n),S(n)\\in\\Theta(n)\\quad(n\\ge1)\\end{gathered}`:"\\begin{gathered}\\mathrm{take}=c_i+F(i-2)\\\\\\mathrm{skip}=F(i-1)\\\\F(i)=\\max(\\mathrm{take},\\mathrm{skip})\\end{gathered}",notes:["F(0)=0 and F(1)=c₁. The counter includes forward max comparisons only. Table initialization, additions, and traceback are excluded from that counter but included in total time. Ties choose skip."]};},
  analysis:[
    {term:"State",value:"F(i) is the largest amount obtainable from the first i coins. Indices are 1..n and F(0)=0. Coin values must be positive, as in the source."},
    {term:"Why two cases",value:"Every legal solution either skips coin i, leaving optimum F(i−1), or takes it, excluding i−1 and adding cᵢ to F(i−2). The larger candidate covers all legal solutions."},
    {term:"Count and space",value:"There is one max comparison for each i=2..n: n−1 in total. Initializing the table and recovering the set each take linear time; retaining the full F table uses Θ(n) space."},
    {term:"Recovery",value:"If F[k]>F[k−1], take k and jump back two positions. Otherwise skip k and move back one. Ties skip; the recovered optimum may not be unique."},
    {term:"Worked and boundary inputs",value:"The lecture row yields table 0,5,5,7,15,15,17 and recovery positions 6,4,1, whose values are the source's 2,10,5. Its exercise yields 19. Single/equal-coin cases reuse source values to expose the base and tie conventions."}
  ]
};

const knapsackPresets=[
  {label:"Lecture table · W=5",value:"5 | 2:12,1:10,3:20,2:15"},
  {label:"Lecture exercise · W=6",value:"6 | 3:13,1:12,1:10,2:17,2:15"},
  {label:"Earlier lecture example · W=16",value:"16 | 2:20,5:30,10:50,5:10"},
  {label:"Zero-capacity base",value:"0 | 2:12,1:10,3:20,2:15"}
];
const knapsackInput={label:"Capacity W | weight:value pairs",hint:"Capacity 0–20; 1–6 items; weights 1–99 and values 0–99. Each item can be chosen once.",default:knapsackPresets[0].value,presets:knapsackPresets,parse:parseDpKnapsack};
const knapsackAnalysis=[
  {term:"State and bases",value:"F(i,j) is the maximum value from items 1..i at capacity j. F(0,j)=F(i,0)=0 because weights are positive. Item and capacity indices match the source table."},
  {term:"0/1 dependency",value:"Skipping reads F(i−1,j); taking adds vᵢ to F(i−1,j−wᵢ), only if wᵢ≤j. Both use row i−1, so taking cannot reuse item i."},
  {term:"Counted update",value:"One DP update saves a freshly evaluated nonbase F(i,j), i>0,j>0. It counts even when an overweight item forces copying the skip value. Base cases, cache hits, and recovery are excluded."},
  {term:"Recovery and ties",value:"If F(i,j)=F(i−1,j), skip item i. Otherwise take it and move to (i−1,j−wᵢ). Ties skip; decreasing i guarantees each item is selected at most once."},
  {term:"Source solutions",value:"The default table returns 37 with items 4,2,1 in recovery order. The capacity-6 exercise returns 54 with items 2,3,4,5; the earlier capacity-16 input returns 80 with items 2,3."},
  {term:"Input-size qualification",value:"n is the item count and W the numeric integer capacity. The nW bound is pseudopolynomial in the binary-encoded input size. Unit-cost arithmetic and indexing/cache lookup are assumed; bit complexity and retained visualization history are outside this model."}
];
const recurrenceNotes="For a fitting item, compare skip S=F(i−1,j) and take T=vᵢ+F(i−1,j−wᵢ). For an overweight item, only skip is legal. Uncomputed cells remain dots.";
const recurrenceModel="\\begin{gathered}S=F(i-1,j)\\\\T=v_i+F(i-1,j-w_i)\\\\F(i,j)=\\max(S,T)\\quad(w_i\\le j)\\end{gathered}";
export const knapsackBottomUpModule={
  id:"knapsack-bottom-up",shortTitle:"Knapsack · bottom-up",title:"0/1 Knapsack — Bottom-Up Table",
  summary:"Fill the lecture's table using previous-row take/skip dependencies and recover a maximum-value subset.",
  complexity:"Θ(nW) time and table space for n,W≥1",source:{slides:"21–67, 68–69; executable outline reconstructed"},
  objective:"Trace the exact source table, explain why both dependencies use the previous row, and generalize the nonbase update count to nW.",
  input:knapsackInput,
  pseudocode:[
    {line:1,text:"for j ← 0..W: F[0,j] ← 0"},{line:2,text:"for i ← 1..n"},
    {line:3,text:"F[i,0] ← 0",indent:1},{line:4,text:"for j ← 1..W",indent:1},
    {line:5,text:"if wᵢ>j: F[i,j] ← F[i−1,j]",indent:2,basic:true,basicLabel:"one DP update"},
    {line:6,text:"else: F[i,j] ← max(F[i−1,j], vᵢ+F[i−1,j−wᵢ])",indent:2,basic:true,basicLabel:"one DP update"},
    {line:7,text:"i ← n; j ← W; chosen ← ∅"},{line:8,text:"while i>0 and j>0"},
    {line:9,text:"if F[i,j]=F[i−1,j]: i ← i−1",indent:1},
    {line:10,text:"else: take i; (i,j) ← (i−1,j−wᵢ)",indent:1},
    {line:11,text:"return F[n,W], chosen"}
  ],buildTrace:buildKnapsackBottomUp,render:renderKnapsack,describe:describeKnapsack,
  metrics:step=>[{label:"DP updates",value:step.updates,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}U=\\sum_{i=1}^{n}\\sum_{j=1}^{W}1=nW=${step.updates}\\\\T,S\\in\\Theta((n+1)(W+1))\\end{gathered}`:recurrenceModel,
    notes:[step.phase==="complete"?"For n,W≥1 this is the lecture's Θ(nW) time and space. The zero-capacity case has no nonbase updates but still initializes its boundary. Recovery takes O(n) extra time.":recurrenceNotes]};},
  analysis:[...knapsackAnalysis,
    {term:"Order and invariant",value:"The source initializes row zero, then the zero-capacity entry and remaining entries of each row. Before row i is evaluated, all entries of row i−1 are available."},
    {term:"Time and space",value:"Exactly nW nonbase updates, plus n+W+1 boundary assignments. Total table work and storage are Θ((n+1)(W+1)); for positive n and W, this matches the source's Θ(nW). No rolling-array optimization is introduced because recovery uses the retained table."},
    {term:"Prepared layout",value:"The capacity-5 table and capacity-6 exercise fit a compact grid. The source's capacity-16 example uses genuine horizontal table scrolling; active entries remain reachable with the shared controls and complete text state."}
  ]
};
export const knapsackMemoryModule={
  id:"knapsack-memory",shortTitle:"Knapsack · memory function",title:"0/1 Knapsack — Memory Function",
  summary:"Request only needed subproblems, cache each answer once, and reuse known values on later calls.",
  complexity:"O(nW) states in the worst case; demand-driven evaluations",source:{slides:"67–69; executable memory function reconstructed from the source recurrence"},
  objective:"Distinguish a new state computation from a cache hit and compare the demanded states with the full bottom-up table.",
  input:knapsackInput,
  pseudocode:[
    {line:1,text:"Memory(i,j)"},{line:2,text:"if F[i,j] known: return F[i,j]",indent:1},
    {line:3,text:"if i=0 or j=0: save 0; return 0",indent:1},
    {line:4,text:"skip ← Memory(i−1,j)",indent:1},{line:5,text:"if wᵢ ≤ j",indent:1},
    {line:6,text:"take ← vᵢ + Memory(i−1,j−wᵢ)",indent:2},
    {line:7,text:"F[i,j] ← max(skip,take)",indent:2,basic:true,basicLabel:"one DP update"},
    {line:8,text:"else: F[i,j] ← skip",indent:1,basic:true,basicLabel:"one DP update"},
    {line:9,text:"return F[i,j]",indent:1},{line:10,text:"Start Memory(n,W), then recover below"},
    {line:11,text:"i←n; j←W; chosen←∅; while i>0 and j>0"},
    {line:12,text:"if F[i,j]=F[i−1,j]: i←i−1",indent:1},
    {line:13,text:"else: take i; (i,j)←(i−1,j−wᵢ)",indent:1},
    {line:14,text:"return F[n,W], chosen"}
  ],buildTrace:buildKnapsackMemory,render:renderKnapsack,describe:describeKnapsack,
  metrics:step=>[{label:"DP updates",value:step.updates,emphasis:true}],
  model(step){const bases=Object.keys(step.F).filter(key=>key.split(",").some(index=>Number(index)===0)).length;
    return {latex:step.phase==="complete"?`\\begin{gathered}Q=${step.updates}\\le nW=${step.n*step.capacity},\\quad B=${bases}\\\\T\\in O(Q+B)\\end{gathered}`:recurrenceModel,
      notes:[step.phase==="complete"?"Q is newly computed nonbase states; B is distinct requested bases. Each is saved once. Unit-cost cache lookup gives O(Q+B) work and cache storage, plus O(n) stack depth. Worst case: O(nW) for n,W≥1. Unrequested dotted cells are not computed by recovery.":`${recurrenceNotes} Cache hits return immediately; the sparse cache is initially empty.`]};},
  analysis:[...knapsackAnalysis,
    {term:"Demand-driven order",value:"Start at F(n,W), request skip first, then request take only when it fits. Cache requested bases as zero. A known state returns immediately, including a known zero."},
    {term:"Source comparison",value:"The default bottom-up table evaluates 20 nonbase states. The same memory function evaluates 11 and encounters four cache hits; both return 37 and recover 4,2,1."},
    {term:"Time and storage",value:"Q nonbase states and B requested bases are saved once. The sparse algorithm cache uses O(Q+B) entries and the recursion has O(n) depth. For n,W≥1, total requested states are O(nW) in the worst case. The full dotted grid and retained call records belong to the visualization, not the algorithm's cache."},
    {term:"Recovery availability",value:"Every evaluated nonbase state requested its skip predecessor and, if fitting, its take predecessor. Therefore the needed recovery comparisons are already cached; recovery does not fill the unrequested table cells."}
  ]
};
