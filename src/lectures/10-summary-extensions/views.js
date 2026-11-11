import {escapeHtml as html} from "../../core/utils.js";
import {strategies} from "./reasoning-traces.js?v=20261110-1";
import {decisionNodes, decisionLeaves} from "./decision-trace.js?v=20261110-1";

export function arrayRow(label, items, {offset=0, current=[], counted=[], consumed=0, complete=false}={}) {
  const cellWidth=Math.max(38,...items.filter(Boolean).map(item=>String(item.value).length*10+String(item.id).length*7+16));
  return `<div class="sx-array-row"><strong>${html(label)}</strong><div class="sx-scroll" data-visual-scroll><div class="sx-array" style="--sx-n:${Math.max(1,items.length)};--sx-cell:${cellWidth}px">${items.length?items.map((item,i)=>`<div class="sx-cell ${current.includes(i)?"is-current":""} ${counted.includes(i)?"is-counted":""} ${i<consumed?"is-used":""} ${complete?"is-valid":""}" data-index="${i+offset}" data-record="${item?.id??"hole"}" data-value="${item?.value??"hole"}"><small>${i+offset}</small><b><span>${item?.value??"□"}</span>${item?`<small>#${item.id}</small>`:""}</b></div>`).join(""):'<span class="sx-empty">empty</span>'}</div></div></div>`;
}
const box=(text,kind="")=>`<div class="sx-note ${kind}">${html(text)}</div>`;

export function renderConnections(step) {
  const flows={"binary-search":["n keys","one half","one half again"],mergesort:["n keys","two sorted halves","merge"],horner:["explicit powers","nested form","reuse p"],"counting-sort":["Count","Pos","stable A′"],"american-flag":["counts → ranges","cycles","recurse"]};
  return `<div class="sx-board sx-connections"><div class="sx-heading"><strong>${html(step.example.title)}</strong><span>n = ${step.n}${step.parameter===null?"":` · ${step.method==="counting-sort"?"M":"d"} = ${step.parameter}`}</span></div><ol class="sx-strategies">${strategies.map(strategy=>{
    const active=step.stage>=1&&[step.example.family,step.example.secondary].includes(strategy.id);
    return `<li class="${active?"is-current":""}" data-family="${strategy.id}"><strong>${html(strategy.title)}</strong><small>${html(strategy.examples)}</small></li>`;
  }).join("")}</ol><div class="sx-flow">${flows[step.method].map(text=>`<span>${html(text)}</span>`).join('<b aria-hidden="true">→</b>')}</div>${box(step.stage>=2?step.example.operation:"Follow what the algorithm keeps, changes, or knows about its keys.",step.stage>=2?"is-current":"")}</div>`;
}

export function renderInsertion(step) {
  const n=step.a.length, removed=step.phase==="shift"?step.removed:null;
  const pairs=new Set(step.remaining.map(pair=>`${pair.i}:${pair.j}`));
  const matrix=`<div class="sx-scroll" data-visual-scroll><table class="sx-inversion-grid"><caption>Earlier index i ↓ · later index j →</caption><thead><tr><th>i/j</th>${step.logical.map((_,j)=>`<th>${j}</th>`).join("")}</tr></thead><tbody>${step.logical.map((_,i)=>`<tr><th>${i}</th>${step.logical.map((_,j)=>{
    const drop=removed&&removed.i===i&&removed.j===j, inversion=pairs.has(`${i}:${j}`);
    return `<td class="${j<=i?"is-outside":""} ${inversion?"is-inversion":""} ${drop?"is-counted":""}" data-pair="${i}:${j}">${j<=i?"":drop?"✓":inversion?"×":"·"}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
  return `<div class="sx-board sx-insertion">${arrayRow("A",step.a,{current:[step.j,step.hole],counted:removed?[removed.i,removed.j]:[],complete:step.phase==="complete"})}<div class="sx-held">Held key: <b>${step.held?`${step.held.value} (#${step.held.id})`:"none"}</b><span>${step.held?"Read □ as this key in the pair grid.":"× = inversion; · = ordered pair"}</span></div>${matrix}<div class="sx-legend">${removed?`✓ removed: ${removed.left.value} > ${removed.right.value}`:step.phase==="complete"?"✓ Every earlier key is at most every later key.":`${n} keys · equal values form no inversion`}</div></div>`;
}

function rangeTree(step) {
  const n=step.a.length, levels=Math.max(...step.frames.map(frame=>frame.depth))+1;
  return `<div class="sx-scroll" data-visual-scroll><div class="sx-range-tree" style="--sx-n:${n};--sx-levels:${levels};--sx-tree-cell:${n>=10?48:40}px">${step.frames.map(frame=>`<div class="sx-range ${frame.id===step.activeId?"is-current":""} ${frame.status==="complete"?"is-valid":""} ${frame.status==="insertion"?"is-leaf":""}" style="grid-column:${frame.lo+1}/span ${frame.hi-frame.lo};grid-row:${frame.depth+1}" data-call="${frame.id}" data-status="${frame.status}">${frame.status==="complete"?"✓ ":""}${frame.lo}:${frame.hi}</div>`).join("")}</div></div>`;
}
export function renderMerge(step) {
  const frame=step.frames[step.activeId], compare=step.phase==="merge-compare", batch=step.phase==="take-right"&&!step.hybrid;
  const leftCurrent=frame.leftUsed<frame.left.length?[frame.leftUsed]:[],rightCurrent=frame.rightUsed<frame.right.length?[frame.rightUsed]:[];
  const leftCounted=batch?frame.left.map((_,i)=>i).filter(i=>i>=frame.leftUsed):compare&&step.hybrid?leftCurrent:[];
  const rightCounted=batch?[frame.rightUsed-1]:compare&&step.hybrid?rightCurrent:[];
  const inserting=step.held!==null;
  let note="Ranges are [lo:hi); hi is excluded. ✓ marks a returned sorted range.";
  if(batch)note=`${frame.batch[0].right.value} is smaller than all ${frame.batch.length} remaining left keys: count the whole batch.`;
  if(inserting)note=`Held ${step.held.value} (#${step.held.id}); □ is its insertion position. Shift within this leaf only.`;
  if(step.phase==="complete"&&step.hybrid)note=`Key comparisons: hybrid ${step.comparisons}; standard ${step.baseline}. Same input.`;
  if(step.phase==="complete"&&!step.hybrid)note="Left, right, and cross pairs are disjoint; every original inversion is counted once.";
  return `<div class="sx-board sx-merge">${arrayRow("A",step.a,{current:inserting?[step.scan,step.hole]:[],counted:step.phase==="insertion-compare"?[step.scan,step.hole]:[],complete:step.phase==="complete"})}${rangeTree(step)}<div class="sx-queues">${arrayRow("L",frame.left,{current:compare?leftCurrent:[],counted:leftCounted,consumed:frame.leftUsed})}${arrayRow("R",frame.right,{current:compare?rightCurrent:[],counted:rightCounted,consumed:frame.rightUsed})}</div>${arrayRow("Out",frame.out,{complete:frame.status==="complete"})}${box(note,batch||step.phase==="insertion-compare"||compare&&step.hybrid?"is-counted":"")}</div>`;
}

const positions={root:[300,15.5],left:[150,46.5],right:[450,46.5],"left-deep":[200,77.5],"right-deep":[500,77.5],...Object.fromEntries(decisionLeaves.map((leaf,i)=>[leaf,[50+i*100,108.5]]))};
export function renderDecision(step) {
  const path=new Set(step.answers.map(answer=>answer.id)), bound=["capacity","complete"].includes(step.phase);
  const edges=decisionNodes.flatMap(node=>[node.yes,node.no].map(child=>{
    const from=positions[node.id],to=positions[child];
    return `<path d="M ${from[0]} ${from[1]+9} L ${to[0]} ${to[1]-9}"/>`;
  })).join("");
  const nodes=decisionNodes.map(node=>`<div class="sx-decision-node ${path.has(node.id)?"is-visited":""} ${step.current?.id===node.id?"is-counted":""}" style="grid-column:${node.column}/span ${node.span};grid-row:${node.row}" data-question="${node.id}">A${node.a}&lt;A${node.b}</div>`).join("");
  const leaves=decisionLeaves.map((leaf,i)=>`<div class="sx-decision-leaf ${step.candidates.includes(leaf)?"is-possible":"is-rejected"} ${step.result?.join("")===leaf?"is-valid":""}" style="grid-column:${i+1};grid-row:4" data-order="${leaf}">${step.candidates.includes(leaf)?"":"× "}${leaf}</div>`).join("");
  return `<div class="sx-board sx-decision">${arrayRow("Keys",step.original)}<div class="sx-scroll" data-visual-scroll><div class="sx-decision-tree"><svg viewBox="0 0 600 124" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>${nodes}${leaves}</div></div><div class="sx-legend">True → left; false → right. Leaf 201 means A2 &lt; A0 &lt; A1.</div>${bound?'<div class="sx-capacities"><span>h=1<br>2 leaves</span><span class="is-invalid">h=2<br>4 &lt; 6</span><span class="is-valid">h=3<br>8 ≥ 6</span></div>':box("Follow comparisons until one of the six relative orders remains.")}</div>`;
}

export function renderSelection(step) {
  const labels=["Task","Data","Property"],texts={
    disorder:["Sort one batch","I inversions; compare n and I","Stable ties: shift only larger keys"],
    range:["Sort integer records","Keys 1..M; buffer allowed","Preserve records and equal-key order"],
    stable:["Sort records by key","Comparisons + output buffer","Equal keys retain arrival order"],
    updates:["Insert and search repeatedly","n distinct keys; new arrivals","BST order + AVL balance"]
  }[step.kind];
  const reveal=["candidate","justify","complete"].includes(step.phase);
  return `<div class="sx-board"><div class="sx-heading"><strong>${html(step.example.title)}</strong><span>${step.checked>=2?step.kind==="disorder"?`n=${step.n}, I=${step.inversions}`:step.kind==="range"?`n=${step.n}, M=${step.range}`:`n=${step.n}`:"Inspect the case"}</span></div>${arrayRow("Input",step.original)}<ol class="sx-criteria">${labels.map((label,i)=>`<li class="${step.checked>i?"is-valid":""}"><strong>${step.checked>i?"✓":"·"} ${label}</strong><span>${step.checked>i?html(texts[i]):"Not examined"}</span></li>`).join("")}</ol>${box(reveal?`One suitable candidate: ${step.example.candidate}`:"Before Next: write a candidate and one assumption that makes it suitable.",reveal?"is-current":"")}</div>`;
}
