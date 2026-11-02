import test from "node:test";
import assert from "node:assert/strict";
import {buildPresortTrace,parsePresortInput,describePresort,buildHornerTrace,parseHornerInput,describeHorner} from "../src/lectures/08-transform-conquer/array-traces.js";

test("presorting preserves the multiset and scans only until the first equal neighboring pair",()=>{
  for(const input of [[47,25,11,43,77,65,25],[4,2,6,1,3,5,7],[7],[4,4,4],[-3,0,-3,2]]){
    const before=[...input],trace=buildPresortTrace(Object.freeze(input)),last=trace.at(-1);
    assert.deepEqual(input,before);
    assert.equal(last.result,new Set(input).size===input.length);
    assert.deepEqual(last.values,[...input].sort((a,b)=>a-b));
    const first=last.values.findIndex((value,index)=>index<last.values.length-1&&value===last.values[index+1]);
    assert.equal(last.comparisons,first<0?input.length-1:first+1);
    assert.equal(trace[0].sorted,false);
    assert.equal(trace[1].phase,"sort");
    assert.equal(trace[1].comparisons,0);
    for(const [index,step] of trace.entries()){
      assert.equal(step.comparisons-(trace[index-1]?.comparisons??0),step.phase==="compare"?1:0);
      if(step.phase==="compare"){
        assert.equal(step.activeLine,3);
        assert.equal(step.equal,step.values[step.i]===step.values[step.i+1]);
        assert.equal(step.result,null);
      }
    }
    assert.equal(last.activeLine,last.result?5:4);
    assert.deepEqual(trace,buildPresortTrace(before));
  }
});

test("Horner reproduces the lecture's accumulator row and counts n multiplications and additions",()=>{
  const input=parseHornerInput("2,-1,3,1,-5 | 3"),trace=buildHornerTrace(input),last=trace.at(-1);
  assert.deepEqual(input.P,[-5,1,3,-1,2]);
  assert.deepEqual(trace.filter(step=>["initialize","update"].includes(step.phase)).map(step=>step.p),[2,5,18,55,160]);
  assert.deepEqual(trace.filter(step=>step.phase==="update").map(step=>step.i),[3,2,1,0]);
  assert.equal(last.result,160);
  assert.equal(last.multiplications,4);
  assert.equal(last.additions,4);
  for(const [index,step] of trace.entries()){
    assert.equal(step.multiplications-(trace[index-1]?.multiplications??0),step.phase==="update"?1:0);
    assert.equal(step.additions,step.multiplications);
    if(step.phase==="update"){
      assert.equal(step.activeLine,3);
      assert.equal(step.p,step.x*step.previous+step.P[step.i]);
      assert.ok(step.accumulators.slice(0,step.i).every(value=>value===null));
    }
    if(step.phase!=="complete")assert.equal(step.result,null);
  }
});

test("Horner agrees with a direct power-sum oracle including constants, zero and negative x",()=>{
  for(const raw of ["-5 | 3","0 | 0","2,-1,3,1,-5 | -3","2,-1,3,1,-5 | 0","1,0,0,0,0,0,0,1 | 10","-20,20,-20,20,-20,20,-20,20 | -10"]){
    const input=parseHornerInput(raw),snapshot=structuredClone(input);
    Object.freeze(input.P);Object.freeze(input);
    const trace=buildHornerTrace(input),last=trace.at(-1);
    const oracle=input.P.reduce((sum,coefficient,index)=>sum+coefficient*input.x**index,0);
    assert.equal(last.result,oracle,raw);
    assert.equal(last.multiplications,input.P.length-1);
    assert.deepEqual(input,snapshot);
    assert.deepEqual(trace,buildHornerTrace(input));
  }
});

test("array traces keep immutable snapshots and stable complete nonvisual state labels",()=>{
  for(const [build,describe,input] of [[buildPresortTrace,describePresort,[7,3,7,1]],[buildHornerTrace,describeHorner,parseHornerInput("2,-1,3,1,-5 | 3")]]){
    const trace=build(input),labels=describe(trace[0]).state.map(row=>row.label);
    assert.equal(labels.length,new Set(labels).size);
    for(const step of trace){
      const before=structuredClone(step),description=describe(step);
      assert.equal(description.summary,step.message);
      assert.deepEqual(description.state.map(row=>row.label),labels);
      assert.ok(description.state.every(row=>typeof row.value==="string"&&row.value.length));
      assert.deepEqual(describe(step),description);
      assert.deepEqual(step,before);
    }
    if(trace[0].values){trace.at(-1).values[0]=999;assert.notEqual(trace[0].values[0],999);}
    else{trace.at(-1).accumulators[0]=999;assert.equal(trace[0].accumulators[0],null);}
  }
});

test("invalid presort and Horner inputs give specific errors",()=>{
  for(const raw of ["","1.5,2","100,2",Array(11).fill(1).join(",")])assert.throws(()=>parsePresortInput(raw));
  for(const raw of ["","1,2","1,2 |","0,1 | 2","1,21 | 3","1.5,2 | 1","1,2 | 11","1,2 | 1.5"])assert.throws(()=>parseHornerInput(raw));
  assert.deepEqual(parsePresortInput("-99,0,99"),[-99,0,99]);
});
