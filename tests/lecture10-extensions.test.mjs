import test from "node:test";
import assert from "node:assert/strict";
import {buildGridPaths,describeGridPaths,parseGridPaths,diagonalCells} from "../src/lectures/10-dynamic-programming/grid-paths-trace.js";
import {buildMatrixChain,describeMatrixChain,parseMatrixChain} from "../src/lectures/10-dynamic-programming/matrix-chain-trace.js";

const choose=(n,r)=>{let answer=1;for(let k=1;k<=r;k+=1)answer=answer*(n-r+k)/k;return Math.round(answer);};
function allChainCosts(p,i=1,j=p.length-1) {
  if(i===j)return [0];
  const costs=[];
  for(let k=i;k<j;k+=1)for(const a of allChainCosts(p,i,k))for(const b of allChainCosts(p,k+1,j))costs.push(a+b+p[i-1]*p[k]*p[j]);
  return costs;
}
test("grid counts match binomial coefficients; every recurrence uses the previous diagonal",()=>{
  for(let rows=0;rows<=5;rows+=1)for(let columns=0;columns<=5;columns+=1) {
    const trace=buildGridPaths({rows,columns}),last=trace.at(-1),written=new Set();
    assert.equal(last.result,choose(rows+columns,rows));assert.equal(last.additions,rows*columns);
    assert.deepEqual(last.finished,Array.from({length:rows+columns+1},(_,k)=>k));
    for(const [index,step] of trace.entries()) {
      for(const [key,value] of Object.entries(step.F)){const [i,j]=key.split(',').map(Number);assert.equal(value,choose(i+j,i));}
      if(index===0)continue;
      const previous=trace[index-1];
      assert.equal(step.additions-previous.additions,step.phase==="add"?1:0);
      const added=Object.keys(step.F).filter(key=>!(key in previous.F));
      assert.equal(added.length,["base","boundary","add"].includes(step.phase)?1:0);
      for(const key of added){assert.ok(!written.has(key));written.add(key);}
      if(step.phase==="read"||step.phase==="add") {
        assert.equal(step.activeLine,step.phase==="read"?6:7);
        assert.equal(step.i+step.j,step.k);
        assert.equal(step.above,previous.F[`${step.i-1},${step.j}`]);assert.equal(step.left,previous.F[`${step.i},${step.j-1}`]);
        assert.ok(step.finished.includes(step.k-1));
      }
      if(step.phase==="diagonal-start")assert.ok(diagonalCells(rows,columns,step.k).every(({i,j})=>step.F[`${i},${j}`]===undefined));
      if(step.phase==="diagonal-end")assert.ok(diagonalCells(rows,columns,step.k).every(({i,j})=>Number.isInteger(step.F[`${i},${j}`])));
    }
    assert.equal(written.size,(rows+1)*(columns+1));
    // Reversing the within-diagonal schedule preserves all counts.
    const reversed={"0,0":1};
    for(let k=1;k<=rows+columns;k+=1)for(const {i,j} of diagonalCells(rows,columns,k).reverse())reversed[`${i},${j}`]=i===0||j===0?1:reversed[`${i-1},${j}`]+reversed[`${i},${j-1}`];
    assert.deepEqual(reversed,last.F);
  }
  const example=buildGridPaths({rows:2,columns:2});
  assert.deepEqual(example.at(-1).F,{"0,0":1,"0,1":1,"1,0":1,"0,2":1,"1,1":2,"2,0":1,"1,2":3,"2,1":3,"2,2":6});
  const wave3=example.find(step=>step.phase==="diagonal-start"&&step.k===3);
  assert.equal(wave3.F["1,2"],undefined);assert.equal(wave3.F["2,1"],undefined);
});

test("matrix chain tries every split using already optimal shorter intervals and recovers valid parentheses",()=>{
  const inputs=[[10,5],[10,30,5,60],[10,5,50,2,20],[10,10,10,10,10],[100,100,100,100,100,100,100]];
  for(let code=0;code<243;code+=1){let rest=code;const p=[];for(let i=0;i<5;i+=1){p.push([1,2,5][rest%3]);rest=Math.floor(rest/3);}inputs.push(p);}
  for(const p of inputs) {
    const trace=buildMatrixChain(p),last=trace.at(-1),n=p.length-1,stored=new Set();
    assert.equal(last.result,Math.min(...allChainCosts(p)));assert.equal(last.comparisons,n*(n*n-1)/6);
    for(const [index,step] of trace.entries()) {
      for(const [key,value] of Object.entries(step.M)){const [i,j]=key.split(',').map(Number);assert.equal(value,Math.min(...allChainCosts(p,i,j)));}
      if(index===0)continue;
      const previous=trace[index-1];
      assert.equal(step.comparisons-previous.comparisons,step.phase==="compare"?1:0);
      if(step.phase==="candidate") {
        assert.ok(step.i<=step.k&&step.k<step.j);
        assert.equal(step.left,previous.M[`${step.i},${step.k}`]);assert.equal(step.right,previous.M[`${step.k+1},${step.j}`]);
        assert.equal(step.join,p[step.i-1]*p[step.k]*p[step.j]);assert.equal(step.candidate,step.left+step.right+step.join);
      }
      if(step.phase==="compare")assert.equal(step.improves,step.best===null||step.candidate<step.best);
      if(step.phase==="choose"){assert.equal(step.best,step.candidate);assert.equal(step.bestK,step.k);}
      if(step.phase==="store") {
        const key=`${step.i},${step.j}`;assert.ok(!stored.has(key));stored.add(key);
        assert.deepEqual(step.attempts.map(a=>a.k),Array.from({length:step.j-step.i},(_,offset)=>step.i+offset));
        assert.equal(step.best,Math.min(...step.attempts.map(a=>a.candidate)));
        assert.equal(step.bestK,step.attempts.find(a=>a.candidate===step.best).k,"ties choose the first split");
        assert.equal(step.splits[key],step.bestK);
      }
      if(step.phase.startsWith("recover")||step.phase==="complete")assert.deepEqual(step.M,previous.M,"recovery never computes new costs");
    }
    assert.equal(stored.size,n*(n-1)/2);
    assert.equal(last.visited.length,2*n-1);assert.equal(new Set(last.visited).size,last.visited.length);
    assert.equal(last.expanded.length,n-1);assert.equal(last.pending.length,0);assert.ok(!last.expression.includes('['));
    const leaves=[];
    const recoveredCost=(i,j)=>{if(i===j){leaves.push(i);return 0;}const k=last.splits[`${i},${j}`];assert.ok(k>=i&&k<j);return recoveredCost(i,k)+recoveredCost(k+1,j)+p[i-1]*p[k]*p[j];};
    assert.equal(recoveredCost(1,n),last.result);assert.deepEqual(leaves,Array.from({length:n},(_,i)=>i+1));
  }
});

test("the worked matrix chain reuses the interior interval and saves the discussed exact costs",()=>{
  const trace=buildMatrixChain([10,5,50,2,20]),last=trace.at(-1);
  assert.deepEqual(last.M,{"1,1":0,"2,2":0,"3,3":0,"4,4":0,"1,2":2500,"2,3":500,"3,4":2000,"1,3":600,"2,4":700,"1,4":1000});
  assert.deepEqual(trace.filter(s=>s.phase==="candidate"&&s.i===1&&s.j===4).map(s=>s.candidate),[1700,14500,1000]);
  assert.equal(last.expression,"((A1 × (A2 × A3)) × A4)");
  assert.ok(trace.some(s=>s.phase==="candidate"&&s.i===1&&s.j===3&&s.right===500&&s.k===1));
  assert.ok(trace.some(s=>s.phase==="candidate"&&s.i===2&&s.j===4&&s.left===500&&s.k===3));
});

test("extension parsers are bounded and traces are deterministic, snapshot-independent and fully described",()=>{
  for(const raw of ["","2","2,","-1,2","1.5,2","6,2","1,2,3"])assert.throws(()=>parseGridPaths(raw));
  for(const raw of ["","10","10,,20","0,2","101,2","1.5,2","1,2,3,4,5,6,7,8"])assert.throws(()=>parseMatrixChain(raw));
  assert.deepEqual(parseGridPaths("0,0"),{rows:0,columns:0});assert.deepEqual(parseGridPaths(" 2 x 4 "),{rows:2,columns:4});
  assert.deepEqual(parseMatrixChain("10 5 50 2 20"),[10,5,50,2,20]);
  for(const [build,describe,input] of [[buildGridPaths,describeGridPaths,{rows:2,columns:2}],[buildMatrixChain,describeMatrixChain,[10,5,50,2,20]]]) {
    const saved=structuredClone(input),trace=build(input),snapshots=structuredClone(trace),labels=describe(trace[0]).state.map(row=>row.label);
    assert.deepEqual(input,saved);assert.deepEqual(trace,build(input));assert.equal(trace[0].activeLabel,"Ready");assert.equal(new Set(labels).size,labels.length);
    for(const step of trace){assert.deepEqual(describe(step),describe(step));assert.deepEqual(describe(step).state.map(row=>row.label),labels);assert.ok(describe(step).state.every(row=>typeof row.value==="string"&&row.value.length));}
    const first=trace[0];if(first.F)first.F["0,0"]=999;if(first.M){first.M["1,1"]=999;first.p[0]=999;first.expanded.push("1,4");}
    assert.deepEqual(trace.at(-1),snapshots.at(-1));
  }
});
