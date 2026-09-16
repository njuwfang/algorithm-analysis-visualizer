export function permutations(values) {
  if (!Array.isArray(values)) {
    throw new TypeError("permutations expects an array.");
  }
  if (values.length === 0) return [[]];

  return values.flatMap((value, index) => {
    const remaining = [...values.slice(0, index), ...values.slice(index + 1)];
    return permutations(remaining).map((permutation) => [value, ...permutation]);
  });
}

export function factorial(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError("factorial expects a nonnegative integer.");
  }

  let product = 1;
  for (let factor = 2; factor <= n; factor += 1) {
    product *= factor;
  }
  return product;
}

export function subsets(values) {
  if (!Array.isArray(values)) {
    throw new TypeError("subsets expects an array.");
  }

  return values.reduce(
    (result, value) => [
      ...result,
      ...result.map((subset) => [...subset, value])
    ],
    [[]]
  );
}
