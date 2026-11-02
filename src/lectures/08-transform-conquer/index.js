import {presortUniquenessModule,hornerModule} from "./array-modules.js?v=20261101-2";
import {bstInsertionModule,avlInsertionModule} from "./tree-modules.js?v=20261101-2";

export const lecture08={
  id:"08-transform-conquer",number:"08",title:"Transform and Conquer",shortTitle:"Transform and conquer",
  summary:"Transform the instance or representation, then solve the simpler problem; connect the trace to its counted operations.",
  workflow:["Trace","Count","Generalize"],
  modules:[presortUniquenessModule,hornerModule,bstInsertionModule,avlInsertionModule]
};
