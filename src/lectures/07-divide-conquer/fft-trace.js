const complex = (re, im = 0) => ({ re: re || 0, im: im || 0 });
const plus = (a, b) => complex(a.re + b.re, a.im + b.im);
const minus = (a, b) => complex(a.re - b.re, a.im - b.im);
const times = (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const q = Math.SQRT1_2;
const roots = {
  1: [complex(1)],
  2: [complex(1), complex(-1)],
  4: [complex(1), complex(0, 1), complex(-1), complex(0, -1)],
  8: [complex(1), complex(q, q), complex(0, 1), complex(-q, q), complex(-1), complex(-q, -q), complex(0, -1), complex(q, -q)]
};

export function fftRoot(n, k, sign = 1) {
  if (!roots[n] || !Number.isInteger(k) || ![1, -1].includes(sign)) throw new Error("Use an FFT length of 1, 2, 4, or 8, an integer root index, and sign +1 or −1.");
  const root = roots[n][((k % n) + n) % n];
  return complex(root.re, sign * root.im);
}

export function formatFftComplex(value, precision = 3) {
  if (value === null || value === undefined) return "?";
  const rounded = number => {
    const nearest = Math.round(number);
    return Math.abs(number - nearest) < 1e-9 ? nearest : Number(number.toFixed(precision));
  };
  const re = rounded(value.re), im = rounded(value.im);
  const text = number => String(number).replaceAll("-", "−");
  if (!im) return text(re);
  const imaginary = `${Math.abs(im) === 1 ? "" : text(Math.abs(im))}i`;
  return re ? `${text(re)}${im < 0 ? "−" : "+"}${imaginary}` : `${im < 0 ? "−" : ""}${imaginary}`;
}

export function parseFftMultiplicationInput(raw) {
  const parts = String(raw).split("|").map(value => value.trim());
  if (parts.length !== 2 || parts.some(value => !value)) throw new Error("Enter two nonnegative decimal integers separated by |, for example 23 | 14.");
  if (parts.some(value => !/^\d{1,4}$/.test(value))) throw new Error("Each FFT example needs 1–4 decimal digits (0–9), without signs or decimal points.");
  return { a: String(Number(parts[0])), b: String(Number(parts[1])) };
}

// FFT supplies the representation conversions; its recursion is not a teaching trace.
function fft(values, sign) {
  const m = values.length;
  if (m === 1) return structuredClone(values);
  const even = fft(values.filter((_, index) => index % 2 === 0), sign);
  const odd = fft(values.filter((_, index) => index % 2 === 1), sign);
  const output = Array(m);
  for (let k = 0; k < m / 2; k += 1) {
    const t = times(fftRoot(m, k, sign), odd[k]);
    output[k] = plus(even[k], t);
    output[k + m / 2] = minus(even[k], t);
  }
  return output;
}

export function buildFftMultiplicationTrace(input) {
  const { a, b } = parseFftMultiplicationInput(`${input.a} | ${input.b}`);
  const digitsA = [...a].reverse().map(Number), digitsB = [...b].reverse().map(Number);
  const coefficientCount = digitsA.length + digitsB.length - 1;
  let N = 1;
  while (N < coefficientCount) N *= 2;
  const state = {
    a, b, n: Math.max(a.length, b.length), N, coefficientCount,
    digitsA: null, digitsB: null, paddedA: null, paddedB: null,
    Ahat: Array(N).fill(null), Bhat: Array(N).fill(null), Z: Array(N).fill(null),
    coefficients: null, roundingError: null, pointIndex: null,
    pointwiseProducts: 0, outputDigits: null, carries: [], result: null
  };
  const trace = [];
  const emit = (phase, activeLine, message) => trace.push(structuredClone({ ...state, phase, activeLine, message }));
  emit("ready", null, `Why FFT helps multiply ${a} × ${b}: change polynomials into values, multiply matching values, then change back.`);
  state.digitsA = digitsA;
  state.digitsB = digitsB;
  state.paddedA = Array.from({ length: N }, (_, index) => digitsA[index] ?? 0);
  state.paddedB = Array.from({ length: N }, (_, index) => digitsB[index] ?? 0);
  emit("encode", 1, `Use decimal digits as coefficients: a = A(10), b = B(10). Their product is C(10), where C(x) = A(x)B(x).`);
  state.Ahat = fft(state.paddedA.map(value => complex(value)), 1);
  state.Bhat = fft(state.paddedB.map(value => complex(value)), 1);
  emit("evaluate", 2, `FFT evaluates both polynomials at the same ${N} ${N === 1 ? "point" : "points"}. We now have values instead of coefficients.`);
  for (let k = 0; k < N; k += 1) {
    state.pointIndex = k;
    state.Z[k] = times(state.Ahat[k], state.Bhat[k]);
    state.pointwiseProducts += 1;
    emit("pointwise", 3, `At x = ${formatFftComplex(fftRoot(N, k))}: C(x) = A(x)B(x) = (${formatFftComplex(state.Ahat[k])}) × (${formatFftComplex(state.Bhat[k])}) = ${formatFftComplex(state.Z[k])}.`);
  }
  state.pointIndex = null;
  const inverse = fft(state.Z, -1);
  state.coefficients = inverse.map(value => Math.round(value.re / N) || 0);
  state.roundingError = Math.max(...inverse.map((value, index) => Math.max(Math.abs(value.im / N), Math.abs(value.re / N - state.coefficients[index]))));
  if (state.roundingError > 1e-7) throw new Error("This example exceeds the supported FFT rounding tolerance.");
  emit("recover", 4, `Inverse FFT changes the product values back into coefficients: [${state.coefficients}]. These describe C(x), not yet decimal digits.`);
  let carry = 0, index = 0;
  state.outputDigits = [];
  while (index < N || carry > 0) {
    const coefficient = state.coefficients[index] ?? 0, incoming = carry;
    const total = coefficient + incoming, digit = total % 10;
    carry = Math.floor(total / 10);
    state.outputDigits.push(digit);
    state.carries.push({ index, coefficient, incoming, total, digit, outgoing: carry });
    index += 1;
  }
  state.result = [...state.outputDigits].reverse().join("").replace(/^0+(?=\d)/, "");
  emit("complete", 5, `Evaluate C(10) and carry in base 10: ${a} × ${b} = ${state.result}.`);
  return trace;
}
