import { selectionSortModule } from "./selection-sort.js?v=20260916-1";
import { bubbleSortModule } from "./bubble-sort.js?v=20260916-1";
import { stringMatchingModule } from "./string-matching.js?v=20260916-7";
import { closestPairModule } from "./closest-pair.js?v=20260916-1";

export const lecture04 = {
  id: "04-brute-force",
  number: "04",
  title: "Brute-Force Algorithms",
  shortTitle: "Brute force",
  summary: "Apply direct definitions, count repeated comparisons, and expose the resulting sums.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [
    selectionSortModule,
    bubbleSortModule,
    stringMatchingModule,
    closestPairModule
  ]
};
