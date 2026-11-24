import {copy,edgeKey,edgeText,shown,list} from "./shared.js?v=20261124-1";

export function buildPrim({start,vertices,edges}) {
  const tree=[],inTree=new Set(),accepted=[],labels=Object.fromEntries(vertices.map(v=>[v,{parent:null,weight:null}])),trace=[];
  const matrix=Object.fromEntries(vertices.map(u=>[u,Object.fromEntries(vertices.map(v=>[v,null]))]));
  for(const e of edges){matrix[e.u][e.v]=e;matrix[e.v][e.u]=e;}
  let current=null,focus=null,best=null,bestWeight=null,edge=null,improves=null,comparisons=0,selectionComparisons=0,labelComparisons=0,total=0;
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:phase==="labels-ready"?{activeLabel:"Labels ready"}:{}),algorithm:"prim",start,vertices,edges,tree,accepted,labels,current,focus,best,bestWeight,edge,improves,comparisons,selectionComparisons,labelComparisons,total}));
  add("ready",null,`Grow a minimum spanning tree from ${start}; labels store one cheapest connecting edge, not a path distance.`);
  tree.push(start);inTree.add(start);current=start;labels[start].weight=0;
  add("start",1,`Vₜ={${start}}, Eₜ=∅. Every other vertex begins with parent none and weight ∞.`);
  const update=()=>{
    for(const u of vertices.filter(v=>!inTree.has(v))) {
      const candidate=matrix[current][u];if(!candidate)continue;
      focus=u;edge=candidate.key;improves=labels[u].weight===null||candidate.weight<labels[u].weight;
      comparisons+=1;labelComparisons+=1;
      add("label-test",7,`Compare edge ${edge} weight ${candidate.weight} < label[${u}] ${shown(labels[u].weight)}: ${improves?"yes":"no; retain the earlier label"}.`);
      if(improves){labels[u]={parent:current,weight:candidate.weight};add("label-update",8,`Set ${u}(${current},${candidate.weight}): its cheapest known connection to Vₜ is ${edge}.`);}
    }
    focus=null;edge=null;improves=null;
    add("labels-ready",null,`Labels are current for tree vertices ${tree.join(", ")}. Choose the least finite remaining label.`);
  };
  if(tree.length<vertices.length)update();
  while(tree.length<vertices.length) {
    best=null;bestWeight=null;current=null;
    for(const u of vertices.filter(v=>!inTree.has(v))) {
      focus=u;improves=labels[u].weight!==null&&(bestWeight===null||labels[u].weight<bestWeight);
      comparisons+=1;selectionComparisons+=1;
      add("minimum-test",4,`Compare label[${u}]=${shown(labels[u].weight)} < current minimum ${shown(bestWeight)}: ${improves?"yes":"no; keep the earlier minimum"}.`);
      if(improves){best=u;bestWeight=labels[u].weight;add("minimum-retain",5,`Retain ${u} as the closest outside vertex, via ${labels[u].parent}${u} with weight ${bestWeight}.`);}
    }
    current=best;focus=null;edge=edgeKey(labels[current].parent,current);accepted.push(edge);tree.push(current);inTree.add(current);total+=labels[current].weight;improves=null;best=null;bestWeight=null;
    add("accept",6,`Add ${current} through edge ${edge} (${labels[current].weight}); Vₜ={${tree.join(", ")}}, total weight ${total}.`);
    if(tree.length<vertices.length)update();
  }
  current=null;focus=null;edge=null;best=null;bestWeight=null;improves=null;
  add("complete",9,`Return MST edges ${list(accepted)} with total weight ${total}; all ${vertices.length} vertices are connected.`);
  return trace;
}
export function describePrim(s) {
  const crossing=s.edges.filter(e=>s.tree.includes(e.u)!==s.tree.includes(e.v));
  return {summary:s.message,state:[
    {label:"Graph",value:`Vertices ${list(s.vertices)}; undirected edges ${s.edges.map(edgeText).join(", ")||"none"}`},
    {label:"Start vertex",value:s.start},
    {label:"Tree vertex order",value:list(s.tree)},
    {label:"Remaining vertices",value:list(s.vertices.filter(v=>!s.tree.includes(v)))},
    {label:"Tree edges",value:list(s.accepted)},
    {label:"Total tree weight",value:String(s.total)},
    {label:"Nearest-tree labels",value:s.vertices.map(v=>`${v}: ${s.tree.includes(v)?"in tree; ":""}parent ${s.labels[v].parent??"none"}, weight ${shown(s.labels[v].weight)}`).join("; ")},
    {label:"Crossing edges",value:crossing.map(edgeText).join(", ")||"none"},
    {label:"Vertex being added or updated from",value:s.current??"none"},
    {label:"Vertex being tested",value:s.focus??"none"},
    {label:"Current edge",value:s.edge??"none"},
    {label:"Retained minimum outside vertex",value:s.best===null?"none":`${s.best}, weight ${s.bestWeight}`},
    {label:"Comparison outcome",value:s.improves===null?"not evaluated":s.improves?"improves the previous value":"keeps the previous value"},
    {label:"Minimum-label comparisons",value:String(s.selectionComparisons)},
    {label:"Connection-label comparisons",value:String(s.labelComparisons)},
    {label:"Weight comparisons",value:String(s.comparisons)}
  ],details:["A checked vertex is already in Vₜ; a heavy green edge is retained in Eₜ. Dashed edges cross from Vₜ to an outside vertex. The current edge is amber; a counted comparison is teal.","For an outside vertex u, its label is the weight of one cheapest known edge to Vₜ, with that edge's tree endpoint. It is not a shortest-path distance from the start. During label updates, unprocessed labels can still describe the preceding tree.","The array implementation scans outside labels in alphabetical order. Equal weights keep the earlier parent or minimum. Each accepted edge has minimum weight across the current cut; no selected edge is undone."]};
}

export function buildKruskal({start,vertices,edges}) {
  const trace=[],accepted=[],rejected=[],sorted=[...edges].sort((a,b)=>a.weight-b.weight||a.key.localeCompare(b.key));
  const componentLabels=Object.fromEntries(vertices.map(v=>[v,v]));
  let groups=vertices.map(v=>[v]),edge=null,index=null,checks=0,total=0,same=null,witness=[];
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),algorithm:"kruskal",start,vertices,edges,sorted,accepted,rejected,groups,edge,index,checks,total,same,witness}));
  add("ready",null,"Build a minimum spanning tree by taking edges in increasing weight order and rejecting cycles.");
  add("sort",1,`Sort by weight; ties use alphabetical edge order: ${sorted.map(edgeText).join(", ")||"no edges"}.`);
  for(index=0;index<sorted.length&&accepted.length<vertices.length-1;index+=1) {
    const candidate=sorted[index];edge=candidate.key;same=null;witness=[];
    add("consider",4,`Consider next edge ${edge} with weight ${candidate.weight}.`);
    same=componentLabels[candidate.u]===componentLabels[candidate.v];checks+=1;
    if(same){
      const find=(u,target,seen=new Set())=>{if(u===target)return [u];seen.add(u);for(const key of accepted){const e=edges.find(e=>e.key===key),v=e.u===u?e.v:e.v===u?e.u:null;if(v!==null&&!seen.has(v)){const path=find(v,target,seen);if(path)return [u,...path];}}return null;};
      witness=find(candidate.u,candidate.v);
    }
    add("cycle-test",5,`Check components of ${candidate.u} and ${candidate.v}: ${same?`same component; existing path ${witness.join("→")} would close a cycle`:'different components; no cycle would be created'}.`);
    if(same){rejected.push(edge);add("reject",7,`Skip ${edge}: it would close cycle ${[...witness,candidate.u].join("→")}.`);}
    else {accepted.push(edge);total+=candidate.weight;
      const from=componentLabels[candidate.v],to=componentLabels[candidate.u];
      for(const v of vertices)if(componentLabels[v]===from)componentLabels[v]=to;
      const byLabel=new Map();for(const v of vertices){const label=componentLabels[v];if(!byLabel.has(label))byLabel.set(label,[]);byLabel.get(label).push(v);}groups=[...byLabel.values()];
      add("accept",6,`Keep ${edge} (${candidate.weight}); merge its components. ${accepted.length} tree edges, total weight ${total}.`);}
  }
  edge=null;index=null;same=null;witness=[];
  add("complete",8,`Stop at ${accepted.length}=|V|−1 edges. Return MST ${list(accepted)}, weight ${total}; later edges need no cycle check.`);
  return trace;
}
export function describeKruskal(s) {
  return {summary:s.message,state:[
    {label:"Graph",value:`Vertices ${list(s.vertices)}; undirected edges ${s.edges.map(edgeText).join(", ")||"none"}`},
    {label:"Sorted edge order",value:s.phase==="ready"?"not sorted yet":s.sorted.map(edgeText).join(", ")||"none"},
    {label:"Edge decisions",value:s.sorted.map(e=>`${e.key}: ${s.accepted.includes(e.key)?"accepted":s.rejected.includes(e.key)?"rejected (cycle)":e.key===s.edge?"current":"unexamined"}`).join("; ")||"none"},
    {label:"Current edge",value:s.edge??"none"},
    {label:"Current position in sorted list",value:s.index===null?"none":String(s.index+1)},
    {label:"Components",value:s.groups.map(g=>`{${g.join(", ")}}`).join("; ")},
    {label:"Cycle outcome",value:s.same===null?"not checked":s.same?"last check: endpoints already shared a component; the edge would create a cycle":"last check: endpoints belonged to different components; safe to join"},
    {label:"Existing endpoint path",value:s.witness.length?s.witness.join(" → "):"none"},
    {label:"Tree edges",value:list(s.accepted)},
    {label:"Rejected cycle edges",value:list(s.rejected)},
    {label:"Total tree weight",value:String(s.total)},
    {label:"Edges still needed",value:String(s.vertices.length-1-s.accepted.length)},
    {label:"Cycle checks",value:String(s.checks)}
  ],details:["Checked edges are retained; crossed edges were rejected; an unmarked edge has not been decided. Dashed highlighted path edges show the existing endpoint path of a cycle candidate.","Intermediate accepted edges form a forest: every component is a tree. An edge joining two different components is accepted; an edge whose endpoints already share a component is rejected.","Equal weights use alphabetical endpoint order, matching the source's worked list. The start-vertex field only chooses Prim's root; Kruskal does not use a root. Stop once |V|−1 edges have been accepted."]};
}
