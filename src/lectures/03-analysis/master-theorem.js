import { masterTheoremProcess } from "../../core/master-theorem.js?v=20261023-1";

export { buildMasterTheoremTrace, classifyMasterCase, parseMasterTheoremInput } from "../../core/master-theorem.js?v=20261023-1";

export const masterTheoremModule = {
  ...masterTheoremProcess,
  id: "master-theorem",
  shortTitle: "Master theorem",
  title: "Master Theorem",
  summary: "Watch branching create more subproblems while shrinking makes each subproblem cheaper, then see which force controls the recursion tree.",
  complexity: "Determined by how work is distributed across the recursion tree",
  source: { slides: "Instructor-requested extension; not in the supplied Lecture 03 deck" },
  tags: ["recursive", "recurrence", "divide-and-conquer"],
  objective: "Explain the Master Theorem by seeing whether a recursion tree narrows, stays level, or widens toward its leaves."
};
