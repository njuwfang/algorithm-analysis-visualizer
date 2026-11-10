import test from "node:test";
import assert from "node:assert/strict";
import {buildMsdTrace,parseMsdInput,describeMsd,msdFrontier} from "../src/lectures/09-non-comparison-sorting/msd-trace.js";

test("MSD has the exact source results and skips unnecessary digits in singleton groups",()=>{
  for(const [input,count] of [
    [[23,10,18,51,5,13,31,54,48,62,29,8,37],24],
    [[329,3,457,657,92,839,87,436,720,355,444],19],
    [[329,329,329],9],[[99999,99999],10],[[1],0],[[9,1,5],3]
  ]){
    const trace=buildMsdTrace(Object.freeze(input)),last=trace.at(-1);
    assert.equal(last.inspections,count);
    assert.deepEqual(msdFrontier(last).map(item=>({value:item.value,origin:item.origin})),input.map((value,i)=>({value,origin:i+1})).sort((a,b)=>a.value-b.value||a.origin-b.origin));
    assert.ok(last.nodes.every(node=>node.status==="complete"));
    assert.deepEqual(last.stack,[]);
  }
});

test("every MSD frame preserves fixed prefix ranges, item ownership, and inspection events",()=>{
  const cases=[[23,10,18,51,5,13,31,54,48,62,29,8,37],[329,3,457,657,92,839,87,436,720,355,444],[99999,1,99999,10]];
  for(const a of [1,2,11,12])for(const b of [1,2,11,12])for(const c of [1,2,11,12])cases.push([a,b,c]);
  for(const input of cases){
    const copy=[...input],trace=buildMsdTrace(Object.freeze(input));assert.deepEqual(input,copy);
    for(const [index,step] of trace.entries()){
      const active=step.nodes.find(node=>node.id===step.activeId),previous=trace[index-1];
      assert.equal(step.inspections-(previous?.inspections??0),step.phase==="inspect"?1:0);
      if(step.phase==="inspect"){
        assert.equal(step.activeLine,5);
        assert.equal(step.digit,Number(String(step.current.value).padStart(step.d,"0")[active.p]));
      }
      if(step.phase==="enqueue"){
        assert.equal(step.activeLine,6);assert.deepEqual(active.bins[step.digit].at(-1),step.current);
      }
      const frontier=msdFrontier(step);
      assert.deepEqual(frontier.map(item=>item.origin).sort((a,b)=>a-b),Array.from({length:input.length},(_,i)=>i+1));
      assert.ok(frontier.every(item=>item.value===input[item.origin-1]));
      for(const node of step.nodes){
        assert.equal(node.p,node.prefix.length);
        assert.ok(node.items.every(item=>String(item.value).padStart(step.d,"0").startsWith(node.prefix)));
        if(node.result!==null)assert.deepEqual(node.result,[...node.items].sort((a,b)=>a.value-b.value||a.origin-b.origin));
        if(node.bins)node.bins.forEach((bin,digit)=>assert.ok(bin.every(item=>Number(String(item.value).padStart(step.d,"0")[node.p])===digit)));
        if(node.children.length){
          const children=node.children.map(id=>step.nodes.find(child=>child.id===id));
          let offset=node.start,last=-1;
          for(const child of children){assert.equal(child.parent,node.id);assert.equal(child.prefix.slice(0,-1),node.prefix);assert.ok(Number(child.prefix.at(-1))>last);last=Number(child.prefix.at(-1));assert.equal(child.start,offset);offset+=child.items.length;}
          assert.equal(offset,node.start+node.items.length);
        }
      }
      if(step.phase==="base")assert.ok(active.items.length<=1||active.p===step.d);
    }
    assert.deepEqual(trace,buildMsdTrace(input));
  }
});

test("extension descriptions stay complete, stable and pure; snapshots are independent",()=>{
  for(const [trace,describe] of [[buildMsdTrace([329,3,457,436,329]),describeMsd]]){
    const labels=describe(trace[0]).state.map(row=>row.label);assert.equal(new Set(labels).size,labels.length);
    for(const step of trace){const before=structuredClone(step),d=describe(step);assert.equal(d.summary,step.message);assert.deepEqual(d.state.map(row=>row.label),labels);assert.ok(d.state.every(row=>typeof row.value==="string"&&row.value));assert.deepEqual(describe(step),d);assert.deepEqual(step,before);}
    trace.at(-1).nodes[0].items[0].value=999;assert.notEqual(trace[0].nodes[0].items[0].value,999);
  }
  for(const raw of ["0","-1","1.5","100000"])assert.throws(()=>parseMsdInput(raw));
});
