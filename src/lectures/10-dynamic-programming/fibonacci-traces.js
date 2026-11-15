import {copy,oneRow} from "./shared.js?v=20261114-1";

export function buildFibonacciBottomUp(n) {
  const F=Array(Math.max(2,n+1)).fill(null), trace=[];
  let i=null, additions=0, result=null;
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),n,F,i,additions,result}));
  add("ready",null,`Compute F(${n}) by recording each smaller Fibonacci value once.`);
  F[0]=0;add("base-zero",1,"Set F[0]=0.");
  F[1]=1;add("base-one",2,"Set F[1]=1, as in the lecture algorithm.");
  for(i=2;i<=n;i+=1) {
    F[i]=F[i-1]+F[i-2];additions+=1;
    add("add",4,`Reuse F[${i-1}]=${F[i-1]} and F[${i-2}]=${F[i-2]}; add once and save F[${i}]=${F[i]}.`);
  }
  i=null;result=F[n];add("complete",5,`Return F(${n})=${result} after ${additions} additions.`);
  return trace;
}

const leafCount = n => n<2?1:leafCount(n-1)+leafCount(n-2);
export function buildFibonacciRecursive(n) {
  const trace=[],nodes=[],stack=[];
  let activeId=null,additions=0,result=null;
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),n,nodes,stack,activeId,additions,result,leaves:leafCount(n)}));
  add("ready",null,"Expand the recurrence: repeated calls with the same F(k) recompute that subproblem.");
  function solve(k,parent,start,depth) {
    const node={id:nodes.length,parent,k,start,span:leafCount(k),depth,a:null,b:null,result:null,status:"active"};
    nodes.push(node);activeId=node.id;stack.push(node.id);
    add("call",1,`Call F(${k})${parent===null?"":`; this is a new call, even if F(${k}) appeared earlier`}.`);
    if(k<=1) {
      node.result=k;node.status="returned";
      add("base",2,`F(${k})=${k} is a base case; no addition.`);
    } else {
      node.a=solve(k-1,node.id,start,depth+1);activeId=node.id;
      add("left-return",3,`Retain a=F(${k-1})=${node.a}; compute F(${k-2}) next.`);
      node.b=solve(k-2,node.id,start+leafCount(k-1),depth+1);activeId=node.id;
      add("right-return",4,`Retain b=F(${k-2})=${node.b}; both operands are ready.`);
      node.result=node.a+node.b;node.status="returned";additions+=1;
      add("add",5,`Return ${node.a}+${node.b}=${node.result} from this F(${k}) call.`);
    }
    stack.pop();return node.result;
  }
  result=solve(n,null,0,0);activeId=0;
  add("complete",null,`Return F(${n})=${result}. Repeated subproblems caused ${additions} additions.`);
  return trace;
}

export function describeFibonacciBottomUp(step) {
  const updating=step.phase==="add", index=updating?step.i:step.phase==="complete"&&step.n>=2?step.n:null;
  return {summary:step.message,state:[
    {label:"Target",value:`F(${step.n})`}, {label:"Recorded table",value:oneRow(step.F)},
    {label:"Current index",value:step.i===null?"none":String(step.i)},
    {label:"Dependencies",value:index!==null?`F[${index-1}]=${step.F[index-1]}; F[${index-2}]=${step.F[index-2]}`:"none"},
    {label:"Addition relationship",value:index!==null?`${updating?"current":"retained"}: ${step.F[index-1]} + ${step.F[index-2]} = ${step.F[index]}`:"not evaluated"},
    {label:"Returned value",value:step.result===null?"not returned":String(step.result)},
    {label:"Additions",value:String(step.additions)}
  ],details:["Indices begin at zero. A dot is not computed; a saved zero is the number zero.",
    "F[0] and F[1] are both initialized even for target n=0, following the lecture's pseudocode. Only recurrence additions are counted."]};
}
export function describeFibonacciRecursive(step) {
  const node=step.activeId===null?null:step.nodes[step.activeId];
  const frequencies={};for(const entry of step.nodes)frequencies[entry.k]=(frequencies[entry.k]??0)+1;
  return {summary:step.message,state:[
    {label:"Target",value:`F(${step.n})`},
    {label:"Root call started",value:step.nodes.length?"yes":"no; the pending root box shows the input target"},
    {label:"Current call",value:node?`call #${node.id}: F(${node.k}), ${node.status}`:"none"},
    {label:"Retained operands",value:node?`a=${node.a??"not returned"}; b=${node.b??"not returned"}`:"none"},
    {label:"Call stack",value:step.stack.map(id=>`#${id}:F(${step.nodes[id].k})`).join(" → ")||"empty"},
    {label:"Created calls and edges",value:step.nodes.map(entry=>`#${entry.id}: F(${entry.k}), parent ${entry.parent===null?"none":`#${entry.parent}`}, ${entry.status}, a=${entry.a??"not returned"}, b=${entry.b??"not returned"}, result=${entry.result??"not returned"}`).join("; ")||"none"},
    {label:"Repeated labels highlighted",value:step.phase==="complete"?"all indices with more than one call":node?`calls with the current index ${node.k}, when repeated`:"none"},
    {label:"Repeated subproblems",value:Object.entries(frequencies).filter(([,count])=>count>1).map(([k,count])=>`F(${k}): ${count} calls`).join("; ")||"none"},
    {label:"Returned value",value:step.result===null?"not returned":String(step.result)},
    {label:"Additions",value:String(step.additions)}
  ],details:["Each box is a distinct call; a double outline marks repeated subproblems: those matching the current call during tracing, and all repeated indices at completion. Numeric results appear only after that call returns.",
    "The call tree and retained snapshots are visualization metadata. The algorithm itself retains only its call stack and local operands."]};
}
