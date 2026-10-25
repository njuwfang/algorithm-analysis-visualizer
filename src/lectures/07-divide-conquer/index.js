import { mergeModule } from "./merge.js?v=20261023-1";
import { mergesortModule } from "./mergesort.js?v=20261023-1";
import { integerMultiplicationModule } from "./integer-multiplication.js?v=20261024-2";
import { fftMultiplicationModule } from "./fft-multiplication.js?v=20261025-5";
import { strassenModule } from "./strassen.js?v=20261025-3";

export const lecture07 = {
  id: "07-divide-conquer",
  number: "07",
  title: "Divide and Conquer",
  shortTitle: "Divide and conquer",
  summary: "Divide into subproblems, solve them recursively, and combine their results; connect the trace to its recurrence.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [mergeModule, mergesortModule, integerMultiplicationModule, fftMultiplicationModule, strassenModule]
};
