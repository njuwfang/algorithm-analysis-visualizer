import { travelingSalesmanModule } from "./traveling-salesman.js?v=20260916-1";
import { knapsackModule } from "./knapsack.js?v=20260916-1";
import { assignmentModule } from "./assignment.js?v=20260916-1";

export const lecture05 = {
  id: "05-exhaustive-search",
  number: "05",
  title: "Exhaustive Search",
  shortTitle: "Exhaustive search",
  summary: "Generate every candidate, evaluate feasibility or cost, and retain the best solution.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [
    travelingSalesmanModule,
    knapsackModule,
    assignmentModule
  ]
};
