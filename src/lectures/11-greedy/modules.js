import {parseChange,parseGraph,changeExamples,graphExamples} from "./shared.js?v=20261124-1";
import {buildChangeDP,describeChangeDP,buildGreedyChange,describeGreedyChange} from "./change-traces.js?v=20261124-1";
import {buildPrim,describePrim,buildKruskal,describeKruskal} from "./mst-traces.js?v=20261124-1";
import {renderChangeDP,renderGreedyChange,renderPrim,renderKruskal} from "./views.js?v=20261124-1";

export const changeDPModule={
  id:"change-making-dp",shortTitle:"Change-making · DP",title:"Change-Making — Dynamic Programming",
  summary:"Try each possible last coin and retain the minimum count for every smaller amount.",
  complexity:"Θ(Md+1) time; Θ(M+1) extra table space",source:{slides:"2–19; executable outline and saved-coin recovery reconstructed from the recurrence"},
  objective:"Explain the lecture's recurrence, distinguish saved subproblems from repeated recursive calls, and recover actual change.",
  input:{label:"Money | denominations",hint:"Money 0–240; 1–6 distinct positive integer denominations, each at most 1000. Unlimited copies.",default:changeExamples.recurrence,presets:[
    {label:"Lecture recurrence · 9",value:changeExamples.recurrence},{label:"USA example · 40",value:changeExamples.usa},{label:"Tanzania example · 40",value:changeExamples.tanzania}
  ],parse:parseChange},
  pseudocode:[
    {line:1,text:"MinNumCoins[0] ← 0"},{line:2,text:"for m ← 1..money"},
    {line:3,text:"best ← ∞; last ← none",indent:1},{line:4,text:"for each coin in denominations",indent:1},
    {line:5,text:"if coin > m: continue",indent:2},{line:6,text:"q ← MinNumCoins[m−coin]+1",indent:2},
    {line:7,text:"if q < best",indent:2,basic:true,basicLabel:"one candidate comparison"},
    {line:8,text:"best ← q; last ← coin",indent:3},{line:9,text:"MinNumCoins[m] ← best; Last[m] ← last",indent:1},
    {line:10,text:"r ← money, unless MinNumCoins[money]=∞"},
    {line:11,text:"while r>0: take Last[r]; r ← r−Last[r]"},{line:12,text:"return minimum and recovered coins"}
  ],buildTrace:buildChangeDP,render:renderChangeDP,describe:describeChangeDP,
  metrics:s=>[{label:"Candidate comparisons",value:s.comparisons,emphasis:true}],
  model(s){return {latex:s.phase==="complete"?`\\begin{gathered}C(M,D)=\\sum_{c\\in D}\\max(0,M-c+1)\\\\=${s.comparisons},\\quad T\\in\\Theta(Md+1)\\end{gathered}`:
    "\\begin{gathered}F(0)=0\\\\F(m)=\\min_{c\\in D,\\ c\\le m}\\{F(m-c)+1\\}\\end{gathered}",
    notes:["F is MinNumCoins; D is the denomination set, d=|D|, M=money. A minimum over no finite candidates is ∞. Count comparisons only for fitting coins; all d fit guards still take time for each positive amount. Unit-cost arithmetic; numeric-M bound is pseudopolynomial."]};},
  analysis:[
    {term:"State and base",value:"MinNumCoins[m] is the minimum number of coins totaling m. Zero needs zero coins. Dots are uncomputed amounts; infinity is an evaluated amount with no exact solution."},
    {term:"Why the recurrence works",value:"Any nonempty exact change has some last coin c. Remove it to leave amount m−c; that remainder must use a minimum-count solution, or replacing it would improve the whole change. Try every legal c and retain the smallest count."},
    {term:"Counting and time",value:"One q<best comparison is counted per fitting coin, including the first comparison against infinity. C=Σc max(0,M−c+1). Every amount still checks all d denominations, so total time is Θ(Md+1) with supplied input. The count/choice tables use Θ(M+1) extra space; recovery is O(M) and adds no candidate comparisons."},
    {term:"Tie convention",value:"Equal finite candidates keep the first denomination in input order. Saved last coins recover one minimum solution; multiple minimum solutions can exist."},
    {term:"Lecture example",value:"For 9 and denominations 6,5,1 the table is 0,1,2,3,4,1,1,2,3,4. There are 18 candidate comparisons and the minimum is four coins. This process is the reference used after the greedy trace."},
    {term:"Source reconstruction",value:"The deck prints recurrence/table builds, with some reused displayed operands in early builds, rather than executable pseudocode. This outline uses the current amount, omits negative predecessor amounts, and explicitly handles impossible change. The reconstruction is documented in SOURCE_NOTES."}
  ]
};
export const greedyChangeModule={
  id:"greedy-change",shortTitle:"Change-making · greedy",title:"Change-Making — Greedy Choices",
  summary:"Commit the largest fitting coin, then compare the completed result with the preceding DP method.",
  complexity:"O(d log(d+1)+K) greedy work; optimality depends on denominations",source:{slides:"2–4, 20–25; executable descending-coin outline reconstructed"},
  objective:"Identify feasible, locally optimal and unchangeable choices, and use the source's Tanzania system to refute general optimality.",
  input:{...changeDPModule.input,default:changeExamples.usa,presets:[
    {label:"USA example · 40",value:changeExamples.usa},{label:"Tanzania example · 40",value:changeExamples.tanzania},
    {label:"Earlier recurrence · 9",value:changeExamples.recurrence},{label:"UAE example · 240 fils",value:changeExamples.uae}
  ]},
  pseudocode:[
    {line:1,text:"sort denominations in descending order"},{line:2,text:"r ← money; chosen ← []"},
    {line:3,text:"for each coin, while r>0"},
    {line:4,text:"test coin ≤ r; if false: next denomination",indent:1,basic:true,basicLabel:"one coin-fit test"},
    {line:5,text:"take coin; r ← r−coin; repeat test if r>0",indent:1},
    {line:6,text:"return chosen and remaining r"},{line:7,text:"Compare with DP minimum (separate reference)"}
  ],buildTrace:buildGreedyChange,render:renderGreedyChange,describe:describeGreedyChange,
  metrics:s=>[{label:"Coin-fit tests",value:s.tests,emphasis:true}],
  model(s){const failures=s.tests-s.selected.length;return {latex:s.phase==="complete"?`\\begin{gathered}H=K+f=${s.selected.length}+${failures}=${s.tests}\\\\0\\le f\\le d\\\\T\\in O(d\\log(d+1)+K)\\end{gathered}`:
    "\\begin{gathered}c^*=\\max\\{c\\in D:c\\le r\\}\\\\r\\leftarrow r-c^*\\end{gathered}",
    notes:["K is the number of coins taken; f counts failed fit tests. Descending order makes at most d failures possible. Sorting is included in total time; the final DP reference is excluded. The greedy output need not be minimum, and can fail to make exact change."]};},
  analysis:[
    {term:"Three greedy conditions",value:"Feasible: a chosen coin does not exceed the remainder. Locally optimal: it is the largest feasible denomination. Unchangeable: that committed coin is never replaced later. These conditions alone do not prove a globally minimum number of coins."},
    {term:"Lecture currencies",value:"Use the denominations pictured in the lecture, expressed as integer units. USA: 50,25,10,5,1. UAE: 100,50,25,10,5,1 fils. Tanzania: 100,50,25,20,10,5. They are source examples, not a statement about current coin circulation."},
    {term:"Counterexample",value:"For Tanzania money 40, greedy commits 25+10+5, three coins. DP finds 20+20, two coins. The irreversible first choice prevents greedy from reaching that minimum."},
    {term:"Count and storage",value:"Each successful test takes one coin; each failed test advances a denomination. H=K+f with f≤d. Presorting takes O(d log(d+1)); the subsequent scan takes at most O(d+K). The sorted list and explicit output need O(d+K) storage. Arithmetic and comparisons have unit cost."},
    {term:"Feasibility versus optimality",value:"If no denomination fits a positive remainder, greedy stops without exact change. The final separate DP reference distinguishes an impossible amount from a greedy failure and compares minimum counts only after the greedy run."}
  ]
};

const graphPresets=[
  {label:"Lecture worked graph",value:graphExamples.worked},{label:"Introductory MST graph",value:graphExamples.small},
  {label:"Exercise · 5 vertices",value:graphExamples.exercise},{label:"Exercise · 12 vertices",value:graphExamples.large}
];
const graphInput={label:"Start vertex | undirected edges",hint:"Use a–l and integer weights 0–99: a | ab:3,bc:1,ac:5. Connected graph; at most 24 edges.",default:graphExamples.worked,presets:graphPresets,parse:parseGraph};
export const primModule={
  id:"prim",shortTitle:"Prim’s algorithm",title:"Prim’s Algorithm — Grow One Tree",
  summary:"Compare nearest-tree labels, accept a minimum crossing edge, and update the remaining labels.",
  complexity:"Θ(n²) matrix/array time; source heap alternative O(m log n)",source:{slides:"26–46, 57–58, 61–62; label-scan refinement of the source pseudocode"},
  objective:"Explain the cut between tree and outside vertices, maintain parent/edge-weight labels, and connect array scans to the source bound.",
  input:graphInput,
  pseudocode:[
    {line:1,text:"Vₜ ← {start}; Eₜ ← ∅; labels ← ∞"},
    {line:2,text:"Update labels from start using lines 7–8"},
    {line:3,text:"repeat |V|−1 times; best ← ∞"},
    {line:4,text:"for u outside Vₜ: test label[u] < best",indent:1,basic:true,basicLabel:"one weight comparison"},
    {line:5,text:"if smaller: retain u and label[u]",indent:2},
    {line:6,text:"add closest u* and its edge to Vₜ, Eₜ",indent:1},
    {line:7,text:"for each outside neighbor u: test w(u*,u) < label[u]",indent:1,basic:true,basicLabel:"one weight comparison"},
    {line:8,text:"if smaller: label[u] ← w(u*,u); parent[u] ← u*",indent:2},
    {line:9,text:"return Eₜ"}
  ],buildTrace:buildPrim,render:renderPrim,describe:describePrim,
  metrics:s=>[{label:"Weight comparisons",value:s.comparisons,emphasis:true}],
  model(s){return {latex:s.phase==="complete"?`\\begin{gathered}C=\\sum_{t=1}^{n-1}(n-t)+m\\\\=\\frac{n(n-1)}2+m=${s.comparisons}\\\\T_{\\mathrm{matrix,array}}\\in\\Theta(n^2)\\end{gathered}`:
    "\\begin{gathered}u^*=\\arg\\min_{u\\notin V_T}\\ell(u)\\\\\\ell(u)\\leftarrow\\min(\\ell(u),w(u^*,u))\\end{gathered}",
    notes:["n=|V|, m=|E|. ℓ(u) stores one cheapest edge to the tree, not a path distance. Count outside-label and existing-edge label comparisons. Matrix/control checks also cost time. Equal weights keep earlier labels. The source adjacency-list/min-heap alternative is O(m log n)."]};},
  analysis:[
    {term:"MST objective",value:"A spanning tree connects every vertex with no cycle. The minimum spanning tree minimizes the sum of its n−1 edge weights. This differs from minimizing every path from one start vertex."},
    {term:"Safe greedy choice",value:"Choose a minimum-weight edge crossing from the current tree to an outside vertex. If an MST omits it, adding it creates a cycle; another edge on that cycle crosses the same cut and is no lighter, so replacing that edge keeps a minimum tree. Induction preserves an MST extension after each choice."},
    {term:"Labels and invariant",value:"After updates, each outside vertex stores a nearest tree vertex and that connecting edge's weight, or none/∞ if not yet adjacent. Only a strictly shorter connection changes the label. During sequential updates, remaining unprocessed labels may still describe the preceding tree."},
    {term:"Counted operation",value:"An outside-label<best test or an existing-edge-weight<label test. There are n(n−1)/2 of the first kind and m of the second kind. Root-neighbor updates are included; missing-edge/control checks are excluded from this primary count."},
    {term:"Representation and growth",value:"The executed matrix/array method uses Θ(n²) time, O(n²) matrix space and O(n) labels/output. Slide 58 also states O(m log n) for adjacency lists with a min-heap; that alternative is not animated here."},
    {term:"Lecture result and ties",value:"Starting at a, the worked vertex order is a,b,c,f,e,d and the tree edges are ab,bc,bf,ef,df, total weight 15. The equal cf:4 edge keeps f's earlier parent b. Equal minimum labels use alphabetical vertex order."}
  ]
};
export const kruskalModule={
  id:"kruskal",shortTitle:"Kruskal’s algorithm",title:"Kruskal’s Algorithm — Join Components",
  summary:"Scan edges in increasing weight order; join distinct components and expose cycles before rejecting an edge.",
  complexity:"O(m log(m+1)+n²) with explicit component labels",source:{slides:"47–56, 59–62; explicit sort from slide 48 and component-label refinement of slide 60"},
  objective:"Relate acyclicity to endpoint components, distinguish an intermediate forest from a connected tree, and explain the stopping rule.",
  input:graphInput,
  pseudocode:[
    {line:1,text:"sort edges by nondecreasing weight"},{line:2,text:"Eₜ ← ∅; ecounter ← 0; each vertex a component"},
    {line:3,text:"while ecounter < |V|−1"},{line:4,text:"take the next sorted edge (u,v)",indent:1},
    {line:5,text:"test component[u] = component[v]",indent:1,basic:true,basicLabel:"one cycle check"},
    {line:6,text:"if different: add edge; merge; ecounter++",indent:1},{line:7,text:"else: skip the edge (cycle)",indent:1},
    {line:8,text:"return Eₜ"}
  ],buildTrace:buildKruskal,render:renderKruskal,describe:describeKruskal,
  metrics:s=>[{label:"Cycle checks",value:s.checks,emphasis:true}],
  model(s){return {latex:s.phase==="complete"?`\\begin{gathered}K=${s.checks},\\quad n-1\\le K\\le m\\\\|E_T|=n-1=${s.accepted.length}\\\\T\\in O(m\\log(m+1)+n^2)\\end{gathered}`:
    "\\begin{gathered}\\operatorname{component}(u)\\ne\\operatorname{component}(v)\\\\\\Longrightarrow\\ E_T\\leftarrow E_T\\cup\\{(u,v)\\}\\end{gathered}",
    notes:["n=|V|, m=|E|. Count one cycle check per examined sorted edge; n=1 needs zero. Equal weights use alphabetical edge order. The shown component labels use constant-time equality and O(n) relabeling per merge. Sort and merge work are included in total time; displayed path witnesses are excluded."]};},
  analysis:[
    {term:"Greedy rule and invariant",value:"Scan nondecreasing edge weights. Accepted edges always form a forest: add an edge only if its endpoints belong to different components. A cheapest edge crossing an existing component's cut is a safe MST choice; equal-weight choices may give different optimal trees."},
    {term:"Why reject a cycle",value:"If the endpoints already have an accepted path between them, adding the candidate closes a cycle. The drawing highlights that path and the text names its ordered vertices. Rejection changes neither components nor retained edges."},
    {term:"Stopping and count",value:"Each acceptance reduces the number of components by one. With connected input, n−1 accepted edges form a spanning tree. K counts all examined edges, including rejected ones, so n−1≤K≤m; later sorted edges remain unexamined. A singleton needs no edge or check."},
    {term:"Representation and total time",value:"A component label per vertex gives O(1) endpoint equality. Each accepted merge relabels at most n vertices, so all merges cost O(n²). Together with comparison sorting the m edges, total time is O(m log(m+1)+n²) and storage O(m+n). The displayed endpoint path is explanatory metadata, not an extra algorithmic cycle search."},
    {term:"Source reconstruction",value:"Slide 59 assumes sorted edges; slide 48 explicitly requires the sort. The source component criterion is made executable using simple labels. No unshown union-find performance bound is assigned to this representation."},
    {term:"Lecture result",value:"Order: bc,ef,ab,bf,cf,af,df,ae,cd,de. Reject cf and af; df is the fifth accepted edge, completing weight 15 after seven cycle checks. The five-vertex exercise has weight 11; the twelve-vertex exercise has weight 36."}
  ]
};
