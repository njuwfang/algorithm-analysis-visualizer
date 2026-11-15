import {escapeHtml as html} from "../../core/utils.js";
import {at,cellKey} from "./shared.js?v=20261114-1";

const shown=value=>value===null||value===undefined?"·":String(value);
const note=(text,kind="")=>`<div class="dp-note ${kind}">${html(text)}</div>`;
function rowTable(F,coins=null,{current=null,sources=[],counted=false,selected=[]}={}) {
  const n=F.length, columns=Array.from({length:n},(_,i)=>i);
  const cellWidth=Math.max(34,...F.filter(value=>value!==null).map(value=>String(value).length*10+10));
  return `<div class="dp-scroll" data-visual-scroll><table class="dp-row-table" style="min-width:${24+n*cellWidth}px"><thead><tr><th>i</th>${columns.map(i=>`<th>${i}</th>`).join("")}</tr></thead><tbody>${coins?`<tr><th>cᵢ</th>${columns.map(i=>`<td>${i===0?"—":coins[i-1]}</td>`).join("")}</tr>`:""}<tr><th>F</th>${F.map((value,i)=>`<td data-f="${i}" class="${sources.includes(i)?"is-source":""} ${i===current?counted?"is-counted":"is-current":""} ${selected.includes(i)?"is-picked":""}"${i===current?' data-active-visual':''}>${shown(value)}</td>`).join("")}</tr></tbody></table></div>`;
}
function choices(skip,take,skipLabel,takeLabel,which=null,unavailable=false) {
  return `<div class="dp-choices"><div class="dp-option dp-skip ${which==="skip"?"is-winner":""}"><strong>Skip ${which==="skip"?"✓":""}</strong><span>${html(skipLabel)}</span><b>${shown(skip)}</b></div><div class="dp-option dp-take ${which==="take"?"is-winner":""}"><strong>Take ${which==="take"?"✓":""}</strong><span>${html(takeLabel)}</span><b>${unavailable?"—":shown(take)}</b></div></div>`;
}

export function renderFibonacciBottomUp(step) {
  const updating=step.phase==="add",retained=step.phase==="complete"&&step.n>=2;
  const displayIndex=updating?step.i:retained?step.n:null;
  const current=updating?step.i:step.phase==="base-zero"?0:step.phase==="base-one"?1:step.phase==="complete"?step.n:null;
  const sources=displayIndex===null?[]:[displayIndex-1,displayIndex-2];
  const formula=displayIndex!==null?`Read F[${displayIndex-1}]=${step.F[displayIndex-1]} and F[${displayIndex-2}]=${step.F[displayIndex-2]}.`:step.result===null?"Initialize bases, then move from left to right.":`Return F[${step.n}]=${step.result}`;
  return `<div class="dp-board"><div class="dp-heading"><strong>Target F(${step.n})</strong><span>Record each smaller answer once</span></div>${rowTable(step.F,null,{current,sources,counted:updating})}<div class="dp-addition">${displayIndex!==null?`<span>${step.F[displayIndex-1]}</span><b>+</b><span>${step.F[displayIndex-2]}</span><b>→</b><span class="${updating?"is-counted":"is-saved"}">${step.F[displayIndex]}</span>`:'<span>F[0]=0</span><span>F[1]=1</span>'}</div>${note(formula,updating?"is-counted":"")}<div class="dp-legend">Outlined cells are reused operands; · means not computed.</div></div>`;
}

export function renderFibonacciRecursive(step) {
  const current=step.activeId===null?null:step.nodes[step.activeId],width=step.leaves*34,levels=Math.max(1,step.n),height=levels*30;
  const position=node=>[(node.start+node.span/2)*34,node.depth*30+14];
  const edges=step.nodes.filter(node=>node.parent!==null).map(node=>{const from=position(step.nodes[node.parent]),to=position(node);return `<path d="M${from[0]},${from[1]+12} L${to[0]},${to[1]-12}"/>`;}).join("");
  const nodes=step.nodes.map(node=>{
    const repeated=(step.phase==="complete"||current&&node.k===current.k)&&step.nodes.filter(other=>other.k===node.k).length>1;
    return `<div class="dp-fib-call ${node.id===step.activeId?"is-current":""} ${node.id===step.activeId&&step.phase==="add"?"is-counted":""} ${repeated?"is-repeat":""} ${node.result!==null?"is-returned":""}" style="left:${position(node)[0]}px;top:${node.depth*30}px" data-call="${node.id}" data-k="${node.k}" data-result="${shown(node.result)}"${node.id===step.activeId?' data-active-visual':''}><b>F${node.k}</b><span>${shown(node.result)}</span></div>`;
  }).join("")||`<div class="dp-fib-call is-pending" style="left:${width/2}px;top:0"><b>F${step.n}</b><span>·</span></div>`;
  const equation=current&&current.a!==null&&current.b!==null?`${current.a} + ${current.b}${current.result===null?" → next addition":` = ${current.result}`}`:current?.result!==null&&current?.k<=1?`F(${current.k})=${current.result} is a base case.`:step.phase==="ready"?"The root call has not started yet.":"Retain each returned operand in its caller.";
  return `<div class="dp-board dp-fib-recursive"><div class="dp-heading"><strong>Target F(${step.n})</strong><span>Each box is a separate call</span></div><div class="dp-scroll" data-visual-scroll><div class="dp-fib-tree" style="width:${width}px;height:${height}px"><svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${edges}</svg>${nodes}</div></div>${note(equation,step.phase==="add"?"is-counted":"")}<div class="dp-legend">Double outline: repeated F(k). Numbers are returned results.</div></div>`;
}

export function renderCoinRow(step) {
  const back=step.phase.startsWith("traceback")||step.phase==="complete";
  const focus=step.i??(step.path.at(-1)?.from??null),sources=step.i===null?[]:[step.i-1,step.i-2];
  const coinStrip=`<div class="dp-scroll"><div class="dp-coins">${step.coins.map((value,index)=>`<div class="dp-coin ${index+1===focus?"is-current":""} ${step.selected.includes(index+1)?"is-picked":""}" data-coin="${index+1}"><small>${index+1}</small><b>${step.selected.includes(index+1)?"✓ ":""}${value}</b></div>`).join("")}</div></div>`;
  const retained=step.i!==null&&step.phase==="choose"?step.choices[step.i]:null;
  const cards=step.take!==null?choices(step.skip,step.take,`F[${step.i-1}]`,`c[${step.i}] + F[${step.i-2}]`,retained):note(back?`Chosen positions: ${[...step.selected].sort((a,b)=>a-b).join(", ")||"none yet"}`:"Separate selections into skipping the last coin or taking it and excluding its neighbor.");
  return `<div class="dp-board">${coinStrip}${rowTable(step.F,step.coins,{current:step.i,sources,counted:step.phase==="choose"})}${cards}<div class="dp-legend">${back?`Recovery: ${step.selected.join(" → ")||"not selected yet"}${step.cursor===null?"":` · remaining prefix ${step.cursor}`}`:"Take uses F[i−2]; skip uses F[i−1]. Coin positions start at 1."}</div></div>`;
}

export function renderKnapsack(step) {
  const focused=step.i!==null,nonbase=focused&&step.i>0&&step.j>0&&step.phase!=="cache-hit",item=nonbase?step.items[step.i-1]:null;
  const skipKey=nonbase?cellKey(step.i-1,step.j):null,takeKey=nonbase&&item.weight<=step.j?cellKey(step.i-1,step.j-item.weight):null;
  const recovered=new Set(step.path.flatMap(edge=>[cellKey(edge.i,edge.j),cellKey(edge.nextI,edge.nextJ)]));
  const items=`<div class="dp-scroll"><div class="dp-items">${step.items.map((entry,index)=>`<div class="dp-item ${step.i===index+1?"is-current":""} ${step.selected.includes(index+1)?"is-picked":""}" data-item="${index+1}"><strong>${step.selected.includes(index+1)?"✓ ":""}#${index+1}</strong><span>w${entry.weight} · v${entry.value}</span></div>`).join("")}</div></div>`;
  const table=`<div class="dp-scroll" data-visual-scroll><table class="dp-matrix"><thead><tr><th>i ∖ j</th>${Array.from({length:step.capacity+1},(_,j)=>`<th>${j}</th>`).join("")}</tr></thead><tbody>${Array.from({length:step.n+1},(_,i)=>`<tr><th>${i}</th>${Array.from({length:step.capacity+1},(_,j)=>{
    const key=cellKey(i,j),target=step.i===i&&step.j===j,value=at(step.F,i,j);
    return `<td data-state="${key}" class="${target?step.phase==="store"?"is-counted":"is-current":""} ${key===skipKey?"dp-source-skip":""} ${key===takeKey?"dp-source-take":""} ${recovered.has(key)?"is-path":""} ${target&&step.phase==="cache-hit"?"is-reused":""} ${step.phase==="complete"&&i===step.n&&j===step.capacity?"is-answer":""}"${target?' data-active-visual':''}>${shown(value)}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
  const isStore=step.phase==="store"||step.phase.startsWith("traceback-");
  const winner=isStore&&nonbase&&step.skip!==null?step.take!==null&&step.take>step.skip?"take":"skip":null;
  const cards=nonbase?choices(step.skip,step.take,`F[${step.i-1},${step.j}]`,takeKey?`${item.value}+F[${step.i-1},${step.j-item.weight}]`:`w${item.weight}>j${step.j}`,winner,item.weight>step.j):note(step.phase==="cache-hit"?`Saved F[${step.i},${step.j}]=${at(step.F,step.i,step.j)}; return immediately.`:step.result===null?"F[i,j]: best value from the first i items at capacity j.":`Chosen items: ${[...step.selected].sort((a,b)=>a-b).join(", ")||"none"} · value ${step.result}`);
  const stack=step.memoized?`<div class="dp-stack dp-scroll">Calls i:j: ${step.stack.length?step.stack.map(id=>{const frame=step.frames[id];return `${frame.i}:${frame.j}`;}).join("→"):"none active"}</div>`:"";
  const footer=step.phase==="cache-hit"?"Double outline: reuse a saved answer.":step.cursor?`Recovery: ${step.selected.join(" → ")||"none yet"} · next F[${step.cursor.i},${step.cursor.j}]`:"Solid: skip · Dashed: take · Dot: unknown";
  return `<div class="dp-board dp-knapsack">${items}${stack}${table}${cards}<div class="dp-legend">${html(footer)}</div></div>`;
}
