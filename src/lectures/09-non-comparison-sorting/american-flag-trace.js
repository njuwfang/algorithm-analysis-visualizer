import {parseRadixInput} from "./radix-trace.js?v=20261108-3";

export const parseAmericanFlagInput = parseRadixInput;

export function buildAmericanFlagTrace(input) {
  const values=parseAmericanFlagInput(input.join(","));
  const original=values.map((value,index)=>({value,origin:index+1}));
  const d=String(Math.max(...values)).length;
  const makeFrame=(id,parent,prefix,lo,hi)=>({id,parent,prefix,p:prefix.length,lo,hi,
    count:null,start:null,end:null,next:null,cycle:null,status:"pending",children:[]});
  const state={original,a:structuredClone(original),d,frames:[makeFrame("root",null,"",1,values.length+1)],
    activeId:"root",stack:[],index:null,bucket:null,probe:null,target:null,exchange:null,recurseId:null,swaps:0,cycles:[]};
  const trace=[];
  const digit=(item,p)=>Math.floor(item.value/10**(d-p-1))%10;
  const clear=()=>{state.index=null;state.bucket=null;state.probe=null;state.target=null;state.exchange=null;state.recurseId=null;};
  const emit=(phase,activeLine,message)=>trace.push(structuredClone({...state,phase,activeLine,message,
    ...(phase==="ready"?{activeLabel:"Ready"}:{})}));
  emit("ready",null,"Count the current digits, reserve their ranges, then swap items into those ranges within A. No output array is used.");
  function partition(id) {
    const frame=state.frames.find(entry=>entry.id===id),name=frame.prefix||"*";
    state.activeId=id;state.stack.push(id);clear();frame.status="active";
    emit("enter",1,`Enter prefix ${name}, A[${frame.lo}..${frame.hi-1}]. Endpoints use [lo, hi), so hi is excluded.`);
    if(frame.hi-frame.lo<=1||frame.p===d) {
      frame.status="complete";
      emit("base",2,frame.hi-frame.lo<=1?"One item: this group is sorted without another swap.":`All ${d} digits are fixed; this equal-key group needs no more work.`);
      state.stack.pop();return;
    }
    frame.count=Array(10).fill(0);
    emit("initialize-count",3,`Clear Count[0..9] for prefix ${name}. Counting is excluded from the swap counter.`);
    for(let i=frame.lo;i<frame.hi;i+=1) {
      const q=digit(state.a[i-1],frame.p);state.index=i;state.bucket=q;frame.count[q]+=1;
      emit("count",3,`A[${i}]=${state.a[i-1].value} has current digit ${q}; Count[${q}] → ${frame.count[q]}.`);
    }
    clear();frame.start=[];frame.end=[];frame.next=[];
    let offset=frame.lo;
    for(let b=0;b<10;b+=1) {frame.start[b]=offset;frame.next[b]=offset;offset+=frame.count[b];frame.end[b]=offset;}
    emit("boundaries",4,`Prefix sums reserve [Start[b], End[b]) for each digit. Next[b] starts at Start[b] and marks its first unfilled slot.`);
    for(let b=0;b<10;b+=1) {
      if(frame.count[b]===0)continue;
      clear();state.bucket=b;
      emit("bucket",5,`Fill bucket ${b}: A[${frame.start[b]}..${frame.end[b]-1}].`);
      while(frame.next[b]<frame.end[b]) {
        const i=frame.next[b],item=state.a[i-1],q=digit(item,frame.p);
        clear();state.index=i;state.bucket=b;state.target=q===b?i:frame.next[q];state.probe={index:i,item:{...item},digit:q};
        if(q!==b&&(!frame.cycle||frame.cycle.closed))frame.cycle={anchor:i,slots:[i],swaps:0,closed:false};
        emit("probe",7,`A[${i}]=${item.value} (#${item.origin}), digit ${q}: ${q===b?`already belongs to bucket ${b}`:`belongs to bucket ${q}; its next free slot is A[${state.target}]`}.`);
        if(q===b) {
          frame.next[b]+=1;
          const closes=frame.cycle&&!frame.cycle.closed&&frame.cycle.anchor===i;
          if(closes) {frame.cycle.slots.push(i);frame.cycle.closed=true;state.cycles.push({prefix:frame.prefix,p:frame.p,...structuredClone(frame.cycle)});}
          emit("settle",8,closes?`The displaced item now fits A[${i}]. Close the cycle and advance Next[${b}] to ${frame.next[b]}; no extra swap.`:`A[${i}] already fits. Advance Next[${b}] to ${frame.next[b]}; no swap.`);
        } else {
          const j=frame.next[q],displaced=state.a[j-1];
          state.a[j-1]=item;state.a[i-1]=displaced;frame.next[q]+=1;state.swaps+=1;
          frame.cycle.slots.push(j);frame.cycle.swaps+=1;
          state.exchange={i,j,outgoing:{...item},displaced:{...displaced},digit:q,nextBefore:j,nextAfter:frame.next[q]};
          emit("swap",10,`Swap A[${i}] ↔ A[${j}]: ${item.value} (#${item.origin}) reaches bucket ${q}; ${displaced.value} (#${displaced.origin}) is now at A[${i}]. Advance Next[${q}] to ${frame.next[q]}.`);
        }
      }
    }
    clear();frame.status="partitioned";
    for(let b=0;b<10;b+=1)if(frame.count[b]) {
      const child=makeFrame(`${id}.${b}`,id,`${frame.prefix}${b}`,frame.start[b],frame.end[b]);
      state.frames.push(child);frame.children.push(child.id);
    }
    emit("partition",11,`All buckets have Next = End. Their current digits are fixed; recurse only within each bucket's reserved range.`);
    frame.status="waiting";
    for(const childId of frame.children) {
      const child=state.frames.find(entry=>entry.id===childId);
      state.activeId=id;clear();state.bucket=Number(child.prefix.at(-1));state.recurseId=childId;
      emit("recurse",12,`Recurse into prefix ${child.prefix}, A[${child.lo}..${child.hi-1}], in the same array.`);
      partition(childId);
      state.activeId=id;clear();state.bucket=Number(child.prefix.at(-1));
      emit("child-return",12,`Prefix ${child.prefix} is sorted in place; retain its range and continue.`);
    }
    clear();frame.status="complete";
    emit("return",13,`Prefix ${name} is sorted within A[${frame.lo}..${frame.hi-1}]. No collection or comparison merge is needed.`);
    state.stack.pop();
  }
  partition("root");state.activeId="root";clear();
  emit("complete",null,`A is sorted in place using ${state.swaps} swaps. Original item identities stay with their keys; equal-key order need not be preserved.`);
  return trace;
}

export function describeAmericanFlag(step) {
  const frame=step.frames.find(entry=>entry.id===step.activeId);
  const item=x=>`${x.value} (#${x.origin})`;
  const table=values=>values===null?"not computed":values.map((value,b)=>`[${b}]=${value}`).join("; ");
  const name=f=>f.prefix||"*";
  return {summary:step.message,state:[
    {label:"Input size n",value:String(step.original.length)},
    {label:"Digit width d",value:`${step.d}; positive keys are left-padded with zeros for digit selection`},
    {label:"Original input",value:step.original.map(item).join(", ")},
    {label:"Current array A",value:step.a.map((x,i)=>`A[${i+1}]=${item(x)}`).join("; ")},
    {label:"Active prefix",value:name(frame)},
    {label:"Active range",value:`[${frame.lo}, ${frame.hi}), meaning A[${frame.lo}..${frame.hi-1}]; all indices are 1-based and End is excluded`},
    {label:"Current digit position",value:frame.p===step.d?"all digits fixed":`zero-based p=${frame.p}, digit ${frame.p+1} from the left; place ${10**(step.d-frame.p-1)}`},
    {label:"Frequencies Count",value:table(frame.count)},
    {label:"Bucket starts Start",value:table(frame.start)},
    {label:"Bucket ends End",value:table(frame.end)},
    {label:"First unfilled positions Next",value:table(frame.next)},
    {label:"Bucket ranges and filled prefixes",value:frame.start===null?"not reserved":frame.start.map((start,b)=>`bucket ${b}: [${start},${frame.end[b]})${start===frame.end[b]?" empty":`; filled [${start},${frame.next[b]}); unfilled [${frame.next[b]},${frame.end[b]})`}`).join("; ")},
    {label:"Current bucket b",value:step.bucket===null?"none":String(step.bucket)},
    {label:"Current position i",value:step.index===null?"none":String(step.index)},
    {label:"Last digit probe",value:step.probe===null?"none":`Read ${item(step.probe.item)} at A[${step.probe.index}]: digit ${step.probe.digit}. This records the read before any following swap.`},
    {label:"Destination j",value:step.target===null?"none":String(step.target)},
    {label:"Swap this step",value:step.exchange===null?"none":`A[${step.exchange.i}] before: ${item(step.exchange.outgoing)}; A[${step.exchange.j}] before: ${item(step.exchange.displaced)}. After: A[${step.exchange.i}]=${item(step.exchange.displaced)}, A[${step.exchange.j}]=${item(step.exchange.outgoing)}. Next[${step.exchange.digit}]: ${step.exchange.nextBefore} → ${step.exchange.nextAfter}`},
    {label:"Cycle in active call",value:frame.cycle===null?"none":`${frame.cycle.closed?"last closed":"active"} cycle: ${frame.cycle.slots.join(" → ")}; anchor ${frame.cycle.anchor}; ${frame.cycle.swaps} swaps`},
    {label:"Completed cycles",value:step.cycles.map(c=>`prefix ${c.prefix||"*"}: slots ${c.slots.join(" → ")}; ${c.swaps} swaps`).join("; ")||"none"},
    {label:"Recursion stack",value:step.stack.map(id=>name(step.frames.find(f=>f.id===id))).join(" → ")||"empty"},
    {label:"Recursive ranges",value:step.frames.map(f=>`${f.id}: prefix ${name(f)}; parent ${f.parent||"none"}; range [${f.lo},${f.hi}); ${f.status}; children ${f.children.join(", ")||"none"}`).join("; ")},
    {label:"Next recursive call",value:step.recurseId===null?"none":name(step.frames.find(f=>f.id===step.recurseId))},
    {label:"Placement invariant",value:"Every filled position [Start[b], Next[b]) has digit b. A swap fills the destination bucket's next slot and leaves its displaced item at the anchor for the next probe. Previously filled slots are never overwritten."},
    {label:"Space and stability",value:"Sorting permutes the same array A, with bucket tables and recursion storage, and uses no n-item output array. # labels move with complete records. Equal-key order is not guaranteed."},
    {label:"Count scope",value:"One pairwise exchange at line 10 is one swap. Counting digits, computing boundaries, checking already-correct items, advancing pointers, and recursive control are excluded from the swap counter but contribute to total time."},
    {label:"Swaps",value:String(step.swaps)}
  ]};
}
