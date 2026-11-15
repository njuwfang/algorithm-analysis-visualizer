import {fibonacciRecursiveModule,fibonacciBottomUpModule,coinRowModule,knapsackBottomUpModule,knapsackMemoryModule} from "./modules.js?v=20261114-1";
import {gridPathsModule,matrixChainModule} from "./extension-modules.js?v=20261115-1";

export const lecture10={
  id:"10-dynamic-programming",number:"10",title:"Dynamic Programming",shortTitle:"Dynamic programming",
  summary:"Record overlapping subproblems once, follow their dependency order, and recover optimal choices from retained answers.",
  workflow:["Trace","Count","Generalize"],
  modules:[fibonacciRecursiveModule,fibonacciBottomUpModule,coinRowModule,knapsackBottomUpModule,knapsackMemoryModule,gridPathsModule,matrixChainModule]
};
