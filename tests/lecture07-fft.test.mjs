import test from "node:test";
import assert from "node:assert/strict";
import { buildFftMultiplicationTrace as build, parseFftMultiplicationInput as parse, fftRoot, formatFftComplex } from "../src/lectures/07-divide-conquer/fft-trace.js";
import { fftMultiplicationModule as module } from "../src/lectures/07-divide-conquer/fft-multiplication.js";
import { validateModule } from "../src/core/schema.js";

function directDft(values, sign) {
  return values.map((_,k) => values.reduce((sum,value,j) => {
    const angle = sign*2*Math.PI*j*k/values.length;
    return { re:sum.re+value.re*Math.cos(angle)-value.im*Math.sin(angle), im:sum.im+value.re*Math.sin(angle)+value.im*Math.cos(angle) };
  },{re:0,im:0}));
}
function close(a,b) {
  assert.ok(Math.abs(a.re-b.re)<1e-8, `real ${a.re} versus ${b.re}`);
  assert.ok(Math.abs(a.im-b.im)<1e-8, `imaginary ${a.im} versus ${b.im}`);
}
function convolution(a,b,N) {
  const result=Array(N).fill(0);
  [...a].reverse().map(Number).forEach((x,i)=>[...b].reverse().map(Number).forEach((y,j)=>{result[i+j]+=x*y;}));
  return result;
}

test("the nine-step example connects coefficients, matching values, recovery, and carrying", () => {
  const trace=build(parse("23 | 14")), final=trace.at(-1);
  assert.equal(trace.length,9);
  assert.deepEqual(trace.map(step=>step.phase),["ready","encode","evaluate","pointwise","pointwise","pointwise","pointwise","recover","complete"]);
  assert.deepEqual(final.paddedA,[3,2,0,0]);
  assert.deepEqual(final.paddedB,[4,1,0,0]);
  assert.deepEqual(final.Ahat.map(value=>formatFftComplex(value)),["5","3+2i","1","3−2i"]);
  assert.deepEqual(final.Bhat.map(value=>formatFftComplex(value)),["5","4+i","3","4−i"]);
  assert.deepEqual(final.Z.map(value=>formatFftComplex(value)),["25","10+11i","3","10−11i"]);
  assert.deepEqual(final.coefficients,[12,11,2,0]);
  assert.deepEqual(final.carries,[
    {index:0,coefficient:12,incoming:0,total:12,digit:2,outgoing:1},
    {index:1,coefficient:11,incoming:1,total:12,digit:2,outgoing:1},
    {index:2,coefficient:2,incoming:1,total:3,digit:3,outgoing:0},
    {index:3,coefficient:0,incoming:0,total:0,digit:0,outgoing:0}
  ]);
  assert.equal(final.result,"322");
  assert.equal(final.pointwiseProducts,4);
});

test("conversion steps match quadratic DFT oracles and the recovered polynomial matches convolution", () => {
  for (const raw of ["1234 | 5678","99 | 99","0 | 123","9 | 99","9 | 9"]){
    const trace=build(parse(raw)), final=trace.at(-1), N=final.N;
    const expectedA=directDft(final.paddedA.map(re=>({re,im:0})),1);
    const expectedB=directDft(final.paddedB.map(re=>({re,im:0})),1);
    final.Ahat.forEach((value,k)=>close(value,expectedA[k]));
    final.Bhat.forEach((value,k)=>close(value,expectedB[k]));
    final.Z.forEach((value,k)=>close(value,{re:expectedA[k].re*expectedB[k].re-expectedA[k].im*expectedB[k].im,im:expectedA[k].re*expectedB[k].im+expectedA[k].im*expectedB[k].re}));
    directDft(final.Z,-1).forEach((value,k)=>close({re:value.re/N,im:value.im/N},{re:final.coefficients[k],im:0}));
    assert.deepEqual(final.coefficients,convolution(final.a,final.b,N));
    assert.equal(trace.length,N+5);
  }
});

test("only matching-value products advance the count and later results stay pending", () => {
  for (const raw of ["23 | 14","1234 | 5678","0 | 0","9 | 9"]) {
    const trace=build(parse(raw));
    for (const [index,step] of trace.entries()) {
      assert.equal(step.pointwiseProducts-(trace[index-1]?.pointwiseProducts??0),step.phase==="pointwise"?1:0);
      if(step.phase==="pointwise"){
        assert.equal(step.activeLine,3);
        assert.equal(step.pointIndex,step.pointwiseProducts-1);
        assert.ok(step.Z.slice(step.pointIndex+1).every(value=>value===null));
      }
      if(["ready","encode"].includes(step.phase)) assert.ok(step.Ahat.concat(step.Bhat).every(value=>value===null));
      if(!["recover","complete"].includes(step.phase)) assert.equal(step.coefficients,null);
      if(step.phase!=="complete"){
        assert.equal(step.result,null);
        assert.equal(step.outputDigits,null);
        assert.deepEqual(step.carries,[]);
      }
    }
    assert.equal(trace.at(-1).pointwiseProducts,trace[0].N);
  }
});

test("bounded coefficient recovery and carries match independent integer and convolution oracles", () => {
  const cases=[...module.input.presets.map(preset=>preset.value),"9999 | 9999","1000 | 1000","1 | 9999","9999 | 0","10 | 1","0 | 0","1 | 1","9 | 9"];
  let seed=73;
  for(let i=0;i<24;i+=1){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const a=seed%10000;seed=(Math.imul(seed,1664525)+1013904223)>>>0;cases.push(`${a} | ${seed%10000}`);}
  for(const raw of cases){
    const input=parse(raw),final=build(input).at(-1);
    assert.equal(final.result,(BigInt(input.a)*BigInt(input.b)).toString(),raw);
    assert.deepEqual(final.coefficients,convolution(input.a,input.b,final.N),raw);
    assert.ok(final.roundingError<1e-7);
    assert.equal(final.carries.at(-1).outgoing,0);
    assert.ok(final.outputDigits.every(digit=>Number.isInteger(digit)&&digit>=0&&digit<10));
    assert.ok(final.N>=final.coefficientCount);
    assert.ok(final.N===1||final.N/2<final.coefficientCount);
  }
  assert.deepEqual(build(parse("9 | 9")).at(-1).outputDigits,[1,8]);
});

test("input validation, immutability, and stable nonvisual states satisfy the module contract", () => {
  assert.deepEqual(parse("0023 | 0014"),{a:"23",b:"14"});
  for(const raw of ["23","1 |","| 1","1 | 2 | 3","-1 | 2","1.5 | 2","10000 | 2","a | 1"]) assert.throws(()=>parse(raw));
  assert.throws(()=>fftRoot(3,0));
  assert.throws(()=>fftRoot(4,0,0));
  assert.equal(validateModule(module,"07-divide-conquer"),true);
  for(const preset of module.input.presets){
    const input=Object.freeze(parse(preset.value)),trace=build(input);
    assert.deepEqual(trace,build(input));
    const labels=module.describe(trace[0]).state.map(row=>row.label);
    assert.equal(labels.length,new Set(labels).size);
    for(const step of trace){
      const before=structuredClone(step),description=module.describe(step);
      assert.deepEqual(description.state.map(row=>row.label),labels);
      assert.equal(description.summary,step.message);
      assert.equal(description.state.find(row=>row.label==="Pointwise products").value,String(step.pointwiseProducts));
      assert.equal(module.render(step),module.render(step));
      assert.deepEqual(step,before);
    }
    trace.at(-1).Ahat[0].re=999999;
    assert.notEqual(trace[2].Ahat[0].re,999999);
  }
});
