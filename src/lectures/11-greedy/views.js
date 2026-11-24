import {escapeHtml as html} from "../../core/utils.js";
import {shown,edgeKey,list} from "./shared.js?v=20261124-1";

const note=(text,kind="")=>`<div class="gg-note ${kind}">${html(text)}</div>`;
function coinStrip(coins,current=null) {
  return `<div class="gg-scroll"><div class="gg-coins">${coins.map(coin=>`<span class="gg-coin ${coin===current?"is-current":""}" data-coin="${coin}">${coin}</span>`).join("")}</div></div>`;
}
function selection(coins) {
  const groups=[];for(const coin of coins){const last=groups.at(-1);if(last?.coin===coin)last.count+=1;else groups.push({coin,count:1});}
  return `<div class="gg-picked">${groups.map(({coin,count})=>`<span>✓ ${count>1?`${count} × `:""}${coin}</span>`).join("")||"none yet"}</div>`;
}
export function renderChangeDP(s) {
  const recovery=s.phase.startsWith("recover")||s.phase==="complete",current=s.phase==="complete"?s.money:s.amount??(s.phase==="base"?0:s.recover);
  const table=`<div class="gg-scroll" data-visual-scroll><table class="gg-table gg-change-table"><thead><tr><th>money</th>${s.F.map((_,i)=>`<th>${i}</th>`).join("")}</tr></thead><tbody><tr><th>Min</th>${s.F.map((v,i)=>`<td data-change-cell="${i}" class="${i===current?s.phase==="store"||s.phase==="complete"?"is-saved":"is-current":""} ${i===s.dependency?"is-source":""}"${i===current?' data-active-visual':''}>${i>s.savedThrough?"·":shown(v)}</td>`).join("")}</tr></tbody></table></div>`;
  const candidates=s.dependency!==null?`<div class="gg-candidate ${s.phase==="compare"?"is-counted":""}"><span>Coin ${s.coin} + saved answer</span><strong>Min[${s.dependency}] + 1 = ${shown(s.candidate)}</strong><span>best = ${shown(s.best)}${s.phase==="compare"?s.improves?" · improves ✓":" · keep":""}</span></div>`:
    recovery?`<div class="gg-result"><strong>${s.result===null?"No exact change":`Minimum ${s.result} coins`}</strong>${selection(s.selected)}</div>`:
    note(s.phase==="too-large"?`Coin ${s.coin} > money ${s.amount}: skip.`:s.phase==="store"?`Saved Min[${s.amount}]=${shown(s.best)}${s.bestCoin===null?"":` · last coin ${s.bestCoin}`}.`:"Try each possible last coin; reuse the smaller amount's answer.");
  return `<div class="gg-board"><div class="gg-heading"><strong>${recovery?"Recover change":s.amount===null?`Target money ${s.money}`:`Money ${s.amount}`}</strong><span>Unlimited coin supply</span></div>${coinStrip(s.coins,s.coin)}${table}${candidates}<div class="gg-legend">Outlined Min cell: saved dependency. · uncomputed · ∞ unreachable.</div></div>`;
}
export function renderGreedyChange(s) {
  const complete=s.reference!==null,optimal=complete&&s.remaining===0&&s.selected.length===s.reference.count;
  const reference=complete?`<div class="gg-reference ${optimal?"is-valid":s.reference.count===null?"":"is-invalid"}"><strong>${optimal?"✓ Matches minimum":s.reference.count===null?"No exact change exists":"× Greedy misses minimum"}</strong><span>DP: ${s.reference.count===null?"no exact solution":`${s.reference.selected.join(" + ")||"none"} · ${s.reference.count} coins`}</span></div>`:note(s.phase==="test"?`${s.coin} ≤ ${s.remaining}? ${s.fits?"Yes — take this coin next.":"No — try a smaller coin."}`:s.phase==="take"?`Committed ${s.coin}. This choice stays.`:"Choose the largest denomination that fits the remainder.",s.phase==="test"?"is-counted":"");
  return `<div class="gg-board"><div class="gg-heading"><strong>Money ${s.money}</strong><span>Largest fitting coin first</span></div>${coinStrip(s.phase==="ready"?s.inputCoins:s.coins,s.coin)}<div class="gg-money"><div><span>Committed sum</span><strong>${s.money-s.remaining}</strong></div><b>+</b><div><span>Remaining</span><strong data-remainder>${s.remaining}</strong></div><b>= ${s.money}</b></div>${selection(s.selected)}${reference}<div class="gg-legend">✓ coins are committed. The DP comparison appears after greedy finishes.</div></div>`;
}

function geometry(vertices) {
  const id=vertices.join("");
  if(id==="abcdef")return {width:360,height:174,positions:{a:[24,84],b:[96,24],c:[264,24],d:[336,84],e:[180,150],f:[180,84]},labels:{ab:[51,47],af:[102,84],ae:[92,124],bc:[180,19],bf:[136,45],cf:[224,45],cd:[309,47],df:[258,84],de:[275,124],ef:[193,118]}};
  if(id==="abcd")return {width:360,height:174,positions:{a:[60,28],b:[300,28],c:[60,145],d:[300,145]},labels:{ab:[180,20],ac:[44,87],ad:[187,77],cd:[180,153]}};
  if(id==="abcde")return {width:360,height:174,positions:{a:[24,140],b:[96,30],c:[264,30],d:[180,140],e:[336,140]},labels:{ab:[51,82],ad:[102,148],bc:[180,24],bd:[143,80],cd:[217,80],ce:[309,82],de:[258,148]}};
  if(id==="abcdefghijkl")return {width:420,height:300,positions:{a:[90,24],b:[330,24],c:[24,104],d:[90,104],e:[330,104],f:[396,104],g:[24,200],h:[90,200],i:[330,200],j:[396,200],k:[90,276],l:[330,276]},labels:{}};
  const width=360,height=vertices.length>8?260:174,radius=vertices.length===1?0:Math.min(width*.39,height*.37),cy=height/2;
  return {width,height,positions:Object.fromEntries(vertices.map((v,index)=>{const angle=-Math.PI/2+2*Math.PI*index/vertices.length;return [v,[width/2+radius*Math.cos(angle),cy+radius*Math.sin(angle)]];})),labels:{}};
}
function graph(s) {
  const layout=geometry(s.vertices),{width,height,positions}=layout,large=s.vertices.length>8;
  const witness=new Set(s.witness?.slice(1).map((v,i)=>edgeKey(s.witness[i],v))??[]);
  const tree=s.tree??[],groupIndex=v=>s.groups?.findIndex(g=>g.includes(v))??null;
  const lines=s.edges.map(e=>{
    const [x1,y1]=positions[e.u],[x2,y2]=positions[e.v],dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy);
    const [lx,ly]=layout.labels[e.key]??[(x1+x2)/2-10*dy/length,(y1+y2)/2+10*dx/length];
    const accepted=s.accepted.includes(e.key),rejected=s.rejected?.includes(e.key)??false,current=s.edge===e.key,
      crossing=s.algorithm==="prim"&&tree.includes(e.u)!==tree.includes(e.v),path=witness.has(e.key);
    return `<g class="gg-edge ${accepted?"is-accepted":""} ${rejected?"is-rejected":""} ${crossing?"is-crossing":""} ${path?"is-witness":""} ${current?"is-current":""} ${current&&s.phase.includes("test")?"is-counted":""}" data-edge="${e.key}" data-weight="${e.weight}" data-accepted="${accepted}" data-rejected="${rejected}" data-crossing="${crossing}" data-witness="${path}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><g transform="translate(${lx},${ly})"><rect x="-17" y="-10" width="34" height="20"/><text text-anchor="middle" dominant-baseline="central">${e.weight}${accepted?"✓":rejected?"×":""}</text></g></g>`;
  }).join("");
  const nodes=s.vertices.map(v=>{const [x,y]=positions[v],inside=tree.includes(v),active=s.focus===v||s.current===v;
    return `<g class="gg-vertex ${inside?"is-in-tree":""} ${active?"is-current":""} ${s.focus===v&&s.phase.includes("test")?"is-counted":""}" transform="translate(${x},${y})" data-vertex="${v}" data-in-tree="${inside}" data-component="${groupIndex(v)??"none"}"${s.algorithm==="prim"&&v===(s.focus??s.current)?' data-active-visual':''}><circle r="13"/><text text-anchor="middle" dominant-baseline="central">${v}</text>${inside?'<text class="gg-check" x="14" y="-10">✓</text>':""}</g>`;
  }).join("");
  return `<div class="gg-scroll gg-graph-scroll" data-visual-scroll><svg class="gg-graph ${large?"is-large":""}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="gg-${s.algorithm}-title gg-${s.algorithm}-desc"><title id="gg-${s.algorithm}-title">${s.algorithm==="prim"?"Prim tree and crossing edges":"Kruskal forest and current edge"}</title><desc id="gg-${s.algorithm}-desc">${html(s.message)}</desc>${lines}${nodes}</svg></div>`;
}
export function renderPrim(s) {
  const table=`<div class="gg-scroll" data-visual-scroll><table class="gg-table gg-labels"><thead><tr><th>u</th>${s.vertices.map(v=>`<th>${v}</th>`).join("")}</tr></thead><tbody><tr><th>parent,w</th>${s.vertices.map(v=>`<td data-label="${v}" class="${s.tree.includes(v)?"is-saved":""} ${s.focus===v?"is-current":""}">${s.tree.includes(v)?"✓":`${s.labels[v].parent??"—"},${shown(s.labels[v].weight)}`}</td>`).join("")}</tr></tbody></table></div>`;
  return `<div class="gg-board gg-mst"><div class="gg-heading"><strong>Vₜ: ${s.tree.join(", ")||"∅"}</strong><span>Weight ${s.total}</span></div>${graph(s)}${table}<div class="gg-legend">✓ tree · Dashed: crossing edge · Labels: parent, edge weight</div></div>`;
}
export function renderKruskal(s) {
  const order=s.phase==="ready"?s.edges:s.sorted;
  const queue=`<div class="gg-scroll" data-visual-scroll><div class="gg-edge-queue">${order.map(e=>{
    const kept=s.accepted.includes(e.key),rejected=s.rejected.includes(e.key),active=s.edge===e.key;
    return `<span class="gg-edge-chip ${kept?"is-saved":""} ${rejected?"is-rejected":""} ${active?"is-current":""} ${active&&s.phase==="cycle-test"?"is-counted":""}" data-queue-edge="${e.key}"${active?' data-active-visual':''}><strong>${kept?"✓":rejected?"×":""}${e.key}</strong><span>${e.weight}</span></span>`;
  }).join("")}</div></div>`;
  return `<div class="gg-board gg-mst"><div class="gg-heading"><strong>Eₜ: ${s.accepted.length}/${s.vertices.length-1} edges</strong><span>Weight ${s.total}</span></div>${graph(s)}${queue}<div class="gg-component-list">Components: ${s.groups.map(group=>`{${group.join(",")}}`).join(" ")}</div><div class="gg-legend">✓ kept · × cycle · ${s.witness.length?`Path ${s.witness.join("→")}`:"Unmarked: unexamined"}</div></div>`;
}
