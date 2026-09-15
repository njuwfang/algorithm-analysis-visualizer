import { binaryIterativeModule } from "./binary-iterative.js?v=20260915-5";
import { hanoiModule } from "./hanoi.js?v=20260915-5";
import { binaryRecursiveModule } from "./binary-recursive.js?v=20260915-5";
import { masterTheoremModule } from "./master-theorem.js?v=20260915-5";

export const lecture03 = {
  id: "03-analysis",
  number: "03",
  title: "Analysis of Algorithms",
  shortTitle: "Analysis foundations",
  summary: "Count a basic operation, express the count as a sum or recurrence, and state the order of growth.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [
    binaryIterativeModule,
    hanoiModule,
    binaryRecursiveModule,
    masterTheoremModule
  ]
};
