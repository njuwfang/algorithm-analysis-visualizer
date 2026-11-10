import { parseRadixInput } from "./radix-trace.js?v=20261108-3";

export const parseMsdInput = parseRadixInput;

// Ordered frontier of the actual recursive buckets; no comparison sort is used.
export function msdFrontier(step) {
  const walk = id => {
    const node = step.nodes.find(entry => entry.id === id);
    if (node.result !== null) return node.result.map(item => ({ ...item, prefixLength: node.p, complete: true }));
    if (node.children.length) return node.children.flatMap(walk);
    return node.items.map(item => ({ ...item, prefixLength: node.p, complete: false }));
  };
  return walk("root");
}

export function buildMsdTrace(input) {
  const values = parseMsdInput(input.join(","));
  const original = values.map((value,index)=>({ value, origin:index+1 }));
  const d = String(Math.max(...values)).length;
  const makeNode = (id,parent,prefix,items,start) => ({ id,parent,prefix,p:prefix.length,items:[...items],start,
    bins:null,children:[],result:null,status:"pending" });
  const state = { original, d, nodes:[makeNode("root",null,"",original,0)], activeId:"root", stack:[],
    i:null,current:null,digit:null,nextId:null,inspections:0,internalCalls:0 };
  const trace = [];
  const emit = (phase,activeLine,message) => trace.push(structuredClone({ ...state,phase,activeLine,message,
    ...(phase === "ready" ? {activeLabel:"Ready"} : {}) }));
  emit("ready",null,"Start at the most significant digit. Recursively refine one prefix group; singleton groups need no more digit inspections.");
  function sort(id) {
    const node = state.nodes.find(entry=>entry.id===id);
    state.activeId=id; state.stack.push(id); state.i=null; state.current=null; state.digit=null; state.nextId=null;
    node.status="active";
    const range=`A[${node.start+1}..${node.start+node.items.length}]`,name=node.prefix || "empty";
    emit("enter",1,`Enter prefix ${name}, ${range}: ${node.items.length} keys; ${d-node.p} digits remain.`);
    if (node.items.length<=1 || node.p===d) {
      node.result=[...node.items]; node.status="complete";
      emit("base",2,node.items.length<=1 ? `Prefix ${name} contains one key; return it without inspecting another digit.` : `All ${d} digits are fixed by prefix ${name}; return equal keys in their arrival order.`);
      state.stack.pop(); return node.result;
    }
    node.bins=Array.from({length:10},()=>[]); state.internalCalls+=1;
    emit("initialize-bins",3,`Create bins 0..9 inside prefix ${name}. Only this group's next digit will be inspected.`);
    for (let i=0;i<node.items.length;i+=1) {
      const current=node.items[i]; state.i=i; state.current=current;
      state.digit=Math.floor(current.value/10**(d-node.p-1))%10; state.inspections+=1;
      emit("inspect",5,`Read digit ${node.p+1} from the left of ${String(current.value).padStart(d,"0")} (#${current.origin}): ${state.digit}.`);
      node.bins[state.digit].push(current);
      emit("enqueue",6,`Append ${current.value} (#${current.origin}) to bin ${state.digit} inside prefix ${name}.`);
    }
    state.i=null; state.current=null; state.digit=null;
    let offset=node.start;
    for (let digit=0;digit<10;digit+=1) {
      const bucket=node.bins[digit];
      if (bucket.length) {
        const childId=`${id}.${digit}`;
        state.nodes.push(makeNode(childId,id,`${node.prefix}${digit}`,bucket,offset));
        node.children.push(childId);
      }
      offset+=bucket.length;
    }
    node.status="partitioned";
    emit("partition",7,`Prefix ${name} splits into ${node.children.length} nonempty prefix groups. Their ranges are fixed in digit order.`);
    for (const childId of node.children) {
      const child=state.nodes.find(entry=>entry.id===childId);
      state.activeId=id; state.nextId=childId; node.status="waiting";
      emit("recurse",8,`Recurse only into prefix ${child.prefix}, A[${child.start+1}..${child.start+child.items.length}]. Other prefix groups stay in their ranges.`);
      const result=sort(childId);
      state.activeId=id; state.i=null; state.current=null; state.digit=Number(child.prefix.at(-1)); state.nextId=null;
      node.bins[state.digit]=result;
      emit("child-return",8,`Retain the sorted result for prefix ${child.prefix}; return to prefix ${name}.`);
    }
    state.digit=null;
    node.result=node.bins.flat(); node.status="complete";
    emit("return",9,`Return prefix ${name}: concatenate its sorted bins in digit order; no comparison merge is needed.`);
    state.stack.pop(); return node.result;
  }
  sort("root");
  state.activeId="root"; state.i=null; state.current=null; state.digit=null; state.nextId=null;
  emit("complete",null,`A is sorted. Singleton groups stopped early; ${state.inspections} digit inspections were performed.`);
  return trace;
}

export function describeMsd(step) {
  const node=step.nodes.find(entry=>entry.id===step.activeId);
  const items=list=>list.map(item=>`${item.value} (#${item.origin})`).join(", ") || "empty";
  const name=n=>n.prefix || "empty prefix";
  const frontier=msdFrontier(step);
  return { summary:step.message,state:[
    {label:"Input size n",value:String(step.original.length)},
    {label:"Digit width d",value:`${step.d}; all positive keys are left-padded with zeros`},
    {label:"Original input",value:items(step.original)},
    {label:"Current array A",value:frontier.map((item,i)=>`A[${i+1}]=${item.value} (#${item.origin}); ${item.complete?"sorted group":`${item.prefixLength} leading digits fixed`}`).join("; ")},
    {label:"Active prefix",value:name(node)},
    {label:"Active range",value:`A[${node.start+1}..${node.start+node.items.length}]; ${node.items.length} items`},
    {label:"Call input S",value:node.items.map((item,i)=>`S[${i+1}]=${item.value} (#${item.origin})`).join("; ")},
    {label:"Digit position",value:step.phase==="ready"?"not started":node.p===step.d?"all digits fixed":`p=${node.p} in zero-based pseudocode; digit ${node.p+1} from the left, place ${10**(step.d-node.p-1)}`},
    {label:"Input index i",value:step.i===null?"none":String(step.i+1)},
    {label:"Current inspected key",value:step.current===null?"none":`${step.current.value} (#${step.current.origin}), padded ${String(step.current.value).padStart(step.d,"0")}; current digit ${step.digit}`},
    {label:"Active bins",value:node.bins===null?"not created":node.bins.map((bin,b)=>`B[${b}]=${items(bin)}`).join("; ")},
    {label:"Recursion stack",value:step.stack.map(id=>name(step.nodes.find(entry=>entry.id===id))).join(" → ") || "empty"},
    {label:"Next recursive call",value:step.nextId===null?"none":name(step.nodes.find(entry=>entry.id===step.nextId))},
    {label:"Prefix tree",value:step.nodes.map(n=>`${n.id}: prefix ${name(n)}; parent ${n.parent||"none"}; range ${n.start+1}..${n.start+n.items.length}; ${n.status}; input ${items(n.items)}; children ${n.children.join(", ")||"none"}; result ${n.result===null?"not returned":items(n.result)}`).join("; ")},
    {label:"Retained results",value:step.nodes.filter(n=>n.result!==null).map(n=>`${name(n)} → ${items(n.result)}`).join("; ") || "none"},
    {label:"Correctness rule",value:"Every group shares its fixed leading prefix. Digit-ordered child ranges never cross. Sorting each child's remaining digits therefore sorts the whole parent group. One key, or no remaining digit, is a base case."},
    {label:"Digit marks",value:"Current digit is bold and separated; its fixed leading prefix is grouped separately. Completed groups have a check mark in the tree and verified full keys in A. Unprocessed trailing digits are unmarked."},
    {label:"Internal calls",value:String(step.internalCalls)},
    {label:"Count scope",value:"One read of a key's current digit at line 5 is one digit inspection. Appends, bin creation and visits, recursive bookkeeping, and concatenation are excluded from the counter; their linear work is included in the time recurrence."},
    {label:"Digit inspections",value:String(step.inspections)}
  ] };
}
