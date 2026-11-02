import { parseArray } from "../../core/utils.js";

export function parsePresortInput(raw) {
  const values = parseArray(raw, { min:1, max:10 });
  if (values.some(value => !Number.isInteger(value) || Math.abs(value) > 99)) throw new Error("Array entries must be integers from −99 to 99.");
  return values;
}

export function buildPresortTrace(input) {
  const original = parsePresortInput(input.join(","));
  const state = { original, values:[...original], sorted:false, i:null, comparisons:0, checkedPairs:[], equal:null, result:null };
  const trace = [];
  const emit = (phase, activeLine, message) => trace.push(structuredClone({ ...state, phase, activeLine, message, ...(phase==="ready"?{activeLabel:"Ready"}:{}) }));
  emit("ready", null, "Sorting will bring any equal keys together; then only neighboring positions need checking.");
  // The source treats sorting as one subroutine; its internal comparisons are not scan comparisons.
  state.values.sort((a,b) => a-b);
  state.sorted = true;
  emit("sort", 1, "Presort A into nondecreasing order. Any repeated value must now appear beside an equal value.");
  for (let i=0;i<state.values.length-1;i+=1) {
    state.i = i;
    state.equal = state.values[i] === state.values[i+1];
    state.comparisons += 1;
    state.checkedPairs.push({ i, left:state.values[i], right:state.values[i+1], equal:state.equal });
    emit("compare", 3, `Compare A[${i}]=${state.values[i]} and A[${i+1}]=${state.values[i+1]}: equal is ${state.equal ? "true" : "false"}.`);
    if (state.equal) {
      state.result = false;
      emit("complete", 4, `Return False: ${state.values[i]} occurs twice, at adjacent sorted positions ${i} and ${i+1}.`);
      return trace;
    }
  }
  state.i = null;
  state.equal = null;
  state.result = true;
  emit("complete", 5, `Return True: all ${state.comparisons} adjacent comparisons found different values.`);
  return trace;
}

export function describePresort(step) {
  const indexed = values => values.map((value,index)=>`A[${index}]=${value}`).join("; ");
  return {
    summary:step.message,
    state:[
      {label:"Original array",value:indexed(step.original)},
      {label:"Current array A",value:indexed(step.values)},
      {label:"Transformation",value:step.sorted ? "A is sorted in nondecreasing order" : "presorting not yet performed"},
      {label:"Scan index i",value:step.i === null ? "none" : String(step.i)},
      {label:"Current neighboring pair",value:step.i === null ? "none" : `A[${step.i}]=${step.values[step.i]}; A[${step.i+1}]=${step.values[step.i+1]}`},
      {label:"Equality result",value:step.equal === null ? "not evaluated" : String(step.equal)},
      {label:"Checked neighboring pairs",value:step.checkedPairs.map(pair=>`(${pair.i},${pair.i+1}): ${pair.left}=${pair.right} is ${pair.equal}`).join("; ") || "none"},
      {label:"Why neighbors suffice",value:"Equal keys form a consecutive group after sorting; any repeated value therefore creates an equal neighboring pair."},
      {label:"Uniqueness result",value:step.result === null ? "not returned" : step.result ? "True: every key is unique" : "False: repeated keys found"},
      {label:"Count scope",value:"Only evaluated A[i]=A[i+1] tests are counted; the sorting subroutine's comparisons and loop guards are excluded."},
      {label:"Adjacent comparisons",value:String(step.comparisons)}
    ]
  };
}

export function parseHornerInput(raw) {
  const parts = String(raw).split("|").map(part=>part.trim());
  if (parts.length !== 2 || parts.some(part=>!part)) throw new Error("Enter coefficients from highest power to constant, then | x; for example 2,-1,3,1,-5 | 3.");
  const coefficients = parseArray(parts[0], {min:1,max:8});
  const x = Number(parts[1]);
  if (coefficients.some(value=>!Number.isInteger(value)||Math.abs(value)>20)) throw new Error("Use 1–8 integer coefficients from −20 to 20.");
  if (coefficients.length>1 && coefficients[0]===0) throw new Error("The highest-degree coefficient must be nonzero; remove leading zeros.");
  if (!Number.isInteger(x)||Math.abs(x)>10) throw new Error("The evaluation point x must be an integer from −10 to 10.");
  return { P:[...coefficients].reverse(), x };
}

export function buildHornerTrace(input) {
  const {P,x} = parseHornerInput(`${[...input.P].reverse().join(",")} | ${input.x}`);
  const n = P.length-1;
  const state = { P, x, n, i:null, p:null, previous:null, product:null, accumulators:Array(P.length).fill(null), multiplications:0, additions:0, result:null };
  const trace = [];
  const emit = (phase,activeLine,message) => trace.push(structuredClone({...state,phase,activeLine,message,...(phase==="ready"?{activeLabel:"Ready"}:{})}));
  emit("ready",null,"Rewrite the polynomial as a nested multiply-and-add expression, reusing the running value p.");
  state.p = P[n];
  state.accumulators[n] = state.p;
  emit("initialize",1,`Start with the highest coefficient: p ← P[${n}] = ${state.p}. No multiplication or addition yet.`);
  for(let i=n-1;i>=0;i-=1){
    state.i = i;
    state.previous = state.p;
    state.product = x*state.p;
    state.p = state.product+P[i];
    state.accumulators[i] = state.p;
    state.multiplications += 1;
    state.additions += 1;
    emit("update",3,`p ← ${x} × (${state.previous}) + (${P[i]}) = ${state.p}; one multiplication and one addition.`);
  }
  state.i = null;
  state.result = state.p;
  emit("complete",4,`Return p(${x}) = ${state.p}, using ${state.multiplications} multiplications and ${state.additions} additions.`);
  return trace;
}

export function describeHorner(step) {
  return {
    summary:step.message,
    state:[
      {label:"Polynomial degree n",value:String(step.n)},
      {label:"Coefficients P",value:step.P.map((value,index)=>`P[${index}]=${value}, coefficient of x^${index}`).join("; ")},
      {label:"Evaluation point x",value:String(step.x)},
      {label:"Loop index i",value:step.i === null ? "none" : String(step.i)},
      {label:"Running value p",value:step.p === null ? "not initialized" : String(step.p)},
      {label:"Current multiply-and-add",value:step.i === null ? "none" : `${step.x} × (${step.previous}) = ${step.product}; add P[${step.i}]=${step.P[step.i]} to get ${step.p}`},
      {label:"Retained accumulators",value:[...step.P.keys()].reverse().map(index=>`under P[${index}]: ${step.accumulators[index] === null ? "not evaluated" : step.accumulators[index]}`).join("; ")},
      {label:"Representation change",value:"The expanded powers are replaced by nested operations: start at P[n] and repeatedly replace p with x·p+P[i], for i=n−1 down to 0."},
      {label:"Returned value",value:step.result === null ? "not returned" : String(step.result)},
      {label:"Multiplications",value:String(step.multiplications)},
      {label:"Additions",value:String(step.additions)}
    ]
  };
}
