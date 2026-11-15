import {escapeHtml as html} from "../../core/utils.js";
import {at,cellKey} from "./shared.js?v=20261114-1";

const shown=value=>value===null||value===undefined?"·":String(value);
const note=text=>`<div class="dp-note">${html(text)}</div>`;

export function renderGridPaths(step) {
  const hasOperands=step.above!==null,above=hasOperands?cellKey(step.i-1,step.j):null,left=hasOperands?cellKey(step.i,step.j-1):null;
  const table=`<div class="dp-scroll" data-visual-scroll><table class="dp-matrix dp-path-grid"><thead><tr><th>i ∖ j</th>${Array.from({length:step.columns+1},(_,j)=>`<th>${j}</th>`).join("")}</tr></thead><tbody>${Array.from({length:step.rows+1},(_,i)=>`<tr><th>${i}</th>${Array.from({length:step.columns+1},(_,j)=>{
    const key=cellKey(i,j),current=i===step.i&&j===step.j,wave=step.k!==null&&i+j===step.k,previous=step.k!==null&&i+j===step.k-1;
    return `<td data-grid-cell="${key}" data-value="${shown(at(step.F,i,j))}" class="${wave?"is-wave":""} ${previous?"is-previous-wave":""} ${key===above?"dp-source-skip":""} ${key===left?"dp-source-take":""} ${current?step.phase==="add"?"is-counted":"is-current":""} ${step.phase==="complete"&&i===step.rows&&j===step.columns?"is-answer":""}"${current?' data-active-visual':''}><span>${shown(at(step.F,i,j))}</span>${key===above?'<small>↑</small>':key===left?'<small>←</small>':""}</td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
  const explanation=hasOperands?`Above ${step.above} + left ${step.left} ${step.phase==="add"?"=":"→"} ${step.above+step.left}${step.phase==="read"?" (next addition)":""}`:
    step.phase==="complete"?`${step.result} ${step.result===1?"path":"paths"} to (${step.rows},${step.columns}).`:
    step.phase==="diagonal-end"?`Diagonal ${step.k} complete. The next diagonal can begin.`:
    step.phase==="boundary"||step.phase==="base"?"Boundary count = 1: there is only one route.":
    step.k===null?"Start at (0,0); move → or ↓. Each cell stores a path count.":`Diagonal ${step.k}: each addition reads diagonal ${step.k-1}.`;
  return `<div class="dp-board dp-grid-paths"><div class="dp-heading"><strong>${step.k===null?"Right/down paths":`Diagonal k = ${step.k}`}</strong><span>${step.k===null?`Destination (${step.rows},${step.columns})`:`i + j = ${step.k}`}</span></div>${table}${note(explanation)}<div class="dp-legend">Dashed cells: current diagonal. ↑ / ←: operands from the previous diagonal.</div></div>`;
}

export function renderMatrixChain(step) {
  const split=step.k!==null,back=step.phase.startsWith("recover")||step.phase==="complete",visited=new Set(step.visited);
  const leftKey=split?cellKey(step.i,step.k):null,rightKey=split?cellKey(step.k+1,step.j):null;
  const cards=`<div class="dp-scroll"><div class="dp-items dp-chain-items">${step.p.slice(1).map((columns,index)=>{
    const a=index+1,inLeft=split&&a>=step.i&&a<=step.k,inRight=split&&a>step.k&&a<=step.j;
    return `<div class="dp-item ${inLeft?"dp-chain-left":""} ${inRight?"dp-chain-right":""}" data-matrix="${a}" data-side="${inLeft?"left":inRight?"right":"none"}"><strong>${inLeft&&a===step.i?"L: ":inRight&&a===step.k+1?"R: ":""}A${a}</strong><span>${step.p[index]}×${columns}</span></div>`;
  }).join("")}</div></div>`;
  const table=`<div class="dp-scroll" data-visual-scroll><table class="dp-matrix dp-chain-table"><thead><tr><th>i ∖ j</th>${Array.from({length:step.n},(_,offset)=>`<th>${offset+1}</th>`).join("")}</tr></thead><tbody>${Array.from({length:step.n},(_,offset)=>{
    const i=offset+1;return `<tr><th>${i}</th>${Array.from({length:step.n},(_,column)=>{
      const j=column+1,key=cellKey(i,j),current=i===step.i&&j===step.j;
      if(j<i)return '<td class="dp-unused">—</td>';
      return `<td data-chain-cell="${key}" class="${key===leftKey?"dp-source-skip":""} ${key===rightKey?"dp-source-take":""} ${current?"is-current":""} ${back&&visited.has(key)?"is-path":""} ${step.phase==="complete"&&i===1&&j===step.n?"is-answer":""}"${current?' data-active-visual':''}><span>${shown(at(step.M,i,j))}</span>${back&&visited.has(key)?" <small>✓</small>":""}</td>`;
    }).join("")}</tr>`;
  }).join("")}</tbody></table></div>`;
  const candidates=step.candidate!==null?`<div class="dp-chain-costs"><div><span>Left M[${step.i},${step.k}]</span><b>${step.left}</b></div><div><span>Right M[${step.k+1},${step.j}]</span><b>${step.right}</b></div><div><span>Join ${step.p[step.i-1]}·${step.p[step.k]}·${step.p[step.j]}</span><b>${step.join}</b></div></div><div class="dp-chain-total" data-candidate="${step.candidate}">q = ${step.candidate} · best = ${step.best??"∞"}${step.phase==="compare"?step.improves?" · improves ✓":" · keep":step.phase==="choose"?" · retained ✓":""}</div>`:
    back?`<div class="dp-chain-expression">${html(step.expression)}</div>`:
    note(step.phase==="store"?`Saved split k=${step.bestK}; minimum ${step.best}.`:step.phase==="interval"?"Try every split; keep the least total cost.":"M[i,j] counts scalar multiplications for Ai…Aj.");
  return `<div class="dp-board dp-matrix-chain"><div class="dp-heading"><strong>${back?"Recover parentheses":step.length===null?"Single-matrix bases":`Length ${step.length} · [${step.i},${step.j}]`}</strong><span>${split?`Split k = ${step.k}`:"Order of matrices stays fixed"}</span></div>${cards}${table}<div class="dp-chain-work ${step.phase==="compare"?"is-counted":""}">${candidates}</div><div class="dp-legend">${back?"✓ entries: visited recovery intervals. Brackets: unexpanded chain.":"Solid L: left · Dashed R: right · Sum 3 costs."}</div></div>`;
}
