import test from "node:test";
import assert from "node:assert/strict";
import { buildCountingTrace, parseCountingInput, describeCounting } from "../src/lectures/09-non-comparison-sorting/counting-trace.js";
import { buildRadixTrace, parseRadixInput, describeRadix } from "../src/lectures/09-non-comparison-sorting/radix-trace.js";
import { projectRadixProof } from "../src/lectures/09-non-comparison-sorting/radix-proof.js";

const countingExample = "2,3,2,1,3,2,2,3,2,2,2,1 | 3";
const countingExercise = "4,1,3,4,3,4,1,1,2,3,4,3,2,1 | 4";
const radixExample = "23,10,18,51,5,13,31,54,48,62,29,8,37";
const radixExercise = "329,3,457,657,92,839,87,436,720,355,444";

test("counting sort reproduces the lecture's counts, starting positions, and stable placement", () => {
  const trace = buildCountingTrace(parseCountingInput(countingExample));
  const last = trace.at(-1);
  assert.deepEqual(last.counts, [2,7,3]);
  assert.deepEqual(last.starts, [1,3,10]);
  assert.deepEqual(last.positions, [3,10,13]);
  assert.deepEqual(last.output, [1,1,2,2,2,2,2,2,2,3,3,3]);
  assert.deepEqual(last.origins, [4,12,1,3,6,7,9,10,11,2,5,8]);
  assert.equal(last.writes, 45);
  const first = trace.find(step => step.phase === "place");
  assert.equal(first.destination, 3);
  assert.equal(first.positions[1], 3, "placement does not advance Pos until line 10");
});

test("counting sort counts every lecture array assignment and preserves all prefixes", () => {
  for (const raw of [countingExample,countingExercise,"1 | 1","4,4,4 | 4","3,1,3 | 32","2,1 | 2"]) {
    const input = parseCountingInput(raw), snapshot = structuredClone(input);
    Object.freeze(input.values); Object.freeze(input);
    const trace = buildCountingTrace(input), last = trace.at(-1);
    assert.deepEqual(input, snapshot);
    assert.deepEqual(trace, buildCountingTrace(input));
    assert.deepEqual(last.output, [...input.values].sort((a,b)=>a-b));
    assert.equal(last.writes, 3*input.values.length + 3*input.M);
    for (const [index,step] of trace.entries()) {
      assert.equal(step.writes - (trace[index-1]?.writes ?? 0), step.writeDelta);
      const expected = {"initialize-count":1,"count":3,"initialize-pos":4,"first-position":5,"prefix":7,"place":9,"advance":10};
      if (expected[step.phase]) {
        assert.equal(step.activeLine,expected[step.phase]);
        assert.equal(step.writeDelta,step.phase.startsWith("initialize")?input.M:1);
      } else assert.equal(step.writeDelta,0);
      if (["count","initialize-pos"].includes(step.phase)) {
        const consumed = step.phase === "count" ? step.i : input.values.length;
        assert.deepEqual(step.counts,Array.from({length:input.M},(_,k)=>input.values.slice(0,consumed).filter(v=>v===k+1).length));
      }
      if (step.phase === "prefix") assert.equal(step.positions[step.j-1],1+step.counts.slice(0,step.j-1).reduce((a,b)=>a+b,0));
      const occupied = step.origins.filter(origin=>origin!==null);
      assert.equal(new Set(occupied).size, occupied.length);
      assert.equal(occupied.length,step.placed);
      for (let k=0;k<step.output.length;k++) if(step.origins[k]!==null) assert.equal(step.output[k],input.values[step.origins[k]-1]);
    }
    for(let k=1;k<last.output.length;k++) if(last.output[k]===last.output[k-1])assert.ok(last.origins[k]>last.origins[k-1]);
  }
});

test("radix sort retains the lecture's FIFO bins and exact pass orders", () => {
  const trace=buildRadixTrace(parseRadixInput(radixExample));
  const firstBins=trace.find(step=>step.phase==="gather-start" && step.pass===1);
  assert.deepEqual(firstBins.bins.map(bin=>bin.map(item=>item.value)),[[10],[51,31],[62],[23,13],[54],[5],[],[37],[18,48,8],[29]]);
  const passes=trace.filter(step=>step.phase==="pass-complete");
  assert.deepEqual(passes[0].order.map(item=>item.value),[10,51,31,62,23,13,54,5,37,18,48,8,29]);
  assert.deepEqual(passes[1].order.map(item=>item.value),[5,8,10,13,18,23,29,31,37,48,51,54,62]);
  const tens=trace.find(step=>step.phase==="gather-start"&&step.pass===2);
  assert.deepEqual(tens.bins[5].map(item=>item.value),[51,54],"slide 34 temporarily omits 54; retain it as on slides 35–36");
  assert.equal(trace.at(-1).moves,52);
});

test("radix sort preserves every item, FIFO order, stability and the digit invariant", () => {
  for (const raw of [radixExample,radixExercise,"1","9,1,9,3,1","10000,10,1000,1,100,1000,1,1000,10000,10","99999,1,99999,10"]) {
    const input=Object.freeze(parseRadixInput(raw));
    const trace=buildRadixTrace(input),last=trace.at(-1);
    assert.deepEqual(trace,buildRadixTrace(input));
    assert.deepEqual(last.order.map(item=>item.value),[...input].sort((a,b)=>a-b));
    assert.equal(last.moves,2*input.length*last.d);
    assert.equal(last.enqueues,input.length*last.d);
    assert.equal(last.dequeues,last.enqueues);
    for(const [index,step] of trace.entries()) {
      const previous=trace[index-1];
      assert.equal(step.moves-(previous?.moves??0),["distribute","gather"].includes(step.phase)?1:0);
      if(step.phase==="distribute") {
        assert.equal(step.activeLine,4);
        assert.equal(step.bin,Math.floor(step.current.value/step.place)%10);
        assert.deepEqual(step.bins[step.bin].at(-1),step.current);
        const inputRank=new Map(step.order.map((item,i)=>[item.origin,i]));
        for(const bin of step.bins)for(let j=1;j<bin.length;j++)assert.ok(inputRank.get(bin[j].origin)>inputRank.get(bin[j-1].origin));
      }
      if(step.phase==="gather") {
        assert.equal(step.activeLine,7);
        assert.deepEqual(previous.bins[step.bin][0],step.current);
        assert.ok(step.bins.slice(0,step.bin).every(bin=>bin.length===0));
        assert.deepEqual(step.gathered.at(-1),step.current);
      }
      if(["distribute","gather-start","gather"].includes(step.phase)) {
        const retained=[...step.order.slice(step.inspected),...step.bins.flat(),...step.gathered];
        assert.deepEqual(retained.map(item=>item.origin).sort((a,b)=>a-b),Array.from({length:input.length},(_,i)=>i+1));
      }
      if(step.phase==="pass-complete") {
        const modulus=10**step.pass;
        const before=previous.order;
        // Native stable sort is an independent oracle for a completed pass, not used by the algorithm.
        const oracle=[...before].sort((a,b)=>(a.value%modulus)-(b.value%modulus));
        assert.deepEqual(step.order,oracle);
        assert.ok(step.bins.every(bin=>bin.length===0));
      }
    }
    for(let j=1;j<last.order.length;j++)if(last.order[j].value===last.order[j-1].value)assert.ok(last.order[j].origin>last.order[j-1].origin);
  }
});

test("both descriptions are complete, pure, and stable, and snapshots remain independent", () => {
  for(const [build,parse,describe,raw] of [[buildCountingTrace,parseCountingInput,describeCounting,countingExample],[buildRadixTrace,parseRadixInput,describeRadix,radixExercise]]) {
    const trace=build(parse(raw)),labels=describe(trace[0]).state.map(row=>row.label);
    assert.equal(new Set(labels).size,labels.length);
    for(const step of trace){
      const snapshot=structuredClone(step),description=describe(step);
      assert.equal(description.summary,step.message);
      assert.deepEqual(description.state.map(row=>row.label),labels);
      assert.ok(description.state.every(row=>typeof row.value==="string"&&row.value.length>0));
      assert.deepEqual(describe(step),description);
      assert.deepEqual(step,snapshot);
    }
    if(trace[0].counts){trace.at(-1).counts[0]=999;assert.equal(trace[0].counts[0],null);}
    else{trace.at(-1).order[0].value=999;assert.notEqual(trace[0].order[0].value,999);}
  }
});

test("radix correctness exposes the retained input, induction premise and concrete FIFO witness", () => {
  const trace=buildRadixTrace(parseRadixInput(radixExample));
  const passes=trace.filter(step=>step.phase==="pass-complete");
  assert.deepEqual(passes[0].passInput,trace[0].original,"the checkpoint must keep the actual incoming order");
  assert.deepEqual(passes[1].passInput,passes[0].order);
  const proof=projectRadixProof(passes[1]);
  assert.equal(proof.witness.digit,1);
  assert.deepEqual(proof.witness.items.map(item=>item.value),[10,13,18]);
  assert.deepEqual(proof.lower,[0,3,8]);
  assert.deepEqual(proof.suffixes,[5,8,10,13,18,23,29,31,37,48,51,54,62]);
  assert.equal(proof.verified,true);
  const first=projectRadixProof(passes[0]);
  assert.equal(first.priorDigits,0);
  assert.deepEqual(first.suffixes,[0,1,1,2,3,3,4,5,7,8,8,8,9]);
  for(const raw of [radixExample,radixExercise,"1","9,1,9,3,1","99999,1,99999,10"]){
    const states=buildRadixTrace(parseRadixInput(raw));
    for(const step of states){
      const snapshot=structuredClone(step),p=projectRadixProof(step);
      assert.deepEqual(step,snapshot);
      assert.deepEqual(projectRadixProof(step),p);
      assert.equal(p.verified,p.checkpoint,"only completed, valid passes claim correctness");
      if(p.active)assert.equal(p.premise,true);
      assert.deepEqual(p.groups.flatMap(group=>group.items).map(item=>item.origin).sort((a,b)=>a-b),step.passInput.slice(0,step.pass?step.inspected:0).map(item=>item.origin).sort((a,b)=>a-b));
      if(p.witness&&p.priorDigits>0)assert.ok(p.lower.every((value,i)=>i===0||p.lower[i-1]<=value));
    }
  }
});

test("radix correctness does not certify incomplete, reordered, duplicated or unsorted results", () => {
  const last=buildRadixTrace(parseRadixInput(radixExample)).at(-1);
  const corrupt=structuredClone(last);
  [corrupt.gathered[2],corrupt.gathered[3]]=[corrupt.gathered[3],corrupt.gathered[2]];
  assert.equal(projectRadixProof(corrupt).verified,false,"reversing a bin loses the lower-digit order");
  const duplicate=structuredClone(last);duplicate.gathered[1]=duplicate.gathered[0];
  assert.equal(projectRadixProof(duplicate).verified,false);
  const missing=structuredClone(last);missing.gathered.pop();
  assert.equal(projectRadixProof(missing).verified,false);
  const premature=structuredClone(last);premature.phase="gather";
  assert.equal(projectRadixProof(premature).verified,false);
  const unstable=buildRadixTrace([11,11,21]).at(-1);
  [unstable.gathered[0],unstable.gathered[1]]=[unstable.gathered[1],unstable.gathered[0]];
  assert.equal(projectRadixProof(unstable).verified,false,"equal numeric keys must retain their identity order too");
});

test("input errors identify unsupported keys and ranges", () => {
  for(const raw of ["","1,2","1 |","1 | 0","1 | 33","2 | 1","0 | 3","1.5 | 3","NaN | 3",`${Array(15).fill(1)} | 1`])assert.throws(()=>parseCountingInput(raw));
  for(const raw of ["","0","-1,2","1.5,2","100000","oops",Array(15).fill(1).join(",")])assert.throws(()=>parseRadixInput(raw));
  assert.deepEqual(parseCountingInput("1, 32 | 32"),{values:[1,32],M:32});
  assert.deepEqual(parseRadixInput("1 99999"),[1,99999]);
});
