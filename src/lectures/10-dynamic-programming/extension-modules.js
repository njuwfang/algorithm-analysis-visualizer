import {buildGridPaths,describeGridPaths,parseGridPaths} from "./grid-paths-trace.js?v=20261115-1";
import {buildMatrixChain,describeMatrixChain,parseMatrixChain} from "./matrix-chain-trace.js?v=20261115-1";
import {renderGridPaths,renderMatrixChain} from "./extension-views.js?v=20261115-1";

export const gridPathsModule={
  id:"grid-paths",shortTitle:"Counting grid paths",title:"Counting Paths — Anti-Diagonal Order",
  summary:"Count right/down paths using two saved neighbors, and finish each anti-diagonal before the next.",
  complexity:"Θ((r+1)(c+1)) time and table space",source:{slides:"Instructor-requested extension; not in the supplied Lecture 10 deck. CMI/NPTEL Grid Paths, pp. 13–14 and 34–41; row/down orientation and executable outline authored."},
  objective:"Explain why coordinate sum orders dependencies and why states within one anti-diagonal can be computed independently.",
  input:{label:"Destination row r, column c",hint:"Enter two whole numbers from 0 to 5, such as 2,2. Start (0,0); move only right or down.",default:"2,2",presets:[
    {label:"Worked grid · (2,2)",value:"2,2"},{label:"Larger square · (3,3)",value:"3,3"},{label:"Rectangle · (2,4)",value:"2,4"},
    {label:"One row · (0,4)",value:"0,4"},{label:"Start is destination",value:"0,0"}
  ],parse:parseGridPaths},
  pseudocode:[
    {line:1,text:"F[0,0] ← 1"},{line:2,text:"for k ← 1..r+c"},
    {line:3,text:"for i ← max(0,k−c)..min(r,k)",indent:1},{line:4,text:"j ← k−i",indent:2},
    {line:5,text:"if i=0 or j=0: F[i,j] ← 1",indent:2},
    {line:6,text:"else: a ← F[i−1,j]; b ← F[i,j−1]",indent:2},
    {line:7,text:"F[i,j] ← a + b",indent:3,basic:true,basicLabel:"one addition"},
    {line:8,text:"return F[r,c]"}
  ],buildTrace:buildGridPaths,render:renderGridPaths,describe:describeGridPaths,
  metrics:step=>[{label:"Additions",value:step.additions,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}A(r,c)=\\sum_{i=1}^{r}\\sum_{j=1}^{c}1=rc=${step.additions}\\\\T,S\\in\\Theta((r+1)(c+1))\\end{gathered}`:
    "\\begin{gathered}F[i,j]=F[i-1,j]+F[i,j-1]\\\\(i-1)+j=i+(j-1)=k-1\\end{gathered}",
    notes:["F[0,j]=F[i,0]=1. Every interior cell adds two counts from diagonal k−1; no same-diagonal dependency. Counted additions exclude boundary assignments and loop checks. Unit-cost integer arithmetic; retained full table."]};},
  analysis:[
    {term:"State and input size",value:"F[i,j] is the number of right/down paths from (0,0) to (i,j). r and c count required down and right moves; there are (r+1)(c+1) grid cells. Coordinates start at zero."},
    {term:"Correctness",value:"Every path reaching an interior cell ends with either a down move from above or a right move from the left. These cases are disjoint and cover all paths, so add their counts. The origin has one empty path; each boundary cell has one route."},
    {term:"Evaluation order",value:"At coordinate sum k, each nonboundary cell uses only sum k−1. Completing diagonals in increasing k is valid; cells within a diagonal are independent. Each cell needs at most two previous-diagonal entries, not every entry. Row-by-row is also valid."},
    {term:"Count and cost model",value:"Exactly rc additions, one for every interior cell, plus r+c+1 boundary assignments. Time and retained table space are Θ((r+1)(c+1)), including a single row, column, or origin. Unit-cost arithmetic is assumed; path-count bit growth and display snapshots are excluded."},
    {term:"Worked example and extension status",value:"For (2,2), diagonal 2 contains 1,2,1; diagonal 3 contains 3,3; the destination count is 6. This is an instructor-requested extension with authored small inputs, not a worked example attributed to the supplied Lecture 10 PDF."}
  ]
};

export const matrixChainModule={
  id:"matrix-chain",shortTitle:"Matrix-chain multiplication",title:"Matrix-Chain Multiplication — Choosing Parentheses",
  summary:"Try each final split, reuse the two interval optima, and recover parentheses minimizing scalar multiplications.",
  complexity:"Θ(n³) time; Θ(n²) table space",source:{slides:"Instructor-requested extension; not in the supplied Lecture 10 deck. MIT 6.006 Fall 2011 Lecture 21, p. 2; inclusive 1-based intervals, worked dimensions and executable/recovery outlines authored."},
  objective:"Define an interval state, distinguish the two saved subchain costs from the join cost, and count all candidate split comparisons.",
  input:{label:"Dimension sequence p₀, …, pₙ",hint:"Use 2–7 dimensions from 1 to 100. Example 10,5,50 defines A1:10×5 and A2:5×50.",default:"10,5,50,2,20",presets:[
    {label:"Interior interval reused",value:"10,5,50,2,20"},{label:"Three matrices",value:"10,30,5,60"},
    {label:"Equal dimensions · ties",value:"10,10,10,10,10"},{label:"One matrix · base",value:"10,5"}
  ],parse:parseMatrixChain},
  pseudocode:[
    {line:1,text:"for i ← 1..n: M[i,i] ← 0"},{line:2,text:"for L ← 2..n"},
    {line:3,text:"for i ← 1..n−L+1; j ← i+L−1",indent:1},
    {line:4,text:"best ← ∞; split ← none",indent:2},{line:5,text:"for k ← i..j−1",indent:2},
    {line:6,text:"q ← M[i,k]+M[k+1,j]+p[i−1]p[k]p[j]",indent:3},
    {line:7,text:"if q < best",indent:3,basic:true,basicLabel:"one split comparison"},
    {line:8,text:"best ← q; split ← k",indent:4},{line:9,text:"M[i,j] ← best; S[i,j] ← split",indent:2},
    {line:10,text:"pending ← [(1,n)]; expanded ← ∅"},{line:11,text:"while pending ≠ ∅"},
    {line:12,text:"(i,j) ← pop(pending)",indent:1},{line:13,text:"if i<j: expand at S[i,j]; push both parts",indent:1},
    {line:14,text:"return M[1,n], parentheses"}
  ],buildTrace:buildMatrixChain,render:renderMatrixChain,describe:describeMatrixChain,
  metrics:step=>[{label:"Split comparisons",value:step.comparisons,emphasis:true}],
  model(step){return {latex:step.phase==="complete"?`\\begin{gathered}C(n)=\\sum_{L=2}^{n}(n-L+1)(L-1)\\\\=\\frac{n(n^2-1)}6=${step.comparisons}\\\\T\\in\\Theta(n^3),\\quad S\\in\\Theta(n^2)\\end{gathered}`:
    "\\begin{gathered}q_k=M[i,k]+M[k+1,j]\\\\\\qquad{}+p_{i-1}p_kp_j\\\\M[i,j]=\\min_{i\\le k<j}q_k\\end{gathered}",
    notes:["M[i,i]=0; Ai has dimensions p[i−1]×p[i]. Fill by increasing interval length. Count q<best once per candidate, including the first candidate against ∞. Recovery uses saved splits. Unit-cost arithmetic; standard scalar multiplication cost for joining matrices."]};},
  analysis:[
    {term:"Problem and state",value:"The matrix order stays fixed. Choose parentheses; do not compute matrix entries. M[i,j] is the least number of scalar multiplications for Ai…Aj. Both endpoints matter: interior intervals such as A2A3 must be represented."},
    {term:"Final multiplication",value:"Splitting after Ak gives left result p[i−1]×p[k] and right result p[k]×p[j]. Their classical multiplication costs p[i−1]p[k]p[j], in addition to both saved subchain costs. This is not the Strassen algorithm from Lecture 07."},
    {term:"Correctness and evaluation order",value:"Every parenthesization has one final split. If either subchain were computed with more than its minimum cost, replacing it by its optimum would improve the whole product. Try all splits and take the minimum. Both intervals are shorter, so increasing interval length supplies every dependency."},
    {term:"Count and storage",value:"An interval of length L tries L−1 splits, with n−L+1 such intervals. The sum of split comparisons is n(n²−1)/6. Constant work per candidate gives Θ(n³) time; the cost and split tables use Θ(n²) space. A single matrix has cost zero and no split comparisons. Recovery visits 2n−1 intervals and takes Θ(n) algorithmic work, excluding display-string construction and retained teaching history."},
    {term:"Ties and recovery",value:"Strict q<best keeps the earliest split on ties. After all costs are saved, a stack visits the root and follows saved splits, left child first. This recovers the parentheses without running any new candidate comparisons."},
    {term:"Worked extension",value:"Dimensions 10,5,50,2,20 give M[2,3]=500, reused in M[1,3]=600 and M[2,4]=700. Final candidates are 1700,14500,1000; the optimum is ((A1(A2A3))A4), cost 1000. Dimensions 10,30,5,60 give 4500 versus 27000. These inputs and the inclusive 1-based notation are instructor-requested extensions to the supplied deck."}
  ]
};
