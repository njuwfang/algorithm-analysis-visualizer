import { binaryIterativeModule } from "./binary-iterative.js?v=20260913-9";
import { hanoiModule } from "./hanoi.js?v=20260913-9";
import { binaryRecursiveModule } from "./binary-recursive.js?v=20260913-9";

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
    binaryRecursiveModule
  ]
};
