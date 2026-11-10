import { escapeHtml } from "../../core/utils.js";
import { msdFrontier } from "./msd-trace.js?v=20261109-1";

function msdKey(item,d,p,current=null,complete=false) {
  const value=String(item.value).padStart(d,"0");
  if(complete)return `<span class="nc-verified-digits">${value}</span>`;
  return `${p?`<span class="nc-msd-prefix">${value.slice(0,p)}</span>`:""}${current===p&&p<d?`<span class="nc-digit">${value[p]}</span><span>${value.slice(p+1)}</span>`:`<span>${value.slice(p)}</span>`}`;
}

function renderPrefixTree(step) {
  const n=step.original.length,cell=Math.max(36,step.d*8+18),rows=Math.max(...step.nodes.map(node=>node.p))+1;
  const nodeX=node=>(node.start+node.items.length/2)/n*1000;
  const edges=step.nodes.filter(node=>node.parent!==null).map(node=>{
    const parent=step.nodes.find(entry=>entry.id===node.parent);
    return `<path d="M ${nodeX(parent)} ${parent.p*22+18} L ${nodeX(node)} ${node.p*22}"/>`;
  }).join("");
  return `<div class="nc-msd-tree-scroll" data-visual-scroll><div class="nc-msd-tree" style="--nc-items:${n};--nc-levels:${rows};--nc-tree-width:${n*cell}px"><svg viewBox="0 0 1000 ${rows*22}" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>${step.nodes.map(node=>{
    const active=node.id===step.activeId,counted=active&&step.phase==="inspect",next=node.id===step.nextId;
    return `<div class="nc-msd-node ${active?"is-active":""} ${counted?"is-counted":""} ${next?"is-next":""} ${node.status==="complete"?"is-complete":""}" data-node="${node.id}" style="grid-column:${node.start+1}/span ${node.items.length};grid-row:${node.p+1}" title="Prefix ${node.prefix||"empty"}; A[${node.start+1}..${node.start+node.items.length}]; ${node.status}"${active&&!["inspect","enqueue"].includes(step.phase)?" data-active-visual":""}>${node.prefix}${node.p<step.d?"*":""}${node.status==="complete"?" ✓":""}</div>`;
  }).join("")}</div></div>`;
}

export function renderMsd(step) {
  const node=step.nodes.find(entry=>entry.id===step.activeId),frontier=msdFrontier(step),activeKey=["inspect","enqueue"].includes(step.phase)?step.current?.origin:null;
  const currentDigit=node.p<step.d?10**(step.d-node.p-1):null;
  const heading=step.phase==="ready"?"Most significant digit first · * = unfixed digits"
    :node.status==="complete"?`✓ Prefix ${node.prefix||"*"} sorted · ${node.items.length} key${node.items.length===1?"":"s"}`
    :`Prefix ${node.prefix||"*"} · next ${currentDigit}s digit · ${node.items.length} keys`;
  const relation=step.phase==="complete"?"✓ All prefix groups returned in digit order"
    :step.phase==="inspect"?`Read ${String(step.current.value).padStart(step.d,"0")}, digit ${node.p+1} from the left → ${step.digit}`
    :step.phase==="enqueue"?`Append ${step.current.value} to bin ${step.digit} inside prefix ${node.prefix||"*"}`
    :step.phase==="base"?node.items.length===1?"One key → stop; no remaining digit inspections":"No unfixed digits → stop; equal keys keep arrival order"
    :step.phase==="recurse"?`Recurse into prefix ${step.nodes.find(entry=>entry.id===step.nextId).prefix}; other groups stay put`
    :step.phase==="return"||step.phase==="child-return"?"Retain the sorted child results; no comparison merge"
    :"Fix one leading digit, then refine each nonempty group";
  let nonempty=node.status==="complete"?[]:node.bins?.map((items,digit)=>({items,digit})).filter(bin=>bin.items.length)??[];
  if(step.phase==="child-return")nonempty=nonempty.filter(bin=>bin.digit===step.digit);
  if(step.phase==="recurse")nonempty=nonempty.filter(bin=>bin.digit===Number(step.nodes.find(entry=>entry.id===step.nextId).prefix.at(-1)));
  return `<div class="nc-visual nc-msd"><div class="nc-heading">${escapeHtml(heading)}</div>${renderPrefixTree(step)}
    <div class="nc-array-row"><strong>A</strong><div class="nc-array-scroll" data-visual-scroll><div class="nc-array" style="--nc-items:${frontier.length};--nc-cell:${Math.max(32,step.d*11+12)}px">${frontier.map((item,index)=>{
      const inRange=index>=node.start&&index<node.start+node.items.length;
      const focusing=inRange&&["enter","initialize-bins","inspect","enqueue"].includes(step.phase)&&node.result===null;
      return `<div class="nc-cell ${activeKey===item.origin?step.phase==="inspect"?"is-counted":"is-action":""} ${inRange?"nc-in-range":""}" data-origin="${item.origin}"${activeKey===item.origin?" data-active-visual":""}><small>${index+1}</small><b>${msdKey(item,step.d,focusing?node.p:item.prefixLength,focusing?node.p:null,item.complete)}</b></div>`;
    }).join("")}</div></div></div>
    <div class="nc-msd-buckets">${nonempty.length?nonempty.map(bin=>`<div class="nc-msd-bucket ${step.digit===bin.digit?"is-active":""}" data-bin="${bin.digit}"><strong>b = ${bin.digit}</strong><div class="nc-msd-bucket-items">${bin.items.map(item=>`<span data-origin="${item.origin}" class="nc-msd-key">${msdKey(item,step.d,node.p,node.p)}</span>`).join("")}</div></div>`).join(""):`<div class="nc-msd-empty">${node.status==="complete"?"Sorted result retained":node.bins===null?"Bins not created yet":"All 10 bins are empty"}</div>`}</div>
    <div class="nc-equation ${step.phase==="inspect"?"is-counted":""}">${escapeHtml(relation)}</div></div>`;
}
