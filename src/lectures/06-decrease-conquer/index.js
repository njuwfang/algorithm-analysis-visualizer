import { powerOneModule, powerSquaringModule } from "./power.js?v=20261004-1";
import { insertionSortModule } from "./insertion-sort.js?v=20261004-1";
import { shellsortModule } from "./shellsort.js?v=20261004-4";
import { binarySearchModule } from "./binary-search.js?v=20261004-1";
import { russianPeasantModule } from "./russian-peasant.js?v=20261004-1";
import { interpolationSearchModule } from "./interpolation-search.js?v=20261005-1";
import { euclidModule } from "./euclid.js?v=20261004-1";
import { lomutoPartitionModule } from "./lomuto-partition.js?v=20261004-1";
import { quickselectModule } from "./quickselect.js?v=20261005-2";

export const lecture06 = {
  id: "06-decrease-conquer",
  number: "06",
  title: "Decrease and Conquer",
  shortTitle: "Decrease and conquer",
  summary: "Reduce to one smaller instance, solve it, and extend the result: by a constant, a constant factor, or a variable amount.",
  workflow: ["Trace", "Count", "Generalize"],
  modules: [
    powerOneModule,
    powerSquaringModule,
    insertionSortModule,
    shellsortModule,
    binarySearchModule,
    russianPeasantModule,
    interpolationSearchModule,
    euclidModule,
    lomutoPartitionModule,
    quickselectModule
  ]
};
