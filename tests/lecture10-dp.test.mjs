import test from "node:test";
import assert from "node:assert/strict";
import {parseFib,parseCoins,parseDpKnapsack,at} from "../src/lectures/10-dynamic-programming/shared.js";
import {buildFibonacciRecursive,buildFibonacciBottomUp,describeFibonacciRecursive,describeFibonacciBottomUp} from "../src/lectures/10-dynamic-programming/fibonacci-traces.js";
import {buildCoinRow,describeCoinRow} from "../src/lectures/10-dynamic-programming/coin-trace.js";
import {buildKnapsackBottomUp,buildKnapsackMemory,describeKnapsack} from "../src/lectures/10-dynamic-programming/knapsack-traces.js";

const fib=n=>{let a=0,b=1;for(let i=0;i<n;i+=1)[a,b]=[b,a+b];return a;};
function bestCoins(coins) {
  let best=0;
  for(let mask=0;mask<2**coins.length;mask+=1){if(mask&(mask<<1))continue;let sum=0;for(let i=0;i<coins.length;i+=1)if(mask&(1<<i))sum+=coins[i];best=Math.max(best,sum);}
  return best;
}
function bestPack(items,capacity) {
  let best=0;
  for(let mask=0;mask<2**items.length;mask+=1){let weight=0,value=0;for(let i=0;i<items.length;i+=1)if(mask&(1<<i)){weight+=items[i].weight;value+=items[i].value;}if(weight<=capacity)best=Math.max(best,value);}
  return best;
}
const sourcePack=parseDpKnapsack("5 | 2:12,1:10,3:20,2:15");

test("Fibonacci recurrences preserve results and count only additions",()=>{
  for(let n=0;n<=16;n+=1) {
    const bottom=buildFibonacciBottomUp(n),last=bottom.at(-1);
    assert.equal(last.result,fib(n));assert.equal(last.additions,Math.max(0,n-1));
    assert.equal(last.F[0],0);assert.equal(last.F[1],1);
    for(const [index,step] of bottom.entries())if(index>0){
      assert.equal(step.additions-bottom[index-1].additions,step.phase==="add"?1:0);
      if(step.phase==="add"){assert.equal(step.activeLine,4);assert.equal(step.F[step.i],step.F[step.i-1]+step.F[step.i-2]);}
    }
    if(n>7)continue;
    const recursive=buildFibonacciRecursive(n),end=recursive.at(-1);
    assert.equal(end.result,fib(n));assert.equal(end.additions,fib(n+1)-1);
    assert.equal(end.nodes.length,2*fib(n+1)-1);assert.deepEqual(end.stack,[]);
    for(const [index,step] of recursive.entries()) {
      assert.ok(step.stack.length<=Math.max(1,n));
      for(const node of step.nodes){
        if(node.parent!==null){const parent=step.nodes[node.parent];assert.ok(node.k===parent.k-1||node.k===parent.k-2);assert.equal(node.depth,parent.depth+1);assert.ok(node.start>=parent.start&&node.start+node.span<=parent.start+parent.span);}
        if(node.result!==null){assert.equal(node.result,fib(node.k));if(node.k>1)assert.equal(node.result,node.a+node.b);}
      }
      if(index>0)assert.equal(step.additions-recursive[index-1].additions,step.phase==="add"?1:0);
    }
  }
  assert.equal(buildFibonacciRecursive(5).at(-1).additions,7);
  assert.equal(buildFibonacciBottomUp(5).at(-1).additions,4);
});

test("coin-row prefix answers and recovery match independent subset enumeration",()=>{
  const inputs=[[5,1,2,10,6,2],[7,2,1,12,5],[5],[2,2,2],[]];
  for(let code=0;code<3**5;code+=1){let rest=code;const coins=[];for(let i=0;i<5;i+=1){coins.push([1,2,4][rest%3]);rest=Math.floor(rest/3);}inputs.push(coins);}
  for(const coins of inputs) {
    const trace=buildCoinRow(Object.freeze([...coins])),last=trace.at(-1);
    assert.equal(last.result,bestCoins(coins));assert.equal(last.comparisons,Math.max(0,coins.length-1));
    for(let k=0;k<=coins.length;k+=1)assert.equal(last.F[k],bestCoins(coins.slice(0,k)));
    const chosen=[...last.selected].sort((a,b)=>a-b);
    assert.equal(new Set(chosen).size,chosen.length);
    assert.ok(chosen.every((value,index)=>index===0||value-chosen[index-1]>1));
    assert.equal(chosen.reduce((sum,index)=>sum+coins[index-1],0),last.result);
    for(const [index,step] of trace.entries()) {
      if(index>0)assert.equal(step.comparisons-trace[index-1].comparisons,step.phase==="choose"?1:0);
      if(step.phase==="choose"){assert.equal(step.activeLine,5);assert.equal(step.F[step.i],Math.max(step.take,step.skip));}
      for(const edge of step.path)assert.equal(edge.from-edge.to,edge.take&&edge.from>1?2:1);
    }
  }
  const source=buildCoinRow([5,1,2,10,6,2]).at(-1);
  assert.deepEqual(source.F,[0,5,5,7,15,15,17]);assert.deepEqual(source.selected,[6,4,1]);
  assert.equal(buildCoinRow([7,2,1,12,5]).at(-1).result,19);
});

test("source knapsack table, recovery and memory-function reuse agree",()=>{
  const bottom=buildKnapsackBottomUp(sourcePack).at(-1),memory=buildKnapsackMemory(sourcePack).at(-1);
  const rows=[[0,0,0,0,0,0],[0,0,12,12,12,12],[0,10,12,22,22,22],[0,10,12,22,30,32],[0,10,15,25,30,37]];
  assert.deepEqual(rows,Array.from({length:5},(_,i)=>Array.from({length:6},(_,j)=>at(bottom.F,i,j))));
  for(const result of [bottom,memory]){assert.equal(result.result,37);assert.deepEqual(result.selected,[4,2,1]);}
  assert.equal(bottom.updates,20);assert.equal(memory.updates,11);assert.equal(memory.hits,4);
  assert.equal(at(memory.F,4,4),null,"unrequested cells stay unknown");
  for(const [raw,value,selected] of [
    ["6 | 3:13,1:12,1:10,2:17,2:15",54,[2,3,4,5]],
    ["16 | 2:20,5:30,10:50,5:10",80,[2,3]]
  ])for(const build of [buildKnapsackBottomUp,buildKnapsackMemory]){
    const last=build(parseDpKnapsack(raw)).at(-1);assert.equal(last.result,value);assert.deepEqual([...last.selected].sort((a,b)=>a-b),selected);
  }
});

test("knapsack states are computed once from prior-row dependencies and recover feasible 0/1 subsets",()=>{
  const inputs=[sourcePack,parseDpKnapsack("0 | 2:12,1:10"),parseDpKnapsack("2 | 1:0,1:0"),parseDpKnapsack("1 | 2:99"),parseDpKnapsack("4 | 2:7,2:7")];
  for(let code=0;code<27;code+=1){let rest=code;const items=[];for(let i=0;i<3;i+=1){items.push({weight:rest%3+1,value:[0,2,5][(rest+i)%3]});rest=Math.floor(rest/3);}for(let capacity=0;capacity<=7;capacity+=1)inputs.push({items,capacity});}
  for(const input of inputs)for(const build of [buildKnapsackBottomUp,buildKnapsackMemory]){
    const trace=build(input),last=trace.at(-1),evaluated=new Set();
    assert.equal(last.result,bestPack(input.items,input.capacity));
    if(build===buildKnapsackBottomUp)assert.equal(last.updates,input.items.length*input.capacity);
    assert.equal(last.updates,Object.keys(last.F).filter(key=>key.split(',').every(index=>Number(index)>0)).length);
    assert.equal(new Set(last.selected).size,last.selected.length);
    assert.ok(last.selected.reduce((sum,index)=>sum+input.items[index-1].weight,0)<=input.capacity);
    assert.equal(last.selected.reduce((sum,index)=>sum+input.items[index-1].value,0),last.result);
    for(const [index,step] of trace.entries()) {
      for(const [key,value] of Object.entries(step.F)){const [i,j]=key.split(',').map(Number);assert.equal(value,bestPack(input.items.slice(0,i),j));}
      if(index===0)continue;
      const previous=trace[index-1];
      assert.equal(step.updates-previous.updates,step.phase==="store"?1:0);
      if(step.phase==="store") {
        const key=`${step.i},${step.j}`;assert.ok(!evaluated.has(key));evaluated.add(key);
        assert.equal(step.skip,at(step.F,step.i-1,step.j));
        const item=input.items[step.i-1];
        if(item.weight<=step.j)assert.equal(step.take,item.value+at(step.F,step.i-1,step.j-item.weight));else assert.equal(step.take,null);
      }
      if(step.phase==="cache-hit"){assert.deepEqual(step.F,previous.F);assert.equal(step.hits-previous.hits,1);}
      for(const edge of step.path){assert.equal(edge.nextI,edge.i-1);assert.equal(edge.nextJ,edge.j-(edge.take?input.items[edge.i-1].weight:0));}
    }
  }
});

test("DP traces are input-pure, snapshot-independent, deterministic, and fully described",()=>{
  const examples=[
    [buildFibonacciRecursive,describeFibonacciRecursive,5],
    [buildFibonacciBottomUp,describeFibonacciBottomUp,5],
    [buildCoinRow,describeCoinRow,[5,1,2,10,6,2]],
    [buildKnapsackBottomUp,describeKnapsack,sourcePack],
    [buildKnapsackMemory,describeKnapsack,sourcePack]
  ];
  for(const [build,describe,input] of examples){
    const saved=structuredClone(input),trace=build(input),before=structuredClone(trace),labels=describe(trace[0]).state.map(row=>row.label);
    assert.deepEqual(input,saved);assert.deepEqual(trace,build(input));assert.equal(trace[0].activeLabel,"Ready");
    for(const step of trace){assert.deepEqual(describe(step),describe(step));assert.deepEqual(describe(step).state.map(row=>row.label),labels);assert.equal(new Set(labels).size,labels.length);}
    if(trace[0].F)trace[0].F[0]=999;
    if(trace[0].items)trace[0].items[0].value=999;
    if(trace[1].nodes)trace[1].nodes[0].k=999;
    assert.deepEqual(trace.at(-1),before.at(-1));
  }
});

test("invalid DP inputs report their domain and preserve supported boundary values",()=>{
  for(const raw of ["","-1","1.5","8","NaN"])assert.throws(()=>parseFib(raw,7));
  assert.equal(parseFib("0",7),0);assert.equal(parseFib("7",7),7);
  for(const raw of ["","0,1","1,-1","1,1.5","100","1,2,3,4,5,6,7,8,9,10,11"])assert.throws(()=>parseCoins(raw));
  for(const raw of ["5","| 1:2","21 | 1:2","1 | 0:3","1 | 1:-3","1 | 1:2,,3:4","1 | 1:100","1 | "])assert.throws(()=>parseDpKnapsack(raw));
  assert.equal(parseDpKnapsack("0 | 1:0").capacity,0);
});
