import {copy,shown,list} from "./shared.js?v=20261124-1";

// A reference calculation for the final greedy comparison, outside its counter.
export function optimalChange({money,coins}) {
  const F=Array(money+1).fill(null),choices=Array(money+1).fill(null);F[0]=0;
  for(let m=1;m<=money;m+=1)for(const coin of coins)if(coin<=m&&F[m-coin]!==null&&(F[m]===null||F[m-coin]+1<F[m])){F[m]=F[m-coin]+1;choices[m]=coin;}
  const selected=[];let remaining=money;
  if(F[money]!==null)while(remaining>0){selected.push(choices[remaining]);remaining-=choices[remaining];}
  return {F,choices,count:F[money],selected};
}
export function buildChangeDP({money,coins}) {
  const F=Array(money+1).fill(null),choices=Array(money+1).fill(null),trace=[];
  let amount=null,coin=null,dependency=null,candidate=null,best=null,bestCoin=null,improves=null,comparisons=0,
    result=null,recover=null,selected=[],attempts=[],savedThrough=-1;
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),money,coins,F,choices,amount,coin,dependency,candidate,best,bestCoin,improves,comparisons,result,recover,selected,attempts,savedThrough}));
  add("ready",null,`Find the minimum number of coins making ${money}; every denomination has unlimited supply.`);
  F[0]=0;savedThrough=0;add("base",1,"MinNumCoins[0]=0: no coins are needed for zero money.");
  for(amount=1;amount<=money;amount+=1) {
    best=null;bestCoin=null;coin=null;dependency=null;candidate=null;improves=null;attempts=[];
    add("amount",3,`Solve money ${amount}; start best=∞ and try each fitting denomination.`);
    for(const denomination of coins){coin=denomination;dependency=null;candidate=null;improves=null;
      if(coin>amount){add("too-large",5,`Coin ${coin} cannot be the last coin for ${amount}; skip it.`);continue;}
      dependency=amount-coin;candidate=F[dependency]===null?null:F[dependency]+1;
      add("candidate",6,`Last coin ${coin}: MinNumCoins[${dependency}]+1=${shown(F[dependency])}+1=${shown(candidate)}.`);
      comparisons+=1;improves=candidate!==null&&(best===null||candidate<best);
      attempts.push({coin,dependency,candidate,improves});
      add("compare",7,`Compare ${shown(candidate)} < best ${shown(best)}: ${improves?"yes":candidate===null?"no finite candidate":candidate===best?"no; keep the earlier choice":"no"}.`);
      if(improves){best=candidate;bestCoin=coin;add("retain",8,`Retain ${best} coins, with last coin ${bestCoin}, for money ${amount}.`);}
    }
    coin=null;dependency=null;candidate=null;improves=null;F[amount]=best;choices[amount]=bestCoin;savedThrough=amount;
    add("store",9,`Save MinNumCoins[${amount}]=${shown(best)}${bestCoin===null?"; this amount is unreachable":` with last coin ${bestCoin}`}.`);
  }
  amount=null;coin=null;dependency=null;candidate=null;best=null;bestCoin=null;improves=null;attempts=[];result=F[money];recover=result===null?null:money;
  add("recover-start",10,result===null?`Money ${money} cannot be made from these denominations.`:`Minimum ${result} coins. Follow saved last coins to recover the change.`);
  while(recover!==null&&recover>0){const from=recover,chosen=choices[from];selected.push(chosen);recover-=chosen;add("recover",11,`Take saved coin ${chosen}: remaining money ${from} → ${recover}.`);}
  add("complete",12,result===null?`Return no exact change for ${money}.`:`Return ${result} coins: ${selected.join(" + ")||"none"}${selected.length?` = ${money}`:""}.`);
  return trace;
}
export function describeChangeDP(s) {
  return {summary:s.message,state:[
    {label:"Change input",value:`money=${s.money}; denominations ${list(s.coins)}; unlimited copies`},
    {label:"MinNumCoins table",value:s.F.map((v,i)=>`${i}:${i>s.savedThrough?"not computed":v===null?"∞ (unreachable)":v}`).join("; ")},
    {label:"Saved last coins",value:s.choices.map((v,i)=>`${i}:${v??"none"}`).join("; ")},
    {label:"Current amount",value:s.amount===null?"none":String(s.amount)},
    {label:"Current denomination",value:s.coin===null?"none":String(s.coin)},
    {label:"Dependency",value:s.dependency===null?"none":`MinNumCoins[${s.dependency}]=${shown(s.F[s.dependency])}; add one coin ${s.coin}`},
    {label:"Candidate count",value:s.dependency===null?"not evaluated":shown(s.candidate)},
    {label:"Best retained",value:s.best===null?"∞; no finite choice":`${s.best} coins; last coin ${s.bestCoin}`},
    {label:"Comparison outcome",value:s.improves===null?"not evaluated":s.improves?"improves the previous best":"keeps the previous best"},
    {label:"Tried last coins",value:s.attempts.map(a=>`${a.coin}: MinNumCoins[${a.dependency}]+1=${shown(a.candidate)}; ${a.improves?"improved":"kept best"}`).join("; ")||"none"},
    {label:"Recovery remainder",value:s.recover===null?"not active":String(s.recover)},
    {label:"Recovered coins",value:list(s.selected)},
    {label:"Returned minimum",value:s.phase==="complete"||s.phase.startsWith("recover")?s.result===null?"no exact change":String(s.result):"not returned"},
    {label:"Candidate comparisons",value:String(s.comparisons)}
  ],details:["Each candidate tries the final coin and reads a smaller saved amount. Equal finite counts keep the first denomination in input order.","Dots denote uncomputed amounts; infinity denotes evaluated unreachable amounts. Solid outlined cells are saved dependencies; the current amount has a separate outline.","Only candidate < best comparisons are counted; fitting checks, additions, initialization and recovery also take time but do not increment this counter."]};
}
export function buildGreedyChange(input) {
  const {money}=input,coins=[...input.coins].sort((a,b)=>b-a),trace=[],selected=[];
  let remaining=money,index=null,coin=null,fits=null,testedRemainder=null,tests=0,reference=null;
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{}),money,inputCoins:input.coins,coins,remaining,index,coin,fits,testedRemainder,tests,selected,reference}));
  add("ready",null,`Make ${money} by repeatedly taking the largest coin that fits. Choices are not undone.`);
  add("sort",1,`Use descending denominations: ${coins.join(", ")}.`);
  for(index=0;index<coins.length&&remaining>0;index+=1){coin=coins[index];
    while(remaining>0){tests+=1;testedRemainder=remaining;fits=coin<=remaining;
      add("test",4,`Does coin ${coin} fit remaining ${remaining}? ${fits?"Yes; take it next":"No; move to the next smaller denomination"}.`);
      if(!fits)break;
      const before=remaining;remaining-=coin;selected.push(coin);
      add("take",5,`Commit coin ${coin}: remaining ${before} − ${coin} = ${remaining}.`);
    }
  }
  index=null;coin=null;fits=null;testedRemainder=null;
  add("greedy-end",6,remaining===0?`Greedy finishes with ${selected.length} coins.`:`Greedy stops with remainder ${remaining}; its committed choices do not make exact change.`);
  const optimum=optimalChange(input);reference={count:optimum.count,selected:optimum.selected};
  const verdict=remaining===0?selected.length===reference.count?"Greedy matches the DP minimum on this input":"Greedy uses more coins than the DP minimum":reference.count===null?"No exact change exists":"An exact solution exists, but greedy missed it";
  add("complete",7,`${verdict}. ${reference.count===null?"DP confirms no exact change.":`DP: ${reference.selected.join(" + ")||"no coins"} (${reference.count} coins).`}`);
  return trace;
}
export function describeGreedyChange(s) {
  return {summary:s.message,state:[
    {label:"Change input",value:`money=${s.money}; unlimited copies; denominations ${list(s.inputCoins)}`},
    {label:"Descending denomination order",value:s.phase==="ready"?"not sorted yet":s.coins.join(" > ")},
    {label:"Current denomination",value:s.coin===null?"none":String(s.coin)},
    {label:"Committed coins",value:list(s.selected)},
    {label:"Committed sum",value:String(s.money-s.remaining)},
    {label:"Remaining money",value:String(s.remaining)},
    {label:"Last tested remainder",value:s.testedRemainder===null?"none":String(s.testedRemainder)},
    {label:"Fit outcome",value:s.fits===null?"not tested":`${s.coin} ≤ ${s.testedRemainder}: ${s.fits?"true":"false"}`},
    {label:"Greedy coin count",value:String(s.selected.length)},
    {label:"Exact greedy change",value:s.remaining===0?"yes":s.phase==="greedy-end"||s.phase==="complete"?`no; stopped with remainder ${s.remaining}`:"not yet"},
    {label:"DP reference minimum",value:s.reference===null?"not revealed":s.reference.count===null?"no exact change":String(s.reference.count)},
    {label:"DP reference coins",value:s.reference===null?"not revealed":list(s.reference.selected)},
    {label:"Optimality verdict",value:s.reference===null?"not evaluated":s.remaining===0?s.selected.length===s.reference.count?"greedy matches the minimum on this input":"greedy uses more coins than the minimum":s.reference.count===null?"no exact change exists":"greedy missed an existing exact solution"},
    {label:"Coin-fit tests",value:String(s.tests)}
  ],details:["Greedy takes the largest fitting coin, then never undoes that choice. Descending order is the presorting step.","The final DP reference uses the preceding lecture process; it is a separate correctness comparison, excluded from greedy's operation count and time model.","A successful example does not prove greedy correct for every denomination system. A nonzero remainder is a failure of this greedy run, not proof that exact change is impossible."]};
}
