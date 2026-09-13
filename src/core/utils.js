export const PEG_NAMES = ["A", "B", "C"];

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(4)).toString();
}

export function parseArray(raw, { min = 2, max = 12 } = {}) {
  const parts = String(raw)
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (parts.length < min || parts.length > max) {
    throw new Error(`Enter between ${min} and ${max} numbers.`);
  }

  const values = parts.map((part) => Number(part));
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Every array item must be a valid number.");
  }

  return values;
}

export function parsePositiveInteger(raw, maximum = 1_000_000_000) {
  const value = Number(String(raw).trim());
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`Enter a positive integer from 1 to ${maximum.toLocaleString()}.`);
  }
  return value;
}

export function parseDiskCount(raw, maximum = 7) {
  const value = Number(String(raw).trim());
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`Enter a whole number of disks from 1 to ${maximum}.`);
  }
  return value;
}

export function clonePegs(pegs) {
  return pegs.map((peg) => [...peg]);
}

export function makeInitialPegs(n) {
  return [Array.from({ length: n }, (_, index) => n - index), [], []];
}

export function bounded(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deepClone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}
