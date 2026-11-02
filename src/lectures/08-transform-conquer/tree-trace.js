import { parseArray } from "../../core/utils.js";

export function parseTreeKeys(raw) {
  const keys = parseArray(raw,{min:1,max:12});
  if (keys.some(key=>!Number.isInteger(key)||Math.abs(key)>99)) throw new Error("Tree keys must be integers from −99 to 99.");
  if (new Set(keys).size !== keys.length) throw new Error("Use distinct keys: the lecture's BST rule requires left keys < node < right keys.");
  return keys;
}

export function summarizeTree(nodes,root) {
  const byKey = new Map(nodes.map(node=>[node.key,node]));
  const heights = new Map();
  function height(key) {
    if (key === null) return -1;
    if (!heights.has(key)) {
      const node = byKey.get(key);
      heights.set(key,1+Math.max(height(node.left),height(node.right)));
    }
    return heights.get(key);
  }
  const annotated = nodes.map(node=>({...node,height:height(node.key),balance:height(node.left)-height(node.right)}));
  const inorder = [];
  function walk(key) {if(key===null)return;const node=byKey.get(key);walk(node.left);inorder.push(key);walk(node.right);}
  walk(root);
  return {nodes:annotated,height:height(root),inorder,balanced:annotated.every(node=>Math.abs(node.balance)<=1)};
}

function build(input,avl) {
  const keys = parseTreeKeys(input.join(",")), nodes = [];
  const state = { keys,root:null,position:null,key:null,cursor:null,parent:null,side:null,path:[],comparison:null,inserted:0,comparisons:0,rotations:0,perInsertComparisons:Array(keys.length).fill(null),perInsertRotations:Array(keys.length).fill(null),checked:[],pivot:null,plan:null,rotation:null };
  const trace = [];
  const get = key=>nodes.find(node=>node.key===key);
  const emit = (phase,activeLine,message) => trace.push(structuredClone({...state,...summarizeTree(nodes,state.root),phase,activeLine,message,avl,...(phase==="ready"?{activeLabel:"Ready"}:{})}));
  emit("ready",null,avl ? "Begin with an empty AVL tree. Insert in BST order, then repair the nearest unbalanced ancestor." : "Begin with an empty BST. Each key follows comparisons to an empty child position.");
  function rotate(oldRoot,direction,part,total) {
    const before = structuredClone(nodes), r = get(oldRoot);
    const c = get(direction === "R" ? r.left : r.right);
    const transferred = direction === "R" ? c.right : c.left;
    const parent = nodes.find(node=>node.left===oldRoot||node.right===oldRoot) ?? null;
    if (direction === "R") {r.left=transferred;c.right=r.key;}
    else {r.right=transferred;c.left=r.key;}
    if (parent) {if(parent.left===oldRoot)parent.left=c.key;else parent.right=c.key;}
    else state.root = c.key;
    state.rotations += 1;
    state.perInsertRotations[state.position] += 1;
    state.cursor = c.key;
    state.rotation = {direction,oldRoot,newRoot:c.key,transferred,parent:parent?.key??null,part,total,case:state.plan.type,before,after:structuredClone(nodes)};
    emit("rotate",7,`${state.plan.type}, ${part}/${total}: rotate ${direction === "R" ? "right" : "left"} at ${oldRoot}. ${c.key} becomes this subtree's root; ${transferred === null ? "the middle subtree is empty" : `middle subtree ${transferred} moves to ${oldRoot}'s ${direction === "R" ? "left" : "right"} side`}.`);
  }
  for(let position=0;position<keys.length;position+=1){
    Object.assign(state,{position,key:keys[position],cursor:state.root,parent:null,side:null,path:[],comparison:null,checked:[],pivot:null,plan:null,rotation:null});
    state.perInsertComparisons[position] = 0;
    state.perInsertRotations[position] = 0;
    emit("begin",1,`Insert key ${state.key}, item ${position+1} of ${keys.length}.`);
    while(state.cursor!==null){
      const node = get(state.cursor);
      state.path.push(node.key);
      state.comparison = {node:node.key,key:state.key,result:state.key<node.key?"less":"greater"};
      state.comparisons += 1;
      state.perInsertComparisons[position] += 1;
      emit("compare",avl?2:4,`Compare ${state.key} with ${node.key}: ${state.key<node.key?"less, so take the left child":"greater, so take the right child"}.`);
      state.parent = node.key;
      state.side = state.key<node.key?"left":"right";
      state.cursor = node[state.side];
      emit("descend",avl?2:5,`Follow ${node.key}'s ${state.side} child: ${state.cursor === null ? "empty; this is the insertion position" : state.cursor}.`);
    }
    nodes.push({key:state.key,left:null,right:null});
    if(state.parent===null)state.root=state.key;
    else get(state.parent)[state.side]=state.key;
    state.cursor = state.key;
    state.inserted = position+1;
    emit("attach",avl?3:6,`Attach ${state.key} as ${state.parent===null?"the root":`${state.parent}'s ${state.side} child`}. It is a leaf with height 0.`);
    if(!avl)continue;
    for(const key of [...state.path].reverse()){
      state.cursor = key;
      state.checked.push(key);
      const node = summarizeTree(nodes,state.root).nodes.find(node=>node.key===key);
      emit("balance",4,`Check ${key}: BF = height(left) − height(right) = ${node.balance}.${Math.abs(node.balance)>1?" This is the nearest unbalanced ancestor.":" Within −1,0,+1."}`);
      if(Math.abs(node.balance)>1){state.pivot=key;break;}
    }
    if(state.pivot!==null){
      const r = get(state.pivot), info = summarizeTree(nodes,state.root);
      const balance = key=>info.nodes.find(node=>node.key===key).balance;
      emit("unbalanced",5,`Repair the subtree rooted at ${r.key}, the unbalanced ancestor closest to the new leaf ${state.key}.`);
      const child = balance(r.key)>0?r.left:r.right;
      const type = balance(r.key)>0 ? balance(child)<0?"LR":"R" : balance(child)>0?"RL":"L";
      state.plan = {type,pivot:r.key,child,balance:balance(r.key),childBalance:balance(child)};
      emit("plan",6,`Choose ${type}: BF(${r.key})=${balance(r.key)}, BF(${child})=${balance(child)}. ${type.length===2?"Use two elementary rotations.":"Use one elementary rotation."}`);
      if(type==="R")rotate(r.key,"R",1,1);
      if(type==="L")rotate(r.key,"L",1,1);
      if(type==="LR"){rotate(child,"L",1,2);rotate(r.key,"R",2,2);}
      if(type==="RL"){rotate(child,"R",1,2);rotate(r.key,"L",2,2);}
    }
    state.cursor = state.key;
    emit("insert-complete",8,`Insertion of ${state.key} is complete. Every node again has BF in {−1,0,+1}; the BST key order is preserved.`);
  }
  state.cursor = null;
  emit("complete",avl?9:7,`All ${keys.length} keys inserted.${avl?` ${state.rotations} elementary rotations;`:` ${state.comparisons} key comparisons;`} final height ${summarizeTree(nodes,state.root).height}.`);
  const layoutDepth=Math.max(0,...trace.map(step=>step.height));
  return trace.map(step=>({...step,layoutDepth}));
}

export const buildBstTrace = keys=>build(keys,false);
export const buildAvlTrace = keys=>build(keys,true);

const edgesText = nodes => nodes.map(node=>`${node.key}: left ${node.left??"empty"}, right ${node.right??"empty"}`).join("; ")||"empty tree";
export function describeTree(step) {
  return {
    summary:step.message,
    state:[
      {label:"Insertion order",value:step.keys.map((key,index)=>`[${index}]=${key}`).join("; ")},
      {label:"Inserted prefix",value:`${step.inserted}/${step.keys.length}; ${step.keys.slice(0,step.inserted).join(", ")||"none"}`},
      {label:"Current key",value:step.key===null?"none":String(step.key)},
      {label:"Current node",value:step.cursor===null?"none":String(step.cursor)},
      {label:"Search path",value:step.path.join(" → ")||"empty"},
      {label:"Last key comparison",value:step.comparison?`${step.comparison.key} is ${step.comparison.result} than ${step.comparison.node}`:"not evaluated"},
      {label:"Insertion attachment",value:step.position===null?"none":step.parent===null?"root position":`${step.parent}'s ${step.side} child`},
      {label:"Root",value:step.root===null?"empty":String(step.root)},
      {label:"Tree edges",value:edgesText(step.nodes)},
      {label:"Node heights and balance factors",value:step.nodes.map(node=>`${node.key}: height ${node.height}, BF ${node.balance}`).join("; ")||"empty tree"},
      {label:"Height h",value:String(step.height)},
      {label:"Inorder keys",value:step.inorder.join(", ")||"empty"},
      {label:"Balance convention",value:"Height counts edges; empty subtree height is −1, leaf height is 0. BF = height(left) − height(right)."},
      {label:"AVL balance status",value:step.balanced?"all nodes have |BF|≤1":`unbalanced at ${step.nodes.filter(node=>Math.abs(node.balance)>1).map(node=>`${node.key} (BF ${node.balance})`).join(", ")}${step.avl?"; repair pending":"; ordinary BST does not repair balance"}`},
      {label:"Ancestors checked upward",value:step.checked.join(" → ")||"none"},
      {label:"Nearest unbalanced ancestor",value:step.pivot===null?"none selected":String(step.pivot)},
      {label:"Rotation plan",value:step.plan?`${step.plan.type} at ${step.plan.pivot}; heavy child ${step.plan.child}; pivot BF ${step.plan.balance}, child BF ${step.plan.childBalance}`:"none"},
      {label:"Last rotation",value:step.rotation?`${step.rotation.case} part ${step.rotation.part}/${step.rotation.total}; ${step.rotation.direction} at ${step.rotation.oldRoot}, new subtree root ${step.rotation.newRoot}, parent ${step.rotation.parent??"none"}`:"none"},
      {label:"Transferred middle subtree",value:step.rotation?step.rotation.transferred===null?"empty subtree":`${step.rotation.transferred} moves to ${step.rotation.oldRoot}'s ${step.rotation.direction==="R"?"left":"right"} child`:"none"},
      {label:"Edges before last rotation",value:step.rotation?edgesText(step.rotation.before):"none"},
      {label:"Edges after last rotation",value:step.rotation?edgesText(step.rotation.after):"none"},
      {label:"Per-insertion comparisons",value:step.perInsertComparisons.map((value,index)=>`${step.keys[index]}: ${value??"not begun"}`).join("; ")},
      {label:"Per-insertion rotations",value:step.perInsertRotations.map((value,index)=>`${step.keys[index]}: ${value??"not begun"}`).join("; ")},
      {label:"Key comparisons",value:String(step.comparisons)},
      {label:"Rotations",value:String(step.rotations)}
    ]
  };
}
