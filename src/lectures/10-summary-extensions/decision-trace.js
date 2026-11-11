import {parseKeys, records, indexed, snapshot} from "./shared.js?v=20261110-1";

export const decisionNodes = [
  {id:"root", a:0, b:1, yes:"left", no:"right", column:1, span:6, row:1},
  {id:"left", a:1, b:2, yes:"012", no:"left-deep", column:1, span:3, row:2},
  {id:"left-deep", a:0, b:2, yes:"021", no:"201", column:2, span:2, row:3},
  {id:"right", a:0, b:2, yes:"102", no:"right-deep", column:4, span:3, row:2},
  {id:"right-deep", a:1, b:2, yes:"120", no:"210", column:5, span:2, row:3}
];
export const decisionLeaves = ["012", "021", "201", "102", "120", "210"];

export function parseDecisionInput(raw) {
  const values = parseKeys(raw);
  if (values.length !== 3 || new Set(values).size !== 3) throw new Error("Enter exactly three distinct integer keys from −99 to 99.");
  return values;
}

export function buildDecisionTrace(values) {
  const original = records(values), trace = [], answers = [];
  let candidates = [...decisionLeaves], nodeId = "root", current = null, comparisons = 0, result = null;
  const add = (phase, activeLine, message) => trace.push(snapshot({phase, activeLine, ...(phase === "ready" ? {activeLabel:"Ready"} : {}), message, original, candidates, nodeId, current, comparisons, answers, result}));
  add("ready", null, "Three distinct keys can occur in six relative orders. Each leaf names one ordering of the original indices.");
  while (!decisionLeaves.includes(nodeId)) {
    const node = decisionNodes.find(item=>item.id===nodeId), answer = values[node.a] < values[node.b];
    comparisons += 1; current = {...node, answer}; answers.push({id:node.id, a:node.a, b:node.b, answer});
    add("compare", 2, `Compare original A[${node.a}]=${values[node.a]} < A[${node.b}]=${values[node.b]}: ${answer}.`);
    candidates = candidates.filter(order => (order.indexOf(String(node.a)) < order.indexOf(String(node.b))) === answer);
    add("filter", 3, `Keep the ${candidates.length} relative order${candidates.length===1?"":"s"} consistent with this answer.`);
    nodeId = answer ? node.yes : node.no;
  }
  result = [...nodeId].map(Number); current = null;
  add("identified", 4, `Only order ${nodeId} remains: ${result.map(i=>values[i]).join(" < ")}. This path used ${comparisons} comparisons.`);
  add("capacity", 5, "A binary tree of height two has at most four leaves. Six possible orders require worst-case height at least three, even when this particular path is shorter.");
  add("complete", 6, "Generalize to n distinct keys: at least n! leaves require worst-case height h ≥ log₂(n!), giving Ω(n log n) comparisons.");
  return trace;
}

export function describeDecision(step) {
  return {summary:step.message, state:[
    {label:"Original keys", value:indexed(step.original)},
    {label:"Current question", value:step.current ? `A[${step.current.a}] < A[${step.current.b}] is ${step.current.answer}` : "none"},
    {label:"Comparison answers", value:step.answers.map(item=>`A[${item.a}] < A[${item.b}]: ${item.answer}`).join("; ") || "none"},
    {label:"Remaining orders", value:step.candidates.join(", ")},
    {label:"Decision node", value:step.nodeId},
    {label:"Identified order", value:step.result ? step.result.map(i=>`A[${i}]=${step.original[i].value}`).join(" < ") : "not identified"},
    {label:"Binary capacities", value:["capacity","complete"].includes(step.phase) ? "height 0: 1 leaf; height 1: 2 leaves; height 2: 4 leaves; height 3: 8 leaves" : "not evaluated"},
    {label:"Worst-case lower bound", value:["capacity","complete"].includes(step.phase) ? "ceil(log₂(3!)) = 3 comparisons; this bounds the worst path, not every path" : "not evaluated"},
    {label:"Model restriction", value:"Distinct keys; the algorithm learns their relative order only through binary key comparisons. Indexing by a key or reading digits is a different operation model."},
    {label:"Tree relationships", value:decisionNodes.map(node=>`${node.id}: A[${node.a}] < A[${node.b}]; true → ${node.yes}, false → ${node.no}`).join("; ")},
    {label:"Key comparisons", value:String(step.comparisons)}
  ], details:["A leaf such as 201 means original A[2] < A[0] < A[1]; the keys are never moved during this reasoning trace.",
    "The drawn tree is one correct comparison procedure. The leaf-capacity argument applies to every comparison procedure in the stated model.",
    "Counting and radix sorting can exploit key values or digits, so this comparison-only bound does not limit their total running times."]};
}
