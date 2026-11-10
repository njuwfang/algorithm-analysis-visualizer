import {escapeHtml} from "../../core/utils.js";

function digits(item,d,p,complete) {
  const value=String(item.value).padStart(d,"0");
  if(complete)return `<span class="nc-verified-digits">${value}</span>`;
  if(p===null)return value;
  return `${p?`<span class="nc-msd-prefix">${value.slice(0,p)}</span>`:""}${p<d?`<span class="nc-digit">${value[p]}</span><span>${value.slice(p+1)}</span>`:""}`;
}

export function renderAmericanFlag(step) {
  const frame=step.frames.find(entry=>entry.id===step.activeId);
  const base=frame.hi-frame.lo<=1||frame.p===step.d;
  const heading=step.phase==="ready"?"One array · count, reserve ranges, then permute"
    :`Prefix ${frame.prefix||"*"} · A[${frame.lo}..${frame.hi-1}] · ${frame.p===step.d?"digits fixed":`${10**(step.d-frame.p-1)}s digit`}`;
  const table=frame.count===null?`<div class="nc-flag-placeholder">${base?"Base case: no counting or bucket bounds needed":"Count the current digit, then reserve bucket ranges"}</div>`
    :`<div class="nc-flag-table-scroll" data-visual-scroll><table class="nc-flag-table"><thead><tr><th>b</th>${frame.count.map((_,b)=>`<th class="${step.bucket===b?"is-action":""}">${b}</th>`).join("")}</tr></thead><tbody>${[["Count",frame.count],["Start",frame.start],["Next",frame.next],["End",frame.end]].map(([label,values])=>`<tr><th>${label}</th>${frame.count.map((count,b)=>{
      const active=label==="Count"&&step.phase==="count"&&step.bucket===b;
      const counted=label==="Next"&&step.exchange!==null&&step.exchange.digit===b;
      const value=values===null?"·":label!=="Count"&&count===0?"—":values[b];
      return `<td class="${active?"is-action":""} ${counted?"is-counted":""}" data-row="${label}" data-bucket="${b}">${value}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div>`;
  const cycle=frame.cycle;
  const relation=step.phase==="swap"?`Swap A[${step.exchange.i}] ↔ A[${step.exchange.j}]; advance Next[${step.exchange.digit}]`
    :step.phase==="probe"?`A[${step.index}] belongs to bucket ${step.probe.digit}${step.probe.digit===step.bucket?" · already fits":` → target A[${step.target}]`}`
    :step.phase==="settle"?`Advance Next[${step.bucket}] · ${cycle?.closed&&cycle.anchor===step.index?"cycle closed":"no swap needed"}`
    :step.phase==="count"?`Read A[${step.index}] → Count[${step.bucket}] = ${frame.count[step.bucket]}`
    :step.phase==="base"?"Base case → return without further swaps"
    :step.phase==="complete"?"✓ Sorted in A · equal-key order may change"
    :step.phase==="recurse"?`Recurse inside prefix ${step.frames.find(entry=>entry.id===step.recurseId).prefix}`
    :"End is excluded · Next marks the first unfilled slot";
  return `<div class="nc-visual nc-flag"><div class="nc-heading">${escapeHtml(heading)}</div>
    <div class="nc-flag-row"><div class="nc-flag-row-labels"><span></span><strong>A</strong><small>#</small><small>b</small></div><div class="nc-array-scroll" data-visual-scroll><div class="nc-flag-board" style="--nc-items:${step.a.length};--nc-cell:${Math.max(34,step.d*11+14)}px"><div class="nc-array">${step.a.map((item,index)=>{
      const i=index+1,inRange=i>=frame.lo&&i<frame.hi;
      const complete=step.frames.some(f=>f.status==="complete"&&i>=f.lo&&i<f.hi);
      const exchanged=step.exchange!==null&&[step.exchange.i,step.exchange.j].includes(i);
      const current=step.index===i;
      const target=step.phase==="probe"&&step.target===i&&!current;
      const label=step.exchange?.i===i||step.phase==="probe"&&current?`i=${i}`:step.exchange?.j===i||target?`j=${i}`:String(i);
      return `<div class="nc-cell ${exchanged?"is-counted":current?"is-action":""} ${target?"nc-flag-target":""}" data-index="${i}" data-origin="${item.origin}"${current?" data-active-visual":""}><small>${label}</small><b>${digits(item,step.d,inRange&&step.phase!=="ready"?frame.p:null,complete)}</b><small class="nc-origin">#${item.origin}</small></div>`;
    }).join("")}</div><div class="nc-flag-ranges">${frame.start===null?'<span style="grid-column:1/-1">Ranges appear after counting</span>':frame.count.map((count,b)=>count?`<span class="${frame.next[b]===frame.end[b]?"is-filled":""}" data-bucket="${b}" style="grid-column:${frame.start[b]}/span ${count}" title="Bucket ${b}: [${frame.start[b]},${frame.end[b]}); Next=${frame.next[b]}">${b}${frame.next[b]===frame.end[b]?" ✓":""}</span>`:"").join("")}</div></div></div></div>
    ${table}<div class="nc-flag-cycle"><strong>${cycle?.closed?"Last cycle":"Cycle"}:</strong><div data-visual-scroll>${cycle?cycle.slots.join(" → "):"—"}</div></div>
    <div class="nc-equation ${step.phase==="swap"?"is-counted":""}">${escapeHtml(relation)}</div></div>`;
}
