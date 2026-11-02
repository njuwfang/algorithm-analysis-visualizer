import {escapeHtml} from "../../core/utils.js";

function relation(step){
  if(step.phase==="rotate"){const r=step.rotation;return `${r.case} ${r.part}/${r.total}: ${r.direction} at ${r.oldRoot} → ${r.newRoot} becomes subtree root${r.transferred===null?"":`; ${r.transferred} → ${r.oldRoot}.${r.direction==="R"?"left":"right"}`}`;}
  if(step.phase==="plan"){const p=step.plan;return p.type==="LR"?`LR: L at ${p.child}, then R at ${p.pivot}`:p.type==="RL"?`RL: R at ${p.child}, then L at ${p.pivot}`:`${p.type} at ${p.pivot}: promote child ${p.child}`;}
  if(step.phase==="balance"){const node=step.nodes.find(node=>node.key===step.cursor);return `BF(${node.key}) = ${node.balance}${Math.abs(node.balance)>1?" · repair needed":" · balanced"}`;}
  if(step.phase==="compare")return `${step.key} ${step.comparison.result==="less"?"<":">"} ${step.comparison.node} → ${step.comparison.result==="less"?"left":"right"}`;
  if(step.phase==="descend")return `${step.parent} → ${step.side}${step.cursor===null?" child is empty":` child ${step.cursor}`}`;
  if(step.phase==="attach")return `${step.key} attached ${step.parent===null?"as root":`to ${step.parent}'s ${step.side}`}`;
  if(step.phase==="complete")return step.avl?"Complete · all |BF| ≤ 1":"Complete · left < key < right";
  if(step.phase==="insert-complete")return `Key ${step.key} inserted · AVL balance restored`;
  if(step.phase==="unbalanced")return `Nearest unbalanced ancestor: ${step.pivot}`;
  return step.key===null?"Start with the empty tree":`Next key: ${step.key}`;
}

export function renderTree(step){
  const rank=new Map([...step.keys].sort((a,b)=>a-b).map((key,index)=>[key,index]));
  const width=Math.max(230,step.keys.length*38+24),gap=step.avl?40:22;
  const coordinates=new Map(),byKey=new Map(step.nodes.map(node=>[node.key,node]));
  function layout(key,depth){if(key===null)return;const node=byKey.get(key);coordinates.set(key,{x:12+(rank.get(key)+.5)*38,y:step.avl?34+depth*gap:24+depth*gap});layout(node.left,depth+1);layout(node.right,depth+1);}
  layout(step.root,0);
  const height=Math.max(116,(step.avl?56:46)+(step.layoutDepth??Math.max(0,step.height))*gap);
  const beforeEdges=new Set(step.rotation?.before.flatMap(node=>[[node.key,node.left],[node.key,node.right]]).filter(([,child])=>child!==null).map(([parent,child])=>`${parent}:${child}`)??[]);
  const edges=step.nodes.flatMap(node=>[node.left,node.right].filter(child=>child!==null).map(child=>{
    const a=coordinates.get(node.key),b=coordinates.get(child),changed=step.phase==="rotate"&&!beforeEdges.has(`${node.key}:${child}`),path=["compare","descend","attach"].includes(step.phase)&&step.path.indexOf(node.key)>=0&&step.path.indexOf(child)===step.path.indexOf(node.key)+1;
    return `<path class="${changed?"is-rotated":path?"is-path":""}" d="M ${a.x} ${a.y} L ${b.x} ${b.y}"/>`;
  })).join("");
  const active=step.cursor??(step.phase==="descend"?step.parent:null);
  const nodes=step.nodes.map(node=>{
    const p=coordinates.get(node.key),current=node.key===active,counted=current&&(step.avl?step.phase==="rotate":step.phase==="compare");
    const label=`Key ${node.key}; left ${node.left??"empty"}; right ${node.right??"empty"}; height ${node.height}${step.avl?`; BF ${node.balance}`:""}`;
    return `<g class="tc-tree-node ${current?"is-current":""} ${counted?"is-counted":""} ${step.avl&&Math.abs(node.balance)>1?"is-unbalanced":""}" transform="translate(${p.x},${p.y})" data-key="${node.key}" role="group" aria-label="${escapeHtml(label)}"${current?" data-active-visual":""}><circle r="15"/><text class="tc-tree-key" text-anchor="middle" dominant-baseline="central">${node.key}</text>${step.avl?`<text class="tc-tree-balance" y="-21" text-anchor="middle">BF ${node.balance>0?"+":""}${node.balance}</text>`:""}</g>`;
  }).join("");
  return `<div class="tc-tree-visual"><div class="tc-tree-header"><div class="tc-key-queue-scroll" data-visual-scroll><div class="tc-key-queue">${step.keys.map((key,index)=>{
    const current=index===step.position&&step.phase!=="complete";
    return `<span class="${index<step.inserted?"is-inserted":""} ${current?"is-next":""}">${index<step.inserted?"✓":""}${current?"k=":""}${key}</span>`;
  }).join("")}</div></div><span class="tc-tree-height">h = ${step.height}</span></div><div class="tc-tree-scroll" data-visual-scroll>${step.nodes.length?`<svg class="tc-tree-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="${step.avl?"AVL":"Binary search"} tree; left keys are smaller and right keys are larger"><g class="tc-tree-edges">${edges}</g>${nodes}</svg>`:`<div class="tc-empty-tree" style="height:${height}px">∅<small>empty · h = −1</small></div>`}</div><div class="tc-tree-relation ${step.avl?step.phase==="rotate"?"is-counted":"":step.phase==="compare"?"is-counted":""}">${escapeHtml(relation(step))}</div></div>`;
}
