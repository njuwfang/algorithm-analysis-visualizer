import {copy,at,cellKey,tableText,indexList} from "./shared.js?v=20261114-1";

export const buildKnapsackBottomUp = input => buildKnapsack(input,false);
export const buildKnapsackMemory = input => buildKnapsack(input,true);

function buildKnapsack({capacity,items},memoized) {
  const n=items.length,F={},trace=[],frames=[],stack=[],selected=[],path=[];
  let i=null,j=null,skip=null,take=null,updates=0,hits=0,result=null,cursor=null,activeId=null;
  const add=(phase,activeLine,message)=>{
    const frame=activeId===null?null:frames[activeId];
    trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),
      capacity,items,n,memoized,F,frames,stack,activeId,updates,hits,result,cursor,selected,path,
      i:frame?frame.i:i,j:frame?frame.j:j,skip:frame?frame.skip:skip,take:frame?frame.take:take}));
  };
  add("ready",null,memoized?"Request F[n,W]. Compute missing subproblems once and reuse saved answers.":"F[i,j] is the best value using the first i items at capacity j. Fill the table from smaller instances.");
  if(!memoized) {
    i=0;
    for(j=0;j<=capacity;j+=1){F[cellKey(0,j)]=0;add("base-row",1,`F[0,${j}]=0: no items can contribute value.`);}
    for(i=1;i<=n;i+=1) {
      j=0;F[cellKey(i,0)]=0;add("base-column",3,`F[${i},0]=0: positive-weight items cannot fit zero capacity.`);
      for(j=1;j<=capacity;j+=1) {
        const item=items[i-1];skip=at(F,i-1,j);take=item.weight<=j?item.value+at(F,i-1,j-item.weight):null;
        add(take===null?"too-heavy":"candidates",take===null?5:6,
          take===null?`Item ${i} weighs ${item.weight}, more than capacity ${j}; only F[${i-1},${j}]=${skip} is available.`:
          `Skip item ${i}: ${skip}. Take it once: ${item.value}+F[${i-1},${j-item.weight}]=${take}. Both sources use the previous row.`);
        F[cellKey(i,j)]=take===null?skip:Math.max(skip,take);updates+=1;
        add("store",take===null?5:6,`Save F[${i},${j}]=${at(F,i,j)}. ${take===null?"The item does not fit.":take>skip?"The take option wins.":take===skip?"Tie: retain skip for recovery.":"The skip option wins."}`);
      }
      skip=null;take=null;
    }
    i=null;j=null;
  } else {
    function solve(row,column,parent=null) {
      const frame={id:frames.length,parent,i:row,j:column,skip:null,take:null,result:null,status:"active"};
      frames.push(frame);stack.push(frame.id);activeId=frame.id;
      add("call",1,`Request F[${row},${column}].`);
      if(at(F,row,column)!==null) {
        hits+=1;frame.result=at(F,row,column);frame.status="cached";
        add("cache-hit",2,`Reuse saved F[${row},${column}]=${frame.result}; do not evaluate its recurrence again.`);
        stack.pop();return frame.result;
      }
      if(row===0||column===0) {
        F[cellKey(row,column)]=0;frame.result=0;frame.status="returned";
        add("base",3,`Save the requested base case F[${row},${column}]=0.`);
        stack.pop();return 0;
      }
      frame.skip=solve(row-1,column,frame.id);activeId=frame.id;
      add("skip-return",4,`Retain the skip answer F[${row-1},${column}]=${frame.skip}.`);
      const item=items[row-1];
      if(item.weight<=column) {
        const previous=solve(row-1,column-item.weight,frame.id);activeId=frame.id;
        frame.take=item.value+previous;
        add("take-return",6,`Taking item ${row} once gives ${item.value}+F[${row-1},${column-item.weight}]=${frame.take}.`);
      } else add("too-heavy",5,`Item ${row} weighs ${item.weight}>${column}; no take subproblem is requested.`);
      frame.result=frame.take===null?frame.skip:Math.max(frame.skip,frame.take);
      F[cellKey(row,column)]=frame.result;updates+=1;frame.status="stored";
      add("store",frame.take===null?8:7,`Save the newly computed F[${row},${column}]=${frame.result}; future requests can reuse it.`);
      frame.status="returned";add("return",9,`Return F[${row},${column}]=${frame.result} to the caller.`);
      stack.pop();return frame.result;
    }
    solve(n,capacity);activeId=null;
  }
  result=at(F,n,capacity);cursor={i:n,j:capacity};i=null;j=null;skip=null;take=null;
  add("traceback-start",memoized?11:7,`The optimum is ${result}; follow the retained table to recover one subset.`);
  while(cursor.i>0&&cursor.j>0) {
    i=cursor.i;j=cursor.j;const item=items[i-1];
    skip=at(F,i-1,j);take=item.weight<=j?item.value+at(F,i-1,j-item.weight):null;
    const chosen=at(F,i,j)>skip;
    if(chosen)selected.push(i);
    cursor={i:i-1,j:j-(chosen?item.weight:0)};
    path.push({i,j,nextI:cursor.i,nextJ:cursor.j,take:chosen});
    add(chosen?"traceback-take":"traceback-skip",memoized?(chosen?13:12):(chosen?10:9),
      chosen?`Choose item ${i} (w=${item.weight}, v=${item.value}); continue at F[${cursor.i},${cursor.j}].`:
      `Skip item ${i}: F[${i},${j}] equals F[${i-1},${j}]. Continue in the previous row.`);
  }
  i=null;j=null;skip=null;take=null;
  add("complete",memoized?14:11,`Return value ${result} with items ${[...selected].sort((a,b)=>a-b).join(", ")||"none"}. ${updates} nonbase DP updates${memoized?`; ${hits} saved answers reused`:""}.`);
  return trace;
}

export function describeKnapsack(step) {
  const inRange=step.i!==null&&step.i>0&&step.j>0&&step.phase!=="cache-hit";
  return {summary:step.message,state:[
    {label:"Input items",value:step.items.map((item,index)=>`${index+1}: weight ${item.weight}, value ${item.value}`).join("; ")||"none"},
    {label:"Capacity",value:String(step.capacity)},
    {label:"DP table",value:tableText(step.F,step.n,step.capacity)},
    {label:"Focused state",value:step.i===null?"none":`F[${step.i},${step.j}] = ${at(step.F,step.i,step.j)??"not computed"}`},
    {label:"Skip source",value:inRange?`F[${step.i-1},${step.j}] = ${step.skip??"not returned"}`:"none"},
    {label:"Take source",value:inRange?step.items[step.i-1].weight>step.j?"unavailable: item is too heavy":`${step.items[step.i-1].value} + F[${step.i-1},${step.j-step.items[step.i-1].weight}] = ${step.take??"not returned"}`:"none"},
    {label:"Requested calls",value:step.frames.map(frame=>`#${frame.id}: F[${frame.i},${frame.j}], parent ${frame.parent===null?"none":`#${frame.parent}`}, ${frame.status}, skip=${frame.skip??"not returned"}, take=${frame.take??"not returned"}, result=${frame.result??"not returned"}`).join("; ")||(step.memoized?"none requested yet":"none: bottom-up iteration")},
    {label:"Call stack",value:step.stack.map(id=>`#${id}:F[${step.frames[id].i},${step.frames[id].j}]`).join(" → ")||"empty"},
    {label:"Cache hits",value:String(step.hits)},
    {label:"Traceback cursor",value:step.cursor?`F[${step.cursor.i},${step.cursor.j}]`:"not started"},
    {label:"Traceback path",value:step.path.map(edge=>`F[${edge.i},${edge.j}] → F[${edge.nextI},${edge.nextJ}]: ${edge.take?"take":"skip"}`).join("; ")||"none"},
    {label:"Chosen item indices",value:indexList([...step.selected].sort((a,b)=>a-b))},
    {label:"Recovery order",value:indexList(step.selected)},
    {label:"Recovered weight",value:String(step.selected.reduce((sum,index)=>sum+step.items[index-1].weight,0))},
    {label:"Recovered value",value:String(step.selected.reduce((sum,index)=>sum+step.items[index-1].value,0))},
    {label:"Optimal value",value:step.result===null?"not returned":String(step.result)},
    {label:"DP updates",value:String(step.updates)}
  ],details:["Items are 1..n. F[i,j] uses only items 1..i and capacity j. A dot means not computed; a saved zero is a valid answer.",
    "Skip reads F[i−1,j]; take reads F[i−1,j−wᵢ] and adds vᵢ. Both sources use row i−1, so an item cannot be used twice.",
    "One DP update saves a newly evaluated nonbase state (i>0,j>0). Base cases, cache hits, and traceback do not increment it. Ties skip the current item."]};
}
