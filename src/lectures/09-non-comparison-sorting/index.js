import { countingSortModule } from "./counting-sort.js?v=20261109-2";
import { radixSortModule } from "./radix-sort.js?v=20261109-2";
import { msdRadixSortModule } from "./msd-radix-sort.js?v=20261109-2";
import { americanFlagSortModule } from "./american-flag-sort.js?v=20261109-2";

export const lecture09 = {
  id: "09-non-comparison-sorting", number: "09",
  title: "Non-Comparison Based Sorting", shortTitle: "Non-comparison sorting",
  summary: "Sort restricted keys by their values or digits, then count how both input length and representation affect the work.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [countingSortModule, radixSortModule, msdRadixSortModule, americanFlagSortModule]
};
