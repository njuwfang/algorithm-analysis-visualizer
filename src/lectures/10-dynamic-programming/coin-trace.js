import {copy,oneRow,indexList} from "./shared.js?v=20261114-1";

export function buildCoinRow(coins) {
  const n=coins.length,F=Array(n+1).fill(null),choices=Array(n+1).fill(null),trace=[];
  let i=null,take=null,skip=null,comparisons=0,result=null,cursor=null,selected=[],path=[];
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),coins,n,F,choices,i,take,skip,comparisons,result,cursor,selected,path}));
  add("ready",null,"Choose a maximum-value set of coins without choosing adjacent positions.");
  F[0]=0;add("base-zero",1,"F[0]=0: an empty prefix contains no money.");
  if(n>0){F[1]=coins[0];choices[1]="take";add("base-one",2,`F[1]=c₁=${coins[0]}.`);}
  for(i=2;i<=n;i+=1) {
    take=coins[i-1]+F[i-2];skip=F[i-1];
    add("candidates",4,`Taking coin ${i} gives ${coins[i-1]}+F[${i-2}]=${take}; skipping it gives F[${i-1}]=${skip}.`);
    comparisons+=1;F[i]=Math.max(take,skip);choices[i]=take>skip?"take":"skip";
    add("choose",5,`Compare ${take} with ${skip}; save F[${i}]=${F[i]}. ${take===skip?"Tie: skip the current coin.":choices[i]==="take"?"Retain the take option.":"Retain the skip option."}`);
  }
  i=null;take=null;skip=null;result=F[n];cursor=n;
  add("traceback-start",6,`The optimal amount is ${result}; recover the actual coin positions from F.`);
  while(cursor>0) {
    const from=cursor, chosen=cursor===1||F[cursor]>F[cursor-1];
    if(chosen) {selected.push(cursor);cursor=Math.max(0,cursor-2);}else cursor-=1;
    path.push({from,to:cursor,take:chosen});
    add(chosen?"traceback-take":"traceback-skip",chosen?8:9,chosen?`Choose coin ${from} (${coins[from-1]}); jump to prefix ${cursor}, excluding its adjacent predecessor.`:`Skip coin ${from}; keep the optimal prefix ${cursor}.`);
  }
  add("complete",10,`Return amount ${result} with coin positions ${[...selected].sort((a,b)=>a-b).join(", ")||"none"}.`);
  return trace;
}
export function describeCoinRow(step) {
  const back=step.phase.startsWith("traceback")||step.phase==="complete";
  return {summary:step.message,state:[
    {label:"Coins",value:step.coins.map((value,i)=>`c[${i+1}]=${value}`).join("; ")||"empty"},
    {label:"Prefix optima",value:oneRow(step.F)},
    {label:"Current prefix",value:step.i===null?"none":String(step.i)},
    {label:"Take dependency",value:step.take===null?"not evaluated":`c[${step.i}]=${step.coins[step.i-1]} + F[${step.i-2}]=${step.F[step.i-2]} gives ${step.take}`},
    {label:"Skip dependency",value:step.skip===null?"not evaluated":`F[${step.i-1}]=${step.skip}`},
    {label:"Retained choices",value:step.choices.map((choice,i)=>`${i}:${choice??"not chosen"}`).join("; ")},
    {label:"Traceback cursor",value:step.cursor===null?"not started":`prefix ${step.cursor}`},
    {label:"Traceback path",value:step.path.map(edge=>`${edge.from} → ${edge.to}: ${edge.take?"take":"skip"}`).join("; ")||"none"},
    {label:"Chosen coin positions",value:indexList([...step.selected].sort((a,b)=>a-b))},
    {label:"Recovery order",value:indexList(step.selected)},
    {label:"Recovered amount",value:back?String(step.selected.reduce((sum,index)=>sum+step.coins[index-1],0)):"not started"},
    {label:"Optimal amount",value:step.result===null?"not returned":String(step.result)},
    {label:"Max comparisons",value:String(step.comparisons)}
  ],details:["Coin positions are 1..n; F[k] is the optimum using the first k coins, with F[0]=0.",
    "Taking coin i uses F[i−2], so the neighboring coin i−1 is excluded. Ties choose skip; different optimal sets can exist.",
    "Only the forward max comparison is counted. Traceback recovers one optimal set without adding to that count."]};
}
