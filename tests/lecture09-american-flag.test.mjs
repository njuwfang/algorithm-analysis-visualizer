import test from "node:test";
import assert from "node:assert/strict";
import {buildAmericanFlagTrace,parseAmericanFlagInput,describeAmericanFlag} from "../src/lectures/09-non-comparison-sorting/american-flag-trace.js";

const digit=(item,p,d)=>Number(String(item.value).padStart(d,"0")[p]);
test("American flag follows one cycle with three swaps and uses one live array",()=>{
  const trace=buildAmericanFlagTrace([2,3,4,1]),last=trace.at(-1);
  assert.deepEqual(last.a.map(item=>item.value),[1,2,3,4]);
  assert.equal(last.swaps,3);
  assert.deepEqual(last.cycles[0].slots,[1,2,3,4,1]);
  assert.deepEqual(trace.filter(step=>step.phase==="swap").map(step=>[step.exchange.i,step.exchange.j]),[[1,2],[1,3],[1,4]]);
  assert.ok(trace.every(step=>step.a.length===4&&new Set(step.a.map(item=>item.origin)).size===4));
  assert.ok(trace.every(step=>!Object.hasOwn(step,"output")));
});

test("American flag handles the lecture inputs, zero-swap cases and long shared prefixes",()=>{
  for(const input of [[2,3,2,1,3,2,2,3,2,2,2,1],[4,1,3,4,3,4,1,1,2,3,4,3,2,1],[23,10,18,51,5,13,31,54,48,62,29,8,37],[329,3,457,657,92,839,87,436,720,355,444],[1],[3,3,3],[99999,1,99999,10],[1,2,3,4]]){
    const before=[...input],trace=buildAmericanFlagTrace(Object.freeze(input)),last=trace.at(-1);
    assert.deepEqual(input,before);assert.deepEqual(trace,buildAmericanFlagTrace(input));
    assert.deepEqual(last.a.map(item=>item.value),[...input].sort((a,b)=>a-b));
    assert.deepEqual(last.stack,[]);assert.ok(last.frames.every(frame=>frame.status==="complete"));
    assert.equal(last.swaps,last.cycles.reduce((sum,cycle)=>sum+cycle.slots.length-2,0));
    if(input.length===1||input.every(value=>value===input[0])||input.every((value,i)=>!i||input[i-1]<=value))assert.equal(last.swaps,0);
  }
  const last=buildAmericanFlagTrace([2,3,2,1,3,2,2,3,2,2,2,1]).at(-1);
  assert.equal(last.swaps,9);
  assert.ok(last.a.some((item,i)=>i&&item.value===last.a[i-1].value&&item.origin<last.a[i-1].origin),"the in-place permutation is not falsely presented as stable");
});

test("every frame preserves records and every placement fills precisely one reserved slot",()=>{
  const cases=[[2,3,2,1,3,2,2,3,2,2,2,1],[23,10,18,51,5,13,31,54,48,62,29,8,37],[99999,1,99999,10]];
  for(const a of [1,2,11,12])for(const b of [1,2,11,12])for(const c of [1,2,11,12])for(const d of [1,2,11,12])cases.push([a,b,c,d]);
  for(const input of cases){
    const trace=buildAmericanFlagTrace(input);
    for(const [index,step] of trace.entries()){
      const prev=trace[index-1],active=step.frames.find(frame=>frame.id===step.activeId);
      assert.deepEqual(step.a.map(item=>item.origin).sort((a,b)=>a-b),Array.from({length:input.length},(_,i)=>i+1));
      assert.ok(step.a.every(item=>item.value===input[item.origin-1]));
      assert.equal(step.swaps-(prev?.swaps??0),step.phase==="swap"?1:0);
      for(const frame of step.frames){
        assert.ok(step.a.slice(frame.lo-1,frame.hi-1).every(item=>String(item.value).padStart(step.d,"0").startsWith(frame.prefix)));
        if(frame.start!==null){
          assert.equal(frame.start[0],frame.lo);assert.equal(frame.end[9],frame.hi);
          for(let b=0;b<10;b++){
            assert.equal(frame.end[b]-frame.start[b],frame.count[b]);
            if(b)assert.equal(frame.start[b],frame.end[b-1]);
            assert.ok(frame.start[b]<=frame.next[b]&&frame.next[b]<=frame.end[b]);
            assert.ok(step.a.slice(frame.start[b]-1,frame.next[b]-1).every(item=>digit(item,frame.p,step.d)===b));
          }
        }
        if(frame.status==="complete"){
          const values=step.a.slice(frame.lo-1,frame.hi-1).map(item=>item.value);
          assert.deepEqual(values,[...values].sort((a,b)=>a-b));
        }
      }
      if(step.phase==="probe"){
        assert.equal(step.activeLine,7);assert.equal(step.index,active.next[step.bucket]);
        assert.equal(step.probe.digit,digit(step.a[step.index-1],active.p,step.d));
      }
      if(["swap","settle"].includes(step.phase)){
        const prior=prev.frames.find(frame=>frame.id===active.id);
        assert.equal(active.next.reduce((sum,next,b)=>sum+next-prior.next[b],0),1);
      }
      if(step.phase==="swap"){
        const {i,j,digit:q,outgoing,displaced}=step.exchange;
        assert.equal(step.activeLine,10);assert.notEqual(i,j);
        assert.equal(j,prev.frames.find(frame=>frame.id===active.id).next[q]);
        assert.ok(j>=active.start[q]&&j<active.end[q]);
        assert.deepEqual(step.a[i-1],displaced);assert.deepEqual(step.a[j-1],outgoing);
        assert.deepEqual(prev.a[i-1],outgoing);assert.deepEqual(prev.a[j-1],displaced);
        assert.ok(prev.a.every((item,at)=>at===i-1||at===j-1||item.origin===step.a[at].origin));
      }
      if(step.phase==="partition")assert.deepEqual(active.next,active.end);
    }
    assert.deepEqual(trace.at(-1).a.map(item=>item.value),[...input].sort((a,b)=>a-b));
  }
});

test("American flag description labels and snapshots remain stable, complete and pure",()=>{
  const trace=buildAmericanFlagTrace([23,10,18,51,5,13,31,54,48,62,29,8,37]);
  const labels=describeAmericanFlag(trace[0]).state.map(row=>row.label);assert.equal(new Set(labels).size,labels.length);
  for(const step of trace){const before=structuredClone(step),description=describeAmericanFlag(step);assert.equal(description.summary,step.message);assert.deepEqual(description.state.map(row=>row.label),labels);assert.ok(description.state.every(row=>typeof row.value==="string"&&row.value.length));assert.deepEqual(describeAmericanFlag(step),description);assert.deepEqual(step,before);}
  trace.at(-1).a[0].value=999;assert.notEqual(trace[0].a[0].value,999);
  for(const raw of ["","0","-1","1.5","100000",Array(15).fill(1).join(",")])assert.throws(()=>parseAmericanFlagInput(raw));
});
