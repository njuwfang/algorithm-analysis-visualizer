export const copy=value=>structuredClone(value);
export const shown=value=>value===null?"∞":String(value);
export const list=values=>values.length?values.join(", "):"none";
export const edgeKey=(u,v)=>[u,v].sort().join("");

export const changeExamples={
  recurrence:"9 | 6,5,1",
  usa:"40 | 50,25,10,5,1",
  tanzania:"40 | 100,50,25,20,10,5",
  uae:"240 | 100,50,25,10,5,1"
};
export function parseChange(raw) {
  const parts=String(raw).split("|");
  if(parts.length!==2)throw new Error("Enter money | denominations, for example 9 | 6,5,1.");
  const moneyText=parts[0].trim(),partsCoins=parts[1].split(",").map(value=>value.trim());
  if(!/^\d+$/.test(moneyText)||Number(moneyText)>240)throw new Error("Money must be a whole number from 0 to 240.");
  if(partsCoins.length<1||partsCoins.length>6||partsCoins.some(value=>!/^\d+$/.test(value)||Number(value)<1||Number(value)>1000))throw new Error("Enter 1–6 whole-number denominations from 1 to 1000, separated by commas.");
  const coins=partsCoins.map(Number);
  if(new Set(coins).size!==coins.length)throw new Error("Each denomination must appear once; unlimited copies of each coin are available.");
  return {money:Number(moneyText),coins};
}

export const graphExamples={
  worked:"a | ab:3,af:5,ae:6,bc:1,bf:4,cf:4,cd:6,df:5,ef:2,de:8",
  small:"a | ab:1,ac:5,ad:2,cd:3",
  exercise:"a | ab:5,ad:6,bc:1,bd:3,cd:4,ce:6,de:2",
  large:"a | ab:3,ac:5,ad:4,be:3,bf:6,cd:2,cg:4,de:1,dh:5,ef:2,ei:4,fj:5,gh:3,gk:6,hi:6,hk:7,ij:3,il:5,jl:9,kl:8"
};
export function components(vertices,accepted,edges) {
  const labels=Object.fromEntries(vertices.map(v=>[v,v]));
  for(const key of accepted){const {u,v}=edges.find(e=>e.key===key),from=labels[v],to=labels[u];for(const vertex of vertices)if(labels[vertex]===from)labels[vertex]=to;}
  return [...new Set(Object.values(labels))].map(label=>vertices.filter(v=>labels[v]===label));
}
export function parseGraph(raw) {
  const parts=String(raw).split("|");
  if(parts.length!==2||!(/^[a-l]$/.test(parts[0].trim())))throw new Error("Enter start vertex | edges, for example a | ab:3,bc:1,ac:5. Use vertices a–l.");
  const start=parts[0].trim(),entries=parts[1].trim()?parts[1].split(","):[];
  if(entries.length>24)throw new Error("Use at most 24 undirected edges for a readable graph.");
  const seen=new Set(),edges=entries.map((entry,index)=>{
    const match=entry.trim().match(/^([a-l])([a-l])\s*:\s*(\d+)$/);
    if(!match)throw new Error(`Edge ${index+1} must use form ab:3 with vertices a–l and an integer weight.`);
    const [,u,v,w]=match,key=edgeKey(u,v),weight=Number(w);
    if(u===v)throw new Error(`Edge ${u}${v} is a self-loop; use different endpoints.`);
    if(seen.has(key))throw new Error(`Edge ${key} is repeated; each undirected edge must appear once.`);
    if(weight>99)throw new Error(`Edge ${key} weight must be from 0 to 99.`);
    seen.add(key);return {key,u:key[0],v:key[1],weight};
  }).sort((a,b)=>a.key.localeCompare(b.key));
  const vertices=[...new Set([start,...edges.flatMap(e=>[e.u,e.v])])].sort();
  if(components(vertices,edges.map(e=>e.key),edges).length>1)throw new Error("The graph must be connected, including the start vertex. Add edges joining its components.");
  return {start,vertices,edges};
}
export const edgeText=edge=>`${edge.key}:${edge.weight}`;
