import test from "node:test";
import assert from "node:assert/strict";
import {parseChange,parseGraph,changeExamples,graphExamples,components} from "../src/lectures/11-greedy/shared.js";
import {buildChangeDP,describeChangeDP,buildGreedyChange,describeGreedyChange} from "../src/lectures/11-greedy/change-traces.js";
import {buildPrim,describePrim,buildKruskal,describeKruskal} from "../src/lectures/11-greedy/mst-traces.js";

function bfsChange(money,coins) {
  const distance=Array(money+1).fill(null),queue=[0];distance[0]=0;
  for(let i=0;i<queue.length;i+=1)for(const coin of coins){const next=queue[i]+coin;if(next<=money&&distance[next]===null){distance[next]=distance[queue[i]]+1;queue.push(next);}}
  return distance;
}
function bruteMST(graph){
  let best=Infinity;const {vertices,edges}=graph;
  const visit=(offset,selected,total)=>{
    if(selected.length===vertices.length-1){if(components(vertices,selected,edges).length===1)best=Math.min(best,total);return;}
    if(offset===edges.length||edges.length-offset<vertices.length-1-selected.length)return;
    visit(offset+1,[...selected,edges[offset].key],total+edges[offset].weight);visit(offset+1,selected,total);
  };visit(0,[],0);return best;
}
test("lecture change-making table, recovered coins and greedy counterexample agree",()=>{
  const dp=buildChangeDP(parseChange(changeExamples.recurrence)).at(-1);
  assert.deepEqual(dp.F,[0,1,2,3,4,1,1,2,3,4]);assert.equal(dp.result,4);assert.equal(dp.comparisons,18);
  assert.equal(dp.selected.reduce((a,b)=>a+b,0),9);
  const usa=buildGreedyChange(parseChange(changeExamples.usa)).at(-1);
  assert.deepEqual(usa.selected,[25,10,5]);assert.equal(usa.reference.count,3);
  const tanzania=buildGreedyChange(parseChange(changeExamples.tanzania)).at(-1);
  assert.deepEqual(tanzania.selected,[25,10,5]);assert.deepEqual(tanzania.reference.selected,[20,20]);assert.equal(tanzania.reference.count,2);
  const uae=buildGreedyChange(parseChange(changeExamples.uae)).at(-1);
  assert.deepEqual(uae.selected,[100,100,25,10,5]);assert.equal(uae.reference.count,5);
});
test("change-making supported cases match an independent breadth-first optimum and exact events",()=>{
  for(const coins of [[6,5,1],[25,20,10,5],[7,4],[3],[4,3,1],[10,5,2,1]])for(let money=0;money<=30;money+=1) {
    const expected=bfsChange(money,coins),trace=buildChangeDP({money,coins}),last=trace.at(-1);
    assert.deepEqual(last.F,expected);assert.equal(last.result,expected[money]);
    assert.equal(last.comparisons,coins.reduce((sum,c)=>sum+Math.max(0,money-c+1),0));
    if(last.result!==null){assert.equal(last.selected.length,last.result);assert.equal(last.selected.reduce((a,b)=>a+b,0),money);}
    for(const [index,s] of trace.entries())if(index){const before=trace[index-1];
      assert.equal(s.comparisons-before.comparisons,s.phase==="compare"?1:0);
      if(s.phase==="candidate"){assert.ok(s.dependency<s.amount);assert.ok(s.dependency<=s.savedThrough);assert.equal(s.candidate,s.F[s.dependency]===null?null:s.F[s.dependency]+1);}
      if(s.phase==="store")assert.equal(s.F[s.amount],expected[s.amount]);
      if(s.phase==="recover")assert.equal(s.comparisons,before.comparisons);
    }
    const greedy=buildGreedyChange({money,coins});
    for(const [index,s] of greedy.entries()){
      assert.equal(s.selected.reduce((a,b)=>a+b,0)+s.remaining,money);assert.ok(s.remaining>=0);
      if(index){const before=greedy[index-1];assert.equal(s.tests-before.tests,s.phase==="test"?1:0);assert.equal(s.selected.length-before.selected.length,s.phase==="take"?1:0);}
      if(s.phase==="take"){assert.equal(s.coin,Math.max(...coins.filter(c=>c<=traceGreedyPreviousRemaining(greedy,index))));assert.equal(s.testedRemainder,s.remaining+s.coin);}
      if(s.phase==="test")assert.equal(s.testedRemainder,s.remaining);
    }
    assert.equal(greedy.at(-1).reference.count,expected[money]);
  }
  function traceGreedyPreviousRemaining(trace,index){return trace[index-1].remaining;}
  const missed=buildGreedyChange({money:8,coins:[6,4]}).at(-1);
  assert.equal(missed.remaining,2);assert.equal(missed.reference.count,2);assert.match(missed.message,/missed/);
});
test("Prim and Kruskal reproduce lecture edge choices, label ties and exact weight",()=>{
  const graph=parseGraph(graphExamples.worked),prim=buildPrim(graph),kruskal=buildKruskal(graph);
  assert.deepEqual(prim.at(-1).tree,["a","b","c","f","e","d"]);
  assert.deepEqual(prim.at(-1).accepted,["ab","bc","bf","ef","df"]);assert.equal(prim.at(-1).total,15);
  const afterC=prim.find(s=>s.phase==="labels-ready"&&s.tree.length===3);
  assert.deepEqual(afterC.labels.f,{parent:"b",weight:4});assert.deepEqual(afterC.labels.d,{parent:"c",weight:6});
  assert.equal(prim.at(-1).comparisons,25);assert.equal(prim.at(-1).labelComparisons,10);assert.equal(prim.at(-1).selectionComparisons,15);
  assert.deepEqual(kruskal.at(-1).sorted.map(e=>e.key),["bc","ef","ab","bf","cf","af","df","ae","cd","de"]);
  assert.deepEqual(kruskal.at(-1).accepted,["bc","ef","ab","bf","df"]);assert.deepEqual(kruskal.at(-1).rejected,["cf","af"]);
  assert.equal(kruskal.at(-1).total,15);assert.equal(kruskal.at(-1).checks,7);
  assert.deepEqual(kruskal.find(s=>s.phase==="reject"&&s.edge==="cf").witness,["c","b","f"]);
});
test("MST traces satisfy cut/forest invariants and independently enumerated optimum",()=>{
  const graphs=Object.values(graphExamples).filter(value=>value!==graphExamples.large).map(parseGraph);
  for(let code=0;code<81;code+=1){let rest=code;const ws=Array.from({length:4},()=>{const w=rest%3;rest=Math.floor(rest/3);return w;});graphs.push(parseGraph(`a | ab:${ws[0]},bc:${ws[1]},cd:${ws[2]},ad:${ws[3]},ac:2`));}
  graphs.push(parseGraph("a |"));
  for(const graph of graphs)for(const build of [buildPrim,buildKruskal]) {
    const trace=build(graph),last=trace.at(-1);assert.equal(last.total,bruteMST(graph));assert.equal(last.accepted.length,graph.vertices.length-1);
    for(const [index,s] of trace.entries()){
      const groups=components(s.vertices,s.accepted,s.edges);assert.equal(groups.length,s.vertices.length-s.accepted.length);
      assert.equal(s.total,s.accepted.reduce((sum,key)=>sum+s.edges.find(e=>e.key===key).weight,0));
      if(!index)continue;const previous=trace[index-1];
      if(s.algorithm==="prim"){
        assert.equal(s.comparisons-previous.comparisons,["label-test","minimum-test"].includes(s.phase)?1:0);
        if(s.phase==="accept"){
          const crossing=s.edges.filter(e=>previous.tree.includes(e.u)!==previous.tree.includes(e.v));
          assert.equal(s.edges.find(e=>e.key===s.edge).weight,Math.min(...crossing.map(e=>e.weight)));
          assert.equal(s.tree.length,previous.tree.length+1);
        }
        if(s.phase==="labels-ready")for(const v of s.vertices.filter(v=>!s.tree.includes(v))){
          const candidates=s.edges.filter(e=>(e.u===v&&s.tree.includes(e.v))||(e.v===v&&s.tree.includes(e.u)));
          assert.equal(s.labels[v].weight,candidates.length?Math.min(...candidates.map(e=>e.weight)):null);
        }
      }else{
        assert.equal(s.checks-previous.checks,s.phase==="cycle-test"?1:0);
        if(s.phase==="reject"){
          assert.ok(s.same);assert.ok(s.witness.length>=3);
          for(let k=1;k<s.witness.length;k+=1)assert.ok(s.accepted.includes([s.witness[k-1],s.witness[k]].sort().join('')));
        }
        if(s.phase==="accept")assert.equal(s.accepted.length,previous.accepted.length+1);
      }
    }
    if(last.algorithm==="prim"){assert.equal(last.labelComparisons,graph.edges.length);assert.equal(last.selectionComparisons,graph.vertices.length*(graph.vertices.length-1)/2);}
  }
  const large=parseGraph(graphExamples.large),a=buildPrim(large).at(-1),b=buildKruskal(large).at(-1);
  assert.equal(a.total,36);assert.equal(a.total,b.total);assert.equal(a.accepted.length,11);assert.equal(large.edges.length,20);
});
test("Lecture 11 parsers reject malformed/disconnected inputs and keep zero/singleton cases",()=>{
  for(const raw of ["","5","-1 | 1","241 | 1","1.5 | 1","5 | ","5 | 1,,2","5 | 0,1","5 | 1,1","5 | 1001"])assert.throws(()=>parseChange(raw));
  for(const raw of ["","a","m | ab:1","a | aa:1","a | ab:1,ba:2","a | ab:100","a | ab:-1","a | ab:1,cd:2","c | ab:1"])assert.throws(()=>parseGraph(raw));
  assert.equal(parseChange("0 | 1").money,0);assert.equal(parseGraph("a | ab:0").edges[0].weight,0);assert.deepEqual(parseGraph("a |").vertices,["a"]);
});
test("all greedy traces and descriptions are deterministic, input-pure and snapshot independent",()=>{
  for(const [build,describe,input] of [[buildChangeDP,describeChangeDP,parseChange(changeExamples.recurrence)],[buildGreedyChange,describeGreedyChange,parseChange(changeExamples.tanzania)],[buildPrim,describePrim,parseGraph(graphExamples.worked)],[buildKruskal,describeKruskal,parseGraph(graphExamples.worked)]]){
    const saved=structuredClone(input),trace=build(input),last=structuredClone(trace.at(-1)),labels=describe(trace[0]).state.map(r=>r.label);
    assert.deepEqual(input,saved);assert.deepEqual(trace,build(input));assert.equal(new Set(labels).size,labels.length);
    for(const step of trace){assert.deepEqual(describe(step),describe(step));assert.deepEqual(describe(step).state.map(r=>r.label),labels);assert.ok(describe(step).state.every(r=>typeof r.value==="string"&&r.value.trim()));}
    if(trace[0].F)trace[0].F[0]=999;if(trace[0].coins)trace[0].coins[0]=999;if(trace[0].labels)trace[0].labels.a.weight=999;if(trace[0].groups)trace[0].groups[0].push('z');
    assert.deepEqual(trace.at(-1),last);
  }
});
