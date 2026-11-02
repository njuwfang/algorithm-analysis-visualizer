import {escapeHtml} from "../../core/utils.js";
import {buildPresortTrace,parsePresortInput,describePresort,buildHornerTrace,parseHornerInput,describeHorner} from "./array-traces.js?v=20261101-1";

function arrayRow(label,values,step=null){
  const n=values.length;
  return `<div class="tc-array-row"><strong>${label}</strong><div class="tc-array-scroll" data-visual-scroll><div class="tc-array-board" style="--tc-items:${n}"><div class="tc-array-cells">${values.map((value,index)=>{
    const current=step?.i!==null&&step?.i!==undefined&&[step.i,step.i+1].includes(index);
    return `<div class="tc-array-cell ${current?"is-current-pair":""} ${current&&step.equal?"is-equal":""}"${current?" data-active-visual":""}><small>${index}</small><b>${value===null?"?":value}</b></div>`;
  }).join("")}</div>${step?`<div class="tc-pair-track">${step.i!==null?`<span style="grid-column:${step.i+1}/span 2" class="${step.equal?"is-equal":""}">${step.equal?"equal":"different"}</span>`:`<span style="grid-column:1/-1">${step.result===true?"all neighboring pairs differ":"neighbor scan"}</span>`}</div>`:""}</div></div></div>`;
}
function renderPresort(step){
  const result=step.result===null?step.sorted?"Check consecutive elements only":"Sort to bring any equal keys together":step.result?"True · all keys are unique":"False · repeated keys found";
  return `<div class="tc-array-visual">${arrayRow("Original A",step.original)}<div class="tc-transform-arrow ${step.phase==="sort"?"is-action":""}">↓ Presort</div>${arrayRow("Sorted A",step.sorted?step.values:step.values.map(()=>null),step)}<div class="tc-current-equation ${step.phase==="compare"?"is-counted":""}">${step.i===null?"Equal keys become neighbors after sorting.":`${step.values[step.i]} = ${step.values[step.i+1]} is ${step.equal?"true":"false"}`}</div><div class="tc-result ${step.result===true?"is-valid":step.result===false?"is-invalid":""}">${result}</div></div>`;
}
export const presortUniquenessModule={
  id:"presort-uniqueness",shortTitle:"Presorting",title:"Presorting for Element Uniqueness",
  summary:"Sort once, then decide uniqueness by comparing neighboring elements.",complexity:"Θ(n log n) with Θ(n log n) presorting",source:{slides:"5–9"},
  objective:"Explain why presorting reduces uniqueness testing to an adjacent scan and include both stages in the time model.",
  input:{label:"Array A",hint:"Enter 1–10 integer keys from −99 to 99, separated by commas or spaces.",default:"47,25,11,43,77,65,25",presets:[
    {label:"Repeated key",value:"47,25,11,43,77,65,25"},{label:"All unique",value:"4,2,6,1,3,5,7"},{label:"Equal keys",value:"25,25,25,25"}
  ],parse:parsePresortInput},
  pseudocode:[{line:1,text:"sort the array A"},{line:2,text:"for i ← 0 to n − 2 do"},{line:3,text:"if A[i] = A[i+1]",indent:1,basic:true,basicLabel:"adjacent comparison"},{line:4,text:"return False",indent:2},{line:5,text:"return True"}],
  buildTrace:buildPresortTrace,render:renderPresort,describe:describePresort,
  metrics:step=>[{label:"Adjacent comparisons",value:step.comparisons,emphasis:true}],
  model(step){return {
    latex:step.phase==="complete"?`\\begin{gathered}C_{\\mathrm{scan}}(A)=${step.comparisons}\\le n-1\\\\T(n)=T_{\\mathrm{sort}}(n)+T_{\\mathrm{scan}}(n)\\\\=\\Theta(n\\log n)+O(n)\\\\=\\Theta(n\\log n)\\quad(n>1)\\end{gathered}`:"T(n)=T_{\\mathrm{sort}}(n)+T_{\\mathrm{scan}}(n)",
    notes:["The counter includes only neighboring equality tests. Sorting is one transformation step, modeled as Θ(n log n), as on slide 9.",...(step.phase==="complete"?["The scan can stop at the first equal pair; n−1 tests are needed when all keys are unique."]:[])]
  };},
  analysis:[{term:"Input size",value:"n is the number of keys."},{term:"Transformation",value:"Instance simplification: sorting groups equal keys consecutively."},{term:"Counted operation",value:"One evaluated A[i]=A[i+1] test; sorting comparisons and loop guards are excluded."},{term:"Sort convention",value:"The lecture treats sorting as a subroutine and assumes a Θ(n log n) comparison-sort stage. Its work belongs in total time and is excluded from the adjacent-comparison counter."},{term:"Case distinction",value:"An equal first pair stops after one test; all unique keys require n−1. Slide 9's Θ(n) scan term describes the full scan, while an early return can be shorter."},{term:"Examples",value:"The source has no numeric uniqueness input. Prepared cases instantiate its procedure using keys from the deck's BST section."}]
};

function polynomial(P){
  const terms=[];
  for(let i=P.length-1;i>=0;i-=1){const value=P[i];if(value===0)continue;const magnitude=Math.abs(value),term=i===0?String(magnitude):`${magnitude===1?"":magnitude}x${i===1?"":`<sup>${i}</sup>`}`;terms.push(`${terms.length?value<0?" − ":" + ":value<0?"−":""}${term}`);}
  return terms.join("")||"0";
}
function nested(P){
  let text=String(P.at(-1));
  for(let i=P.length-2;i>=0;i-=1)text=`${i===P.length-2?text:`(${text})`}x ${P[i]<0?"−":"+"} ${Math.abs(P[i])}`;
  return text;
}
function renderHorner(step){
  const order=[...step.P.keys()].reverse();
  const current=step.phase==="initialize"?step.n:step.phase==="update"?step.i:null;
  return `<div class="tc-horner-visual"><div class="tc-polynomial">p(x) = ${polynomial(step.P)}</div><div class="tc-transform-arrow">↓ factor out x repeatedly</div><div class="tc-nested">${escapeHtml(nested(step.P))}</div><div class="tc-horner-table-scroll" data-visual-scroll><table class="tc-horner-table"><caption>x = ${step.x} · retain each running value</caption><thead><tr><th>i</th>${order.map(i=>`<th>${i}</th>`).join("")}</tr></thead><tbody><tr><th>P[i]</th>${order.map(i=>`<td class="${i===current?"is-action":""}">${step.P[i]}</td>`).join("")}</tr><tr><th>p</th>${order.map(i=>`<td class="${i===current?"is-current":""}"${i===current?" data-active-visual":""}>${step.accumulators[i]===null?"?":step.accumulators[i]}</td>`).join("")}</tr></tbody></table></div><div class="tc-current-equation ${step.phase==="update"?"is-counted":""}">${step.phase==="update"?`${step.x} × (${step.previous}) + (${step.P[step.i]}) = ${step.p}`:step.p===null?`Start with P[${step.n}] = ${step.P[step.n]}`:step.result===null?`p ← ${step.p}`:`p(${step.x}) = ${step.result}`}</div></div>`;
}
export const hornerModule={
  id:"horner",shortTitle:"Horner’s rule",title:"Horner’s Rule",
  summary:"Replace explicit polynomial powers with a reusable multiply-and-add chain.",complexity:"n multiplications and n additions; Θ(n)",source:{slides:"10–22"},
  objective:"Trace the nested polynomial and retained accumulators while counting its n multiplications and n additions.",
  input:{label:"Coefficients, highest power first | x",hint:"Use 1–8 integer coefficients (−20 to 20), then | and an integer x (−10 to 10).",default:"2,-1,3,1,-5 | 3",presets:[
    {label:"Lecture: p(3)",value:"2,-1,3,1,-5 | 3"},{label:"Same polynomial at x = 0",value:"2,-1,3,1,-5 | 0"},{label:"Same polynomial at x = −3",value:"2,-1,3,1,-5 | -3"}
  ],parse:parseHornerInput},
  pseudocode:[{line:1,text:"p ← P[n]"},{line:2,text:"for i ← n − 1 downto 0 do"},{line:3,text:"p ← x ∗ p + P[i]",indent:1,basic:true,basicLabel:"one multiplication and one addition"},{line:4,text:"return p"}],
  buildTrace:buildHornerTrace,render:renderHorner,describe:describeHorner,
  metrics:step=>[{label:"Multiplications",value:step.multiplications,emphasis:true},{label:"Additions",value:step.additions}],
  model(step){return {latex:step.phase==="complete"?`M(n)=A(n)=\\sum_{i=0}^{n-1}1=n=${step.n}`:"p\\leftarrow x\\,p+P[i]",notes:[step.phase==="complete"?"A degree-n polynomial takes n multiplications and n additions, both in Θ(n) for growing n; a constant takes zero.":"Each update reuses p, multiplies it by x once, and adds the next coefficient once."]};},
  analysis:[{term:"Input size",value:"n is the polynomial degree; there are n+1 coefficients."},{term:"Index convention",value:"P[i] is the coefficient of x^i. The input and slide's table list highest degree first; parsing reverses them into P[0..n]."},{term:"Transformation",value:"Representation change: nested factorization replaces repeated explicit powers."},{term:"Counted operations",value:"Each p←x·p+P[i] executes one multiplication and one addition, including zero and unit operands. Initialization is an assignment."},{term:"Lecture example",value:"p(x)=2x⁴−x³+3x²+x−5 at x=3 yields running values 2,5,18,55,160."},{term:"Input convention",value:"The leading coefficient is nonzero unless the polynomial is constant, so n denotes the actual degree. Numeric limits keep these integer examples exact."}]
};
