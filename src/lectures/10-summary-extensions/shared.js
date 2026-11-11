import {parseArray} from "../../core/utils.js";

export function parseKeys(raw) {
  const values = parseArray(raw, {min: 1, max: 10});
  if (values.some(value => !Number.isInteger(value) || Math.abs(value) > 99)) {
    throw new Error("Use 1–10 integer keys from −99 to 99.");
  }
  return values;
}

export const records = values => values.map((value, id) => ({value, id}));
export const indexed = items => items.map((item, i) => `${i}:${item === null ? "□" : `${item.value}(#${item.id})`}`).join("; ") || "empty";
export const sequence = items => items.map(item => item === null ? "□" : String(item.value)).join(", ") || "empty";
export const inversionPairs = items => items.flatMap((left, i) => items.slice(i + 1).flatMap((right, offset) =>
  left.value > right.value ? [{i, j: i + 1 + offset, left: {...left}, right: {...right}}] : []));
export const pairText = pairs => pairs.map(pair => `#${pair.left.id}:${pair.left.value} > #${pair.right.id}:${pair.right.value}`).join("; ") || "none";
export const snapshot = value => structuredClone(value);
