import { buildFftMultiplicationTrace, parseFftMultiplicationInput, formatFftComplex, fftRoot } from "./fft-trace.js?v=20261025-5";
export { buildFftMultiplicationTrace, parseFftMultiplicationInput } from "./fft-trace.js?v=20261025-5";

const show = formatFftComplex;
const vectorText = values => values === null ? "not formed" : values.map((value, index) => `[${index}]=${typeof value === "number" ? value : value === null ? "pending" : `${show(value)} (real ${value.re}, imaginary ${value.im})`}`).join("; ");
function polynomial(digits) {
  return digits.map((digit, index) => !digit ? null : index === 0 ? String(digit) : `${digit === 1 ? "" : digit}x${index === 1 ? "" : `<sup>${index}</sup>`}`).filter(Boolean).join(" + ") || "0";
}
function describe(step) {
  return {
    summary:step.message,
    state:[
      {label:"Input integers",value:`a=${step.a}; b=${step.b}`},
      {label:"Current representation",value:step.phase === "ready" ? "integers" : step.phase === "encode" ? "polynomial coefficients" : ["evaluate","pointwise"].includes(step.phase) ? "values at shared points" : step.phase === "recover" ? "product coefficients" : "decimal product"},
      {label:"Polynomial relationship",value:"a=A(10), b=B(10); C(x)=A(x)B(x), so ab=C(10). Index k is the coefficient of x^k, corresponding to decimal place 10^k."},
      {label:"A coefficients",value:vectorText(step.digitsA)},
      {label:"B coefficients",value:vectorText(step.digitsB)},
      {label:"Evaluation points",value:Array.from({length:step.N},(_,k)=>`x[${k}]=${show(fftRoot(step.N,k))}`).join("; ")},
      {label:"A values",value:vectorText(step.Ahat)},
      {label:"B values",value:vectorText(step.Bhat)},
      {label:"Product values",value:vectorText(step.Z)},
      {label:"Current matching pair",value:step.pointIndex === null ? "none" : `k=${step.pointIndex}; x=${show(fftRoot(step.N,step.pointIndex))}; C(x)=A(x)B(x)=(${show(step.Ahat[step.pointIndex])})×(${show(step.Bhat[step.pointIndex])})=${show(step.Z[step.pointIndex])}`},
      {label:"Recovered C coefficients",value:vectorText(step.coefficients)},
      {label:"Why recovery works",value:`The product has at most ${step.coefficientCount} coefficient positions. Its values at ${step.N} distinct points determine it uniquely. Inverse FFT recovers these coefficients.`},
      {label:"Decimal carries",value:step.carries.length ? step.carries.map(carry=>`10^${carry.index}: coefficient ${carry.coefficient}+incoming ${carry.incoming}=${carry.total}; digit ${carry.digit}, outgoing ${carry.outgoing}`).join("; ") : "not performed"},
      {label:"Decimal digits, low to high",value:step.outputDigits === null ? "not written" : vectorText(step.outputDigits)},
      {label:"Product",value:step.result ?? "not returned"},
      {label:"Transform padding",value:`N=${step.N} is the smallest power of two at least ${step.coefficientCount}; A: ${vectorText(step.paddedA)}; B: ${vectorText(step.paddedB)}`},
      {label:"Numerical precision",value:`Display rounds nonintegral values to three decimal places. Inverse FFT divides by N and rounds recovered coefficients. ${step.roundingError === null ? "Recovery pending." : `Maximum residual ${step.roundingError}, tolerance 1e-7.`}`},
      {label:"Count scope",value:"Only matching-value multiplications are counted. FFT and inverse FFT are representation conversions whose internal operations are not shown or included in this count."},
      {label:"Pointwise products",value:String(step.pointwiseProducts)}
    ]
  };
}
function render(step) {
  const encoded = step.digitsA !== null;
  const multiplying = step.phase === "pointwise";
  return `<div class="fft-board">
    <div class="fft-inputs"><div><strong>a = ${step.a}</strong><span>A(x) = ${encoded ? polynomial(step.digitsA) : "?"}</span></div><div><strong>b = ${step.b}</strong><span>B(x) = ${encoded ? polynomial(step.digitsB) : "?"}</span></div></div>
    <div class="fft-convert ${step.phase === "evaluate" ? "is-current" : ""}">↓ FFT: coefficients → values at the same points</div>
    <div class="fft-table-scroll" data-visual-scroll><table class="fft-table"><thead><tr><th>x</th><th>A(x)</th><th>B(x)</th><th>C(x) = A(x)B(x)</th></tr></thead><tbody>${step.Z.map((value,k)=>`<tr class="${step.pointIndex === k ? "is-counted" : ""}"><th>${show(fftRoot(step.N,k))}</th><td>${show(step.Ahat[k])}</td><td>${show(step.Bhat[k])}</td><td>${show(value)}</td></tr>`).join("")}</tbody></table></div>
    <div class="fft-key-idea">${multiplying ? `(${show(step.Ahat[step.pointIndex])}) × (${show(step.Bhat[step.pointIndex])}) = ${show(step.Z[step.pointIndex])}` : "At any shared point: C(x) = A(x) · B(x)."}</div>
    <div class="fft-convert ${step.phase === "recover" ? "is-current" : ""}">↓ Inverse FFT: product values → coefficients</div>
    <div class="fft-product">C(x) = ${step.coefficients === null ? "?" : polynomial(step.coefficients)}</div>
    <div class="fft-answer ${step.phase === "complete" ? "is-complete" : ""}">${step.result === null ? "C(10) → carry → integer product" : `C(10) = ${step.a} × ${step.b} = ${step.result}`}</div>
    <div class="fft-footnote">i² = −1 · nonintegral values rounded to 3 decimals</div>
  </div>`;
}
export const fftMultiplicationModule = {
  id:"fft-multiplication", shortTitle:"FFT multiplication", title:"Why FFT Helps Integer Multiplication",
  summary:"Extension: change digit polynomials into values, multiply matching values, and change back.",
  complexity:"Θ(n log n) arithmetic operations under a unit-cost model", source:{slides:"Instructor-requested extension; builds on slides 53–67"},
  objective:"Explain why evaluating two digit polynomials, multiplying their matching values, and recovering coefficients gives their integer product.",
  codeTitle:"Multiplication idea", codeLayout:"expanded",
  input:{
    label:"Integer a | integer b", hint:"Two nonnegative integers of 1–4 decimal digits, separated by |.", default:"23 | 14",
    presets:[
      {label:"23 × 14",value:"23 | 14"},
      {label:"99 × 99 — carries",value:"99 | 99"},
      {label:"1234 × 5678",value:"1234 | 5678"}
    ], parse:parseFftMultiplicationInput
  },
  pseudocode:[
    {line:1,text:"Digits → A(x), B(x), with A(10)=a, B(10)=b"},
    {line:2,text:"FFT → A(xₖ), B(xₖ) at the same N points"},
    {line:3,text:"For each point: C(xₖ) ← A(xₖ) · B(xₖ)",basic:true,basicLabel:"pointwise product"},
    {line:4,text:"Inverse FFT → coefficients of C(x)"},
    {line:5,text:"Return C(10), carrying in base 10"}
  ],
  buildTrace:buildFftMultiplicationTrace, render, describe,
  metrics:step=>[{label:"Pointwise products",value:step.pointwiseProducts,emphasis:true}],
  model(step) {
    return {
      latex:step.phase === "complete"
        ? "\\begin{gathered}C(x_k)=A(x_k)B(x_k)\\\\P(N)=\\sum_{k=0}^{N-1}1=N\\end{gathered}"
        : "C(x_k)=A(x_k)B(x_k)",
      notes:["FFT changes coefficients into values; inverse FFT changes the products back.", ...(step.phase === "complete" ? ["The full method takes Θ(n log n) arithmetic operations under a unit-cost model. The counter shows only the N pointwise products."] : [])]
    };
  },
  analysis:[
    {term:"Course status",value:"Instructor-requested conceptual extension; FFT is not in the supplied Lecture 07 deck. The lecture's three-product integer method remains separate."},
    {term:"Why it works",value:"A polynomial product satisfies C(x)=A(x)B(x) at every x. Enough values at distinct shared points uniquely determine C. FFT and inverse FFT make these representation conversions fast."},
    {term:"Padding",value:"For p and q digits, the product has p+q−1 coefficient positions. Zero-pad to the smallest power of two N at least p+q−1, so recovery gives the linear product without wraparound."},
    {term:"Count scope",value:"The counter counts the N matching-value products, including zero and unit factors. It excludes the operations inside FFT and inverse FFT, rounding, and carrying."},
    {term:"FFT scope",value:"FFT's even/odd recursion and butterflies are intentionally omitted. Forward evaluation uses exp(+2πik/N); inverse recovery uses negative angles and division by N."},
    {term:"Cost model",value:"Two FFTs, N pointwise products, one inverse FFT, and linear carrying give Θ(n log n) arithmetic operations, with n the larger digit length and N=Θ(n). This unit-cost arithmetic statement is not an integer bit-complexity bound."},
    {term:"Numerical precision",value:"Examples use nonnegative one-to-four-digit factors. Complex computation uses double precision, checks the inverse recovery residual against 1e−7, and rounds recovered coefficients. Only displayed nonintegral values are rounded to three decimals."},
    {term:"Source",value:"The representation-conversion argument follows sections 1–3 of Yan-Bin Jia's Fast Fourier Transform and Polynomial Multiplication notes (Iowa State). Decimal encoding and the carry conversion are authored here; the default numeric inputs reuse the local lecture examples."}
  ]
};
