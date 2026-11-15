import {copy,at,cellKey} from "./shared.js?v=20261114-1";

export function parseMatrixChain(raw) {
  const text=String(raw).trim(),parts=text.includes(",")?text.split(",").map(part=>part.trim()):text.split(/\s+/);
  if(!text||parts.length<2||parts.length>7||parts.some(part=>!/^\d+$/.test(part)||Number(part)<1||Number(part)>100)) {
    throw new Error("Enter 2–7 dimensions from 1 to 100, for example 10,5,50,2,20. Consecutive dimensions define each matrix.");
  }
  return parts.map(Number);
}
export function chainExpression(n,splits,expanded) {
  const known=new Set(expanded);
  const visit=(i,j)=>{
    if(i===j)return `A${i}`;
    if(!known.has(cellKey(i,j)))return `[A${i}…A${j}]`;
    const k=splits[cellKey(i,j)];
    return `(${visit(i,k)} × ${visit(k+1,j)})`;
  };
  return visit(1,n);
}
export function buildMatrixChain(p) {
  const dimensions=[...p],n=p.length-1,M={},splits={},trace=[],expanded=[],visited=[];
  let length=null,i=null,j=null,k=null,left=null,right=null,join=null,candidate=null,best=null,bestK=null,
    improves=null,comparisons=0,result=null,pending=[],attempts=[];
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,
    ...(phase==="ready"?{activeLabel:"Ready"}:{}),p:dimensions,n,M,splits,length,i,j,k,left,right,join,candidate,best,bestK,
    improves,comparisons,result,pending,expanded,visited,attempts,expression:chainExpression(n,splits,expanded)}));
  add("ready",null,`Choose parentheses for A1…A${n}; matrix order stays fixed. Count comparisons of candidate split costs.`);
  for(i=1;i<=n;i+=1) {
    j=i;M[cellKey(i,i)]=0;
    add("base",1,`M[${i},${i}]=0: a single matrix needs no multiplication.`);
  }
  for(length=2;length<=n;length+=1)for(i=1;i+length-1<=n;i+=1) {
    j=i+length-1;k=null;left=null;right=null;join=null;candidate=null;best=null;bestK=null;improves=null;attempts=[];
    add("interval",4,`Solve interval [${i},${j}] of length ${length}. Start with best=∞; all shorter intervals are saved.`);
    for(k=i;k<j;k+=1) {
      left=at(M,i,k);right=at(M,k+1,j);join=p[i-1]*p[k]*p[j];candidate=left+right+join;improves=null;
      add("candidate",6,`Split after A${k}: saved left ${left} + saved right ${right} + join ${p[i-1]}·${p[k]}·${p[j]}=${join}; candidate ${candidate}.`);
      comparisons+=1;improves=best===null||candidate<best;
      attempts.push({k,left,right,join,candidate,improves});
      add("compare",7,`Compare candidate ${candidate} < best ${best??"∞"}: ${improves?"yes; retain this split next":candidate===best?"no; tie keeps the earlier split":"no; keep the saved best"}.`);
      if(improves) {
        best=candidate;bestK=k;
        add("choose",8,`Retain cost ${best} with split k=${bestK} for [${i},${j}].`);
      }
    }
    k=null;left=null;right=null;join=null;candidate=null;improves=null;
    M[cellKey(i,j)]=best;splits[cellKey(i,j)]=bestK;
    add("store",9,`Save M[${i},${j}]=${best} and S[${i},${j}]=${bestK} after trying every split.`);
  }
  length=null;i=null;j=null;k=null;left=null;right=null;join=null;candidate=null;best=null;bestK=null;improves=null;attempts=[];
  result=at(M,1,n);pending=[{i:1,j:n}];
  add("recover-start",10,`The minimum cost is ${result}. Recover parentheses from saved splits; do not recompute costs.`);
  while(pending.length) {
    const interval=pending.pop();i=interval.i;j=interval.j;k=null;visited.push(cellKey(i,j));
    add("recover-visit",12,`Recover [${i},${j}]${i===j?`: return the single matrix A${i}`:" using its saved split"}.`);
    if(i<j) {
      k=splits[cellKey(i,j)];expanded.push(cellKey(i,j));pending.push({i:k+1,j},{i,j:k});
      add("recover-split",13,`Expand [${i},${j}] at saved k=${k}: left [${i},${k}], right [${k+1},${j}].`);
    }
  }
  i=null;j=null;k=null;
  add("complete",14,`Return ${result} scalar multiplications with ${chainExpression(n,splits,expanded)}.`);
  return trace;
}
export function describeMatrixChain(step) {
  const table=object=>Array.from({length:step.n},(_,offset)=>{
    const i=offset+1;return Array.from({length:step.n-i+1},(_,d)=>{
      const j=i+d;return `[${i},${j}]=${object[cellKey(i,j)]??"not saved"}`;
    }).join("; ");
  }).join("; ");
  const splitting=step.k!==null;
  return {summary:step.message,state:[
    {label:"Matrix dimensions",value:step.p.slice(1).map((value,index)=>`A${index+1}: ${step.p[index]}×${value}`).join("; ")},
    {label:"Interval costs",value:table(step.M)},
    {label:"Saved splits",value:table(step.splits)},
    {label:"Current interval",value:step.i===null?"none":`[${step.i},${step.j}]; length ${step.j-step.i+1}`},
    {label:"Length being filled",value:step.length===null?"none":String(step.length)},
    {label:"Current split",value:splitting?`k=${step.k}; [${step.i},${step.k}] × [${step.k+1},${step.j}]`:"none"},
    {label:"Left subchain",value:splitting?`A${step.i}…A${step.k}; ${step.p[step.i-1]}×${step.p[step.k]}; M[${step.i},${step.k}]=${at(step.M,step.i,step.k)}`:"none"},
    {label:"Right subchain",value:splitting?`A${step.k+1}…A${step.j}; ${step.p[step.k]}×${step.p[step.j]}; M[${step.k+1},${step.j}]=${at(step.M,step.k+1,step.j)}`:"none"},
    {label:"Joining cost",value:step.join===null?"not evaluated":`${step.p[step.i-1]}·${step.p[step.k]}·${step.p[step.j]}=${step.join} scalar multiplications`},
    {label:"Candidate cost",value:step.candidate===null?"not evaluated":`${step.left}+${step.right}+${step.join}=${step.candidate}`},
    {label:"Best candidate retained",value:step.best===null?"none (∞)":`${step.best}; split k=${step.bestK}`},
    {label:"Comparison outcome",value:step.improves===null?"not evaluated":step.improves?"candidate improves the previous best":"candidate does not improve the previous best; ties keep the earlier split"},
    {label:"Tried splits",value:step.attempts.map(a=>`k=${a.k}: ${a.left}+${a.right}+${a.join}=${a.candidate}; ${a.improves?"improved best":"kept earlier best"}`).join("; ")||"none"},
    {label:"Recovery pending",value:step.pending.length?[...step.pending].reverse().map(({i,j})=>`[${i},${j}]`).join(" → "):"none"},
    {label:"Recovery visited",value:step.visited.join(" → ")||"none"},
    {label:"Expanded intervals",value:step.expanded.join("; ")||"none"},
    {label:"Parenthesization",value:step.expression},
    {label:"Minimum scalar multiplications",value:step.result===null?"not returned":String(step.result)},
    {label:"Split comparisons",value:String(step.comparisons)}
  ],details:[
    "M[i,j] is the minimum scalar-multiplication cost for the contiguous chain Ai…Aj; rows and columns index matrices, not matrix entries. The lower triangle is unused.",
    "Solid indigo outlines identify the left interval; dashed indigo outlines identify the right interval. Their costs are both needed, plus the join cost. Smaller intervals can be reused by different larger intervals.",
    "Only candidate < best comparisons are counted, including the first comparison with infinity. Recovery follows saved splits without additional split comparisons. Bracketed intervals in the expression have not yet been expanded."
  ]};
}
