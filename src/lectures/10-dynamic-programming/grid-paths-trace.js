import {copy,at,cellKey,tableText} from "./shared.js?v=20261114-1";

export function parseGridPaths(raw) {
  const parts=String(raw).trim().split(/\s*[,×x]\s*/);
  if(parts.length!==2||parts.some(part=>!/^\d+$/.test(part)||Number(part)>5)) {
    throw new Error("Enter destination row, column as two whole numbers from 0 to 5, for example 2,2.");
  }
  const [rows,columns]=parts.map(Number);
  return {rows,columns};
}
export function diagonalCells(rows,columns,k) {
  if(k===null||k<0||k>rows+columns)return [];
  return Array.from({length:Math.min(rows,k)-Math.max(0,k-columns)+1},(_,offset)=>{
    const i=Math.max(0,k-columns)+offset;
    return {i,j:k-i};
  });
}
export function buildGridPaths({rows,columns}) {
  const F={},trace=[],finished=[];
  let k=null,i=null,j=null,above=null,left=null,additions=0,result=null;
  const add=(phase,activeLine,message)=>trace.push(copy({phase,activeLine,message,
    ...(phase==="ready"?{activeLabel:"Ready"}:{}),rows,columns,F,k,i,j,above,left,additions,result,finished}));
  add("ready",null,`Count right/down paths from (0,0) to (${rows},${columns}).`);
  k=0;i=0;j=0;F["0,0"]=1;finished.push(0);
  add("base",1,"F[0,0]=1: the empty path is the one way to start.");
  for(k=1;k<=rows+columns;k+=1) {
    i=null;j=null;above=null;left=null;
    add("diagonal-start",2,`Begin diagonal k=${k}: all cells with i+j=${k}. Diagonal ${k-1} is complete.`);
    for(const cell of diagonalCells(rows,columns,k)) {
      i=cell.i;j=cell.j;
      if(i===0||j===0) {
        above=null;left=null;F[cellKey(i,j)]=1;
        add("boundary",5,`F[${i},${j}]=1: ${i===0?"only right moves reach the top row":"only down moves reach the first column"}.`);
      } else {
        above=at(F,i-1,j);left=at(F,i,j-1);
        add("read",6,`Read above F[${i-1},${j}]=${above} and left F[${i},${j-1}]=${left}; both are on diagonal ${k-1}.`);
        F[cellKey(i,j)]=above+left;additions+=1;
        add("add",7,`Add ${above}+${left} and save F[${i},${j}]=${at(F,i,j)}. No cell on diagonal ${k} is a dependency.`);
      }
    }
    finished.push(k);i=null;j=null;above=null;left=null;
    add("diagonal-end",null,`Diagonal ${k} is complete. Its cells were independent of one another.`);
  }
  k=rows+columns;i=null;j=null;above=null;left=null;result=at(F,rows,columns);
  add("complete",8,`Return F[${rows},${columns}]=${result}: ${result===1?"one path":`${result} paths`}.`);
  return trace;
}
export function describeGridPaths(step) {
  const cells=k=>diagonalCells(step.rows,step.columns,k).map(({i,j})=>`F[${i},${j}]=${at(step.F,i,j)??"not computed"}`).join("; ")||"none";
  return {summary:step.message,state:[
    {label:"Grid and moves",value:`Rows 0..${step.rows}; columns 0..${step.columns}; start (0,0); destination (${step.rows},${step.columns}); right or down only`},
    {label:"Path counts",value:tableText(step.F,step.rows,step.columns)},
    {label:"Current diagonal",value:step.k===null?"not started":`k=${step.k}; i+j=${step.k}: ${cells(step.k)}`},
    {label:"Previous diagonal",value:step.k===null||step.k===0?"none":`k=${step.k-1}: ${cells(step.k-1)}`},
    {label:"Finished diagonals",value:step.finished.length?step.finished.join(", "):"none"},
    {label:"Current cell",value:step.i===null?"none":`F[${step.i},${step.j}]=${at(step.F,step.i,step.j)??"not computed"}`},
    {label:"Above dependency",value:step.above===null?"none":`F[${step.i-1},${step.j}]=${step.above}; coordinate sum ${step.k-1}`},
    {label:"Left dependency",value:step.left===null?"none":`F[${step.i},${step.j-1}]=${step.left}; coordinate sum ${step.k-1}`},
    {label:"Current addition",value:step.above===null?"none":`${step.above}+${step.left}=${step.above+step.left}; ${step.phase==="add"?"saved":"not saved yet"}`},
    {label:"Within-diagonal independence",value:step.k===null||step.k===0?"No recurrence dependencies yet":`Every nonboundary cell on diagonal ${step.k} reads two cells on diagonal ${step.k-1}; it reads no cell on its own diagonal`},
    {label:"Returned paths",value:step.result===null?"not returned":String(step.result)},
    {label:"Additions",value:String(step.additions)}
  ],details:[
    "F[i,j] counts paths, not the cost of one path. Above and left are disjoint final-move cases, so their counts are added.",
    "A dashed outline identifies the current diagonal. Solid and dashed indigo operand outlines identify above and left; dots mean uncomputed cells. A green outlined destination is the returned answer.",
    "This trace completes each anti-diagonal before the next. Each cell uses at most two previous-diagonal entries; row-by-row evaluation is also valid."
  ]};
}
