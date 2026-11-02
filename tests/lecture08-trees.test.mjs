import test from "node:test";
import assert from "node:assert/strict";
import {buildBstTrace,buildAvlTrace,parseTreeKeys,describeTree} from "../src/lectures/08-transform-conquer/tree-trace.js";

function inspect(step){
  const map=new Map(step.nodes.map(node=>[node.key,node])),seen=new Set(),inorder=[];
  function walk(key,low=-Infinity,high=Infinity){
    if(key===null)return -1;
    assert.ok(map.has(key),`missing node ${key}`);
    assert.ok(!seen.has(key),`cycle or multiple parents at ${key}`);seen.add(key);
    assert.ok(key>low&&key<high,`BST bound violated at ${key}`);
    const node=map.get(key),left=walk(node.left,low,key);inorder.push(key);const right=walk(node.right,key,high);
    assert.equal(node.height,Math.max(left,right)+1);
    assert.equal(node.balance,left-right);
    return node.height;
  }
  assert.equal(walk(step.root),step.height);
  assert.equal(seen.size,step.nodes.length);
  assert.deepEqual(inorder,step.inorder);
  assert.deepEqual(inorder,[...step.keys.slice(0,step.inserted)].sort((a,b)=>a-b));
  assert.equal(step.balanced,step.nodes.every(node=>Math.abs(node.balance)<=1));
}
function referenceAvl(keys){
  const h=node=>node?1+Math.max(h(node.left),h(node.right)):-1;
  const rotateRight=node=>{const root=node.left;node.left=root.right;root.right=node;return root;};
  const rotateLeft=node=>{const root=node.right;node.right=root.left;root.left=node;return root;};
  function insert(node,key){
    if(!node)return {key,left:null,right:null};
    if(key<node.key)node.left=insert(node.left,key);else node.right=insert(node.right,key);
    const bf=h(node.left)-h(node.right);
    if(bf>1){if(key>node.left.key)node.left=rotateLeft(node.left);return rotateRight(node);}
    if(bf< -1){if(key<node.right.key)node.right=rotateRight(node.right);return rotateLeft(node);}
    return node;
  }
  let root=null;for(const key of keys)root=insert(root,key);
  const edges=[];function collect(node){if(!node)return;edges.push([node.key,node.left?.key??null,node.right?.key??null]);collect(node.left);collect(node.right);}collect(root);
  return {root:root?.key??null,edges:edges.sort((a,b)=>a[0]-b[0])};
}
const edges=step=>step.nodes.map(node=>[node.key,node.left,node.right]).sort((a,b)=>a[0]-b[0]);

test("ordinary BST construction reproduces source examples and exposes degeneracy",()=>{
  const balanced=buildBstTrace([4,2,6,1,3,5,7]).at(-1),chain=buildBstTrace([1,2,3,4,5,6,7]).at(-1);
  assert.equal(balanced.root,4);assert.equal(balanced.height,2);assert.equal(balanced.comparisons,10);
  assert.equal(chain.root,1);assert.equal(chain.height,6);assert.equal(chain.comparisons,21);
  const worked=buildBstTrace([47,25,11,43,77,65,93,7,17,44,31,68]).at(-1);
  assert.equal(worked.height,3);assert.equal(worked.root,47);
  assert.deepEqual(edges(worked),[[7,null,null],[11,7,17],[17,null,null],[25,11,43],[31,null,null],[43,31,44],[44,null,null],[47,25,77],[65,null,68],[68,null,null],[77,65,93],[93,null,null]]);
  for(const step of [balanced,chain,worked])inspect(step);
});

test("AVL follows slides 54–64, repairing the nearest ancestor and all four rotation types",()=>{
  const trace=buildAvlTrace([5,6,8,3,2,4,7]),final=trace.at(-1);
  assert.deepEqual(trace.filter(step=>step.phase==="insert-complete").map(step=>step.root),[5,5,6,6,6,5,5]);
  assert.deepEqual(trace.filter(step=>step.phase==="plan").map(step=>[step.key,step.pivot,step.plan.type]),[[8,5,"L"],[2,5,"R"],[4,6,"LR"],[7,6,"RL"]]);
  assert.deepEqual(trace.filter(step=>step.phase==="rotate").map(step=>step.rotation.direction),["L","R","L","R","R","L"]);
  assert.equal(final.rotations,6);assert.equal(final.height,2);
  assert.deepEqual(edges(final),[[2,null,null],[3,2,4],[4,null,null],[5,3,7],[6,null,null],[7,6,8],[8,null,null]]);
  for(const step of trace){inspect(step);if(["insert-complete","complete"].includes(step.phase))assert.equal(step.balanced,true);}
  const nearest=trace.find(step=>step.phase==="plan"&&step.key===2);
  assert.equal(nearest.pivot,5);
  assert.equal(nearest.nodes.find(node=>node.key===6).balance,2,"higher ancestor also unbalanced before repairing the lower one");
  const middle=trace.find(step=>step.phase==="rotate"&&step.rotation.transferred===4);
  assert.ok(middle,"nonempty middle subtree is retained through the LR rotation");
});

test("R, L, LR, and RL rotations preserve ordered keys and count elementary rotations",()=>{
  for(const [keys,type,count] of [[[3,2,1],"R",1],[[1,2,3],"L",1],[[3,1,2],"LR",2],[[1,3,2],"RL",2]]){
    const trace=buildAvlTrace(keys),final=trace.at(-1);
    assert.equal(final.root,2);assert.equal(final.rotations,count);
    assert.equal(trace.find(step=>step.phase==="plan").plan.type,type);
    assert.deepEqual(edges(final),[[1,null,null],[2,1,3],[3,null,null]]);
    trace.forEach(inspect);
  }
});

function* permutations(values){if(!values.length){yield [];return;}for(let i=0;i<values.length;i++)for(const rest of permutations(values.filter((_,index)=>index!==i)))yield [values[i],...rest];}
test("all five-key orders and longer source exercises agree with an independent recursive AVL oracle",()=>{
  const cases=[...permutations([1,2,3,4,5]),[1,2,3,4,5,6],[6,5,4,3,2,1],[3,6,5,1,2,4],[-4,0,7,-9,-2,3,9,1,5,8,10,6]];
  for(const keys of cases){
    const trace=buildAvlTrace(keys),final=trace.at(-1),oracle=referenceAvl(keys);
    assert.equal(final.root,oracle.root);assert.deepEqual(edges(final),oracle.edges);
    assert.ok(final.rotations<=2*keys.length);
    for(const step of trace.filter(step=>step.phase==="insert-complete")){
      const expected=referenceAvl(keys.slice(0,step.inserted));
      assert.equal(step.root,expected.root);assert.deepEqual(edges(step),expected.edges);inspect(step);assert.equal(step.balanced,true);
    }
  }
});

test("tree events, counters, immutable snapshots, and stable descriptions agree",()=>{
  for(const build of [buildBstTrace,buildAvlTrace]){
    const input=Object.freeze([5,6,8,3,2,4,7]),trace=build(input),labels=describeTree(trace[0]).state.map(row=>row.label);
    assert.equal(new Set(labels).size,labels.length);assert.deepEqual(trace,build(input));
    for(const [index,step] of trace.entries()){
      const before=structuredClone(step),description=describeTree(step);
      assert.equal(description.summary,step.message);assert.deepEqual(description.state.map(row=>row.label),labels);
      assert.equal(step.comparisons-(trace[index-1]?.comparisons??0),step.phase==="compare"?1:0);
      assert.equal(step.rotations-(trace[index-1]?.rotations??0),step.phase==="rotate"?1:0);
      if(step.phase==="rotate")assert.equal(step.activeLine,7);
      if(step.phase==="compare")assert.equal(step.activeLine,step.avl?2:4);
      assert.deepEqual(step,before);inspect(step);
    }
    trace.at(-1).nodes[0].left=999;assert.equal(trace[0].nodes.length,0);assert.notEqual(trace[2].nodes[0]?.left,999);
  }
  for(const raw of ["","1,1","1.5,2","-100,3",Array.from({length:13},(_,i)=>i).join(",")])assert.throws(()=>parseTreeKeys(raw));
});
