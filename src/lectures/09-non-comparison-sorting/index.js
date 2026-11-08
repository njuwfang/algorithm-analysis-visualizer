import { countingSortModule } from "./counting-sort.js?v=20261108-1";
import { radixSortModule } from "./radix-sort.js?v=20261108-1";

export const lecture09 = {
  id: "09-non-comparison-sorting", number: "09",
  title: "Non-Comparison Based Sorting", shortTitle: "Non-comparison sorting",
  summary: "Sort restricted keys by their values or digits, then count how both input length and representation affect the work.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [countingSortModule, radixSortModule]
};
