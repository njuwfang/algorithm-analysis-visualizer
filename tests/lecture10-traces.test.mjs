import test from "node:test";
import assert from "node:assert/strict";
import {parseKeys, records, inversionPairs} from "../src/lectures/10-summary-extensions/shared.js";
import {buildInsertionInversions, describeInsertionInversions} from "../src/lectures/10-summary-extensions/insertion-trace.js";
import {buildMergeInversions, buildHybridMerge, baselineMergeComparisons, parseHybrid, describeMergeProcess} from "../src/lectures/10-summary-extensions/merge-trace.js";
import {buildDecisionTrace, parseDecisionInput, describeDecision, decisionLeaves} from "../src/lectures/10-summary-extensions/decision-trace.js";
import {buildConnections, parseConnection, describeConnections, buildSelection, parseSelection, describeSelection} from "../src/lectures/10-summary-extensions/reasoning-traces.js";

function brute(values) {
  let count=0;
  for(let i=0;i<values.length;i+=1) for(let j=i+1;j<values.length;j+=1) if(values[i]>values[j]) count+=1;
  return count;
}
const sorted = values => [...values].sort((a,b)=>a-b);
function stable(items) {
  for(let i=1;i<items.length;i+=1) {
    assert.ok(items[i-1].value<=items[i].value);
    if(items[i-1].value===items[i].value) assert.ok(items[i-1].id<items[i].id);
  }
}
function cases() {
  const examples=[[3,1,2,5,4],[5,4,3,2,1],[1],[2,2,2],[1,2,3,4],[-9,0,3,-9,3,2],[10,9,8,7,6,5,4,3,2,1],[-99,99,-99,0,99]];
  for(let code=0;code<3**5;code+=1) {
    let rest=code; const values=[];
    for(let i=0;i<5;i+=1){values.push(rest%3-1);rest=Math.floor(rest/3);}
    examples.push(values);
  }
  return examples;
}

test("insertion shifts remove exactly one inversion and conserve record identities through a hole",()=>{
  for(const values of cases()) {
    const trace=buildInsertionInversions(Object.freeze([...values]));
    assert.equal(trace.at(-1).shifts,brute(values));
    assert.deepEqual(trace.at(-1).a.map(item=>item.value),sorted(values));stable(trace.at(-1).a);
    for(const [index,step] of trace.entries()) {
      const stored=step.a.filter(Boolean).concat(step.held?[step.held]:[]);
      assert.deepEqual(stored.map(item=>item.id).sort((a,b)=>a-b),values.map((_,i)=>i));
      assert.equal(step.a.filter(item=>item===null).length,step.held?1:0);
      assert.equal(step.remaining.length+step.shifts,brute(values));
      assert.equal(step.remaining.length,brute(step.logical.map(item=>item.value)));
      if(index===0)continue;
      const prev=trace[index-1];
      assert.equal(step.shifts-prev.shifts,step.phase==="shift"?1:0);
      assert.equal(step.comparisons-prev.comparisons,step.phase==="compare"?1:0);
      if(step.phase==="shift") {
        assert.equal(step.activeLine,4);
        assert.ok(step.removed.left.value>step.removed.right.value);
        assert.equal(prev.remaining.length-step.remaining.length,1);
      }
    }
  }
});

test("merge batches count all and only cross inversions once, including equal and negative keys",()=>{
  for(const values of cases()) {
    const trace=buildMergeInversions(Object.freeze([...values])), final=trace.at(-1);
    assert.equal(final.inversions,brute(values));
    assert.deepEqual(final.a.map(item=>item.value),sorted(values));stable(final.a);
    const pairs=final.batches.flatMap(batch=>batch.pairs);
    assert.equal(new Set(pairs.map(pair=>`${pair.left.id}:${pair.right.id}`)).size,pairs.length);
    assert.equal(pairs.length,brute(values));
    for(const pair of pairs){assert.ok(pair.left.id<pair.right.id);assert.ok(pair.left.value>pair.right.value);}
    for(const [index,step] of trace.entries()) {
      if(index===0)continue;
      const prev=trace[index-1], frame=step.frames[step.activeId];
      assert.equal(step.comparisons-prev.comparisons,step.phase==="merge-compare"?1:0);
      assert.equal(step.inversions-prev.inversions,step.phase==="take-right"?frame.batch.length:0);
      if(step.phase==="take-right") {
        assert.equal(step.activeLine,9);
        const before=prev.frames[prev.activeId], expected=before.left.slice(before.leftUsed);
        assert.deepEqual(frame.batch.map(pair=>pair.left),expected);
        assert.ok(frame.batch.every(pair=>pair.right.id===before.right[before.rightUsed].id));
      }
      if(frame.status==="complete") {
        stable(frame.result);
        const originals=values.slice(frame.lo,frame.hi);
        assert.equal(frame.total,brute(originals));
      }
    }
  }
});

test("hybrid sorts stably for every cutoff and counts only executed key comparisons",()=>{
  for(const values of cases()) for(const cutoff of [1,2,4,10]) {
    const trace=buildHybridMerge(Object.freeze({values:Object.freeze([...values]),cutoff})),final=trace.at(-1);
    assert.deepEqual(final.a.map(item=>item.value),sorted(values));stable(final.a);
    assert.equal(final.baseline,baselineMergeComparisons(values));
    if(cutoff===1)assert.equal(final.comparisons,final.baseline);
    if(cutoff>=values.length)assert.equal(final.shifts,brute(values));
    for(const [index,step] of trace.entries()) {
      const ids=step.a.filter(Boolean).concat(step.held?[step.held]:[]).map(item=>item.id).sort((a,b)=>a-b);
      assert.deepEqual(ids,values.map((_,i)=>i));
      if(index>0)assert.equal(step.comparisons-trace[index-1].comparisons,["insertion-compare","merge-compare"].includes(step.phase)?1:0);
      if(step.phase==="insertion-compare")assert.equal(step.activeLine,5);
      if(step.phase==="merge-compare")assert.equal(step.activeLine,9);
      if(step.phase==="cutoff")assert.ok(step.frames[step.activeId].hi-step.frames[step.activeId].lo<=cutoff);
    }
  }
});

test("the six decision paths identify original indices and distinguish path cost from worst-case height",()=>{
  const counts=[];
  for(const order of decisionLeaves) {
    const values=Array(3);[...order].forEach((index,rank)=>{values[Number(index)]=rank+1;});
    const trace=buildDecisionTrace(Object.freeze(values)),final=trace.at(-1);counts.push(final.comparisons);
    assert.equal(final.candidates.length,1);assert.equal(final.candidates[0],order);
    assert.deepEqual(final.result,[...order].map(Number));
    assert.equal(final.phase,"complete");
    for(const [i,step] of trace.entries()) {
      assert.ok(step.candidates.includes(order));
      if(i===0)continue;
      const prev=trace[i-1];
      assert.equal(step.comparisons-prev.comparisons,step.phase==="compare"?1:0);
      if(step.phase==="filter") for(const candidate of step.candidates) for(const answer of step.answers) {
        assert.equal(candidate.indexOf(String(answer.a))<candidate.indexOf(String(answer.b)),answer.answer);
      }
    }
  }
  assert.equal(Math.min(...counts),2);assert.equal(Math.max(...counts),3);
});

test("reasoning cases reveal evidence before candidates and keep the model parameters explicit",()=>{
  for(const raw of ["binary-search | 16","mergesort | 8","horner | 4","counting-sort | 10 | 4","american-flag | 8 | 2"]) {
    const trace=buildConnections(parseConnection(raw));
    assert.deepEqual(trace.map(step=>step.checks),[0,1,2,3,4]);
    assert.equal(describeConnections(trace[0]).state.find(row=>row.label==="General model").value,"not generalized");
  }
  for(const raw of ["disorder | 3,1,2,5,4","range | 2,1,3,2","stable | 4,2,4,1","updates | 4,2,4,1"]) {
    const input=parseSelection(raw),trace=buildSelection(input);
    assert.equal(trace.at(-1).inversions,brute(input.values));
    assert.equal(describeSelection(trace[0]).state.find(row=>row.label==="Candidate").value,"not revealed");
    assert.deepEqual(trace.map(step=>step.checked),[0,1,2,3,3,3,3]);
  }
});

test("new traces and complete descriptions are deterministic, input-pure, and snapshot-independent",()=>{
  const builders=[
    [buildInsertionInversions,describeInsertionInversions,[3,1,2,5,4]],
    [buildMergeInversions,describeMergeProcess,[3,1,2,5,4]],
    [buildHybridMerge,describeMergeProcess,{values:[3,1,2,5,4],cutoff:2}],
    [buildDecisionTrace,describeDecision,[9,4,6]],
    [buildConnections,describeConnections,parseConnection("mergesort | 8")],
    [buildSelection,describeSelection,parseSelection("range | 2,1,3,2")]
  ];
  for(const [build,describe,input] of builders) {
    const before=structuredClone(input),trace=build(input),copy=structuredClone(trace);
    assert.deepEqual(input,before);assert.deepEqual(build(input),trace);
    const labels=describe(trace[0]).state.map(row=>row.label);
    for(const step of trace){assert.deepEqual(describe(step),describe(step));assert.deepEqual(describe(step).state.map(row=>row.label),labels);}
    if(trace[0].a)trace[0].a[0].value=999;
    if(trace[0].frames)trace[0].frames[0].status="changed";
    assert.deepEqual(trace.at(-1),copy.at(-1));
  }
});

test("invalid custom inputs identify the relevant domain error",()=>{
  for(const raw of ["","1.5,2","100,1","1,2,3,4,5,6,7,8,9,10,11"])assert.throws(()=>parseKeys(raw));
  for(const raw of ["1,2","1,1,2","1,2,3,4"])assert.throws(()=>parseDecisionInput(raw),/three distinct/);
  for(const raw of ["1,2","1,2 | 0","1,2 | 11","1,2 | x","1,2 | "])assert.throws(()=>parseHybrid(raw));
  for(const raw of ["unknown | 8","mergesort | 0","horner | 4 | 2","counting-sort | 8","american-flag | 8 | 6"])assert.throws(()=>parseConnection(raw));
  for(const raw of ["other | 1,2","range | 0,1","range | 17,1","stable | "])assert.throws(()=>parseSelection(raw));
});

test("hybrid examples demonstrate both fewer and more comparisons than their baseline",()=>{
  const fewer=buildHybridMerge({values:[4,1,3,2,5],cutoff:3}).at(-1);
  assert.equal(fewer.comparisons,7);assert.equal(fewer.baseline,8);
  const more=buildHybridMerge({values:[6,5,4,3,2,1],cutoff:6}).at(-1);
  assert.equal(more.comparisons,15);assert.equal(more.baseline,9);
});
