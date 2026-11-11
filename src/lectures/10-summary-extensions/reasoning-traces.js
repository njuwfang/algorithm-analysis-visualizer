import {parseKeys, records, indexed, inversionPairs, snapshot} from "./shared.js?v=20261110-1";

export const strategies = [
  {id:"decrease", title:"One smaller instance", examples:"Binary search · insertion · Quickselect"},
  {id:"divide", title:"Several subproblems", examples:"Mergesort · integer products · Strassen"},
  {id:"transform", title:"Change the form", examples:"Presort · Horner · AVL"},
  {id:"keys", title:"Use values or digits", examples:"Counting · LSD/MSD radix"}
];
export const connectionCases = {
  "binary-search": {title:"Binary search", family:"decrease", relation:"Retain only the half that can contain the target.", operation:"One middle-key probe per retained range; a worst-case probe model.", work:"One branch remains; local work is constant.", latex:"P(n)=P(\\lfloor n/2\\rfloor)+1,\\quad P(0)=0", growth:"P(n)\\in\\Theta(\\log n)", unit:"keys"},
  "mergesort": {title:"Mergesort", family:"divide", relation:"Retain both halves; merge their sorted results.", operation:"Key comparisons while merging; copying also contributes to total time.", work:"Both branches remain; combining takes linear work.", latex:"T(n)=T(\\lfloor n/2\\rfloor)+T(\\lceil n/2\\rceil)+\\Theta(n)", growth:"T(n)\\in\\Theta(n\\log n)", unit:"keys"},
  "horner": {title:"Horner’s rule", family:"transform", relation:"Rewrite explicit powers as a nested multiply-and-add chain.", operation:"One multiplication and one addition per coefficient update.", work:"Reuse the partial polynomial instead of recomputing powers.", latex:"M(n)=A(n)=\\sum_{i=0}^{n-1}1=n", growth:"T(n)\\in\\Theta(n)", unit:"degree"},
  "counting-sort": {title:"Counting sort", family:"keys", relation:"Turn key frequencies into starting positions for stable placement.", operation:"Array writes in the Lecture 09 procedure, including Count and Pos.", work:"Scan n records and M possible key values; keep both parameters.", latex:"W(n,M)=3n+3M", growth:"T(n,M)\\in\\Theta(n+M)", unit:"keys"},
  "american-flag": {title:"American Flag Sort", family:"keys", secondary:"divide", relation:"Counts reserve digit ranges; cycles fill them; recursion refines each range.", operation:"Pairwise swaps are the displayed count; counting and probing still take time.", work:"Several digit groups recur; partitioning uses frequencies and boundaries.", latex:"\\begin{aligned}T(n,d)&=\\sum_b T(n_b,d-1)\\\\&\\quad+\\Theta(n+10)\\end{aligned}", growth:"T_{\\mathrm{worst}}(n,d)\\in\\Theta(nd)", unit:"keys"}
};

export function parseConnection(raw) {
  const parts = String(raw).split("|").map(part=>part.trim()), [method, size, extra] = parts;
  if (!connectionCases[method]) throw new Error("Use binary-search, mergesort, horner, counting-sort, or american-flag before |.");
  const n = Number(size);
  if (!size || !Number.isInteger(n) || n < 2 || n > 64) throw new Error("Use a size n from 2 to 64 after |; for Horner, n is the degree.");
  const needsExtra = ["counting-sort","american-flag"].includes(method);
  if (parts.length !== (needsExtra ? 3 : 2)) throw new Error(needsExtra ? "Add a third field: M for counting-sort, or d for american-flag." : "Use exactly method | n.");
  const parameter = needsExtra ? Number(extra) : null;
  if (needsExtra && (!extra || !Number.isInteger(parameter) || parameter < 1 || parameter > (method === "counting-sort" ? 64 : 5))) throw new Error(method === "counting-sort" ? "M must be an integer from 1 to 64." : "d must be an integer from 1 to 5.");
  return {method, n, parameter};
}

export function buildConnections(input) {
  const example = connectionCases[input.method], trace = [];
  const events = [
    ["ready",null,"Identify what is retained, represented, or exploited before choosing a cost model."],
    ["structure",1,`${example.title}: ${example.relation}`],
    ["operation",2,example.operation],
    ["model",3,example.work],
    ["complete",4,"Generalize the work using the stated parameters and operation model. Strategies may overlap."]
  ];
  events.forEach(([phase,activeLine,message],stage)=>trace.push({phase,activeLine,...(phase === "ready" ? {activeLabel:"Ready"} : {}),message,...input,stage,checks:stage,example:{...example}}));
  return trace;
}

export const selectionCases = {
  disorder:{title:"Few inversions", task:"Sort a batch of keys", promise:"Inspect the inversion count I; the case name does not promise every custom input is nearly sorted.", candidate:"Insertion sort", property:"Keep equal records in their original order by shifting only strictly larger keys.", operation:"Count shifts: each removes one inversion.", reason:"Insertion is adaptive: its work depends on both n and I. Compare this with a general comparison sort when I is large.", latex:"S=I,\\qquad T(n,I)\\in\\Theta(n+I)", assumption:"Unit-cost key comparisons and moves; this is the shift-based insertion variant."},
  range:{title:"Small integer range", task:"Sort a batch of bounded integer keys", promise:"Keys lie in 1..M; an auxiliary array is permitted.", candidate:"Stable counting sort", property:"Preserve payload records and arrival order among equal keys.", operation:"Count array writes in Count, Pos, and stable output placement.", reason:"Use the small key range directly. Include the M table work; linear-in-n time needs M=O(n).", latex:"W=3n+3M,\\qquad T(n,M)\\in\\Theta(n+M)", assumption:"Unit-cost indexing by a key and space for Count, Pos, and output; this is not a comparison-only algorithm."},
  stable:{title:"Stable records", task:"Sort records with equal keys and associated payloads", promise:"Comparison keys; stable order and an auxiliary output buffer are required/available.", candidate:"Stable mergesort", property:"Take the left item on equality to preserve arrival order.", operation:"Count comparisons between the two merge heads.", reason:"A stable merge combines stable halves; the standard algorithm gives a worst-case bound independent of the initial order.", latex:"T(n)=2T(n/2)+\\Theta(n)\\in\\Theta(n\\log n)", assumption:"The displayed recurrence uses equal halves for powers of two; arbitrary sizes use floor/ceiling halves. Unit-cost comparisons and moves."},
  updates:{title:"Repeated updates", task:"Maintain an ordered collection through insertions and searches", promise:"New records arrive between searches; a one-time sorted array would need maintenance.", candidate:"AVL tree", property:"Maintain the BST order and the AVL height-balance invariant after each insertion.", operation:"Compare keys along one search path; rotations maintain balance.", reason:"Changing the representation to a balanced search tree keeps each path logarithmic. Equal keys may be stored as a count at their node.", latex:"h\\in\\Theta(\\log(n+1)),\\qquad T_{\\mathrm{op}}\\in O(\\log(n+1))", assumption:"n is the current number of distinct keys; the bound is worst-case per search/insertion, with unit-cost comparisons and rotations."}
};
export function parseSelection(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2 || !selectionCases[parts[0].trim()]) throw new Error("Use disorder, range, stable, or updates | integer keys.");
  const kind = parts[0].trim(), values = parseKeys(parts[1]);
  if (kind === "range" && values.some(value=>value < 1 || value > 16)) throw new Error("The range case uses positive keys from 1 to 16.");
  return {kind, values};
}
export function buildSelection({kind, values}) {
  const example = selectionCases[kind], original = records(values);
  const inversions = inversionPairs(original).length, range = Math.max(...values), distinct = new Set(values).size;
  const n = kind === "updates" ? distinct : values.length;
  const trace = [], checks = [example.task, example.promise, example.property];
  const add = (phase,activeLine,message,checked)=>trace.push(snapshot({phase,activeLine,...(phase === "ready" ? {activeLabel:"Ready"} : {}),message,kind,original,n,inversions,range,distinct,example,checked}));
  add("ready",null,"Before stepping, write a candidate algorithm and one assumption that makes your choice valid.",0);
  checks.forEach((text,index)=>add("check",2,text,index+1));
  add("candidate",3,`One suitable candidate is ${example.candidate}. Other algorithms may also satisfy the requirements.`,3);
  add("justify",4,example.reason,3);
  add("complete",5,`Justify ${example.candidate} with its input parameters, counted operation, correctness property, and cost assumptions.`,3);
  return trace;
}
export function describeConnections(step) {
  return {summary:step.message,state:[
    {label:"Worked example",value:step.example.title}, {label:"Size parameter",value:`n=${step.n} (${step.example.unit}); ${step.parameter === null ? "no extra parameter" : `${step.method === "counting-sort" ? "M" : "d"}=${step.parameter}`}`},
    {label:"Structural connection",value:step.stage>=1?step.example.relation:"not examined"},
    {label:"Strategy families",value:step.stage>=1?[step.example.family,step.example.secondary].filter(Boolean).join(" + "):"not examined"},
    {label:"Counted quantity",value:step.stage>=2?step.example.operation:"not examined"},
    {label:"Local and recursive work",value:step.stage>=3?step.example.work:"not examined"},
    {label:"General model",value:step.stage>=4?`${step.example.latex}; ${step.example.growth}`:"not generalized"},
    {label:"Connections examined",value:String(step.checks)}
  ],details:["This is a reasoning walkthrough of familiar algorithms, not their execution trace. Connections examined counts its four reasoning moves, not runtime operations.",
    "The strategy map is not an exclusive classification: American Flag combines digit information with recursive subproblems; FFT also changes representation."]};
}
export function describeSelection(step) {
  return {summary:step.message,state:[
    {label:"Case",value:step.example.title}, {label:"Input records",value:indexed(step.original)},
    {label:"Task",value:step.checked>=1?step.example.task:"not examined"},
    {label:"Data assumptions",value:step.checked>=2?step.example.promise:"not examined"},
    {label:"Required property",value:step.checked>=3?step.example.property:"not examined"},
    {label:"Input parameters",value:step.checked>=2?`n=${step.n}; ${step.kind === "disorder" ? `I=${step.inversions}` : step.kind === "range" ? `M=${step.range}` : step.kind === "updates" ? `distinct keys=${step.distinct}` : "general comparison keys"}`:"not examined"},
    {label:"Candidate",value:["candidate","justify","complete"].includes(step.phase)?step.example.candidate:"not revealed"},
    {label:"Counted operation",value:step.phase==="complete"?step.example.operation:"not revealed"},
    {label:"Cost justification",value:["justify","complete"].includes(step.phase)?step.example.reason:"not revealed"},
    {label:"Model and assumptions",value:step.phase==="complete"?`${step.example.latex}; ${step.example.assumption}`:"not revealed"},
    {label:"Criteria checked",value:String(step.checked)}
  ],details:["Before revealing the candidate, write your own candidate and a concrete justification. No answer submission or AI tool is required.",
    "The revealed candidate is a valid worked example, not a uniquely best algorithm. Different choices are acceptable when their requirements and costs are justified.",
    "Criteria checked counts task, data assumptions, and required property; it is not an algorithm's running-time counter."]};
}
