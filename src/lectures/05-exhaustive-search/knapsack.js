import { formatNumber } from "../../core/utils.js?v=20260916-1";
import { subsets } from "./search-utils.js?v=20260916-1";

const MAX_ITEMS = 6;

export function parseKnapsackInput(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2) {
    throw new Error("Enter a capacity, then item weight:value pairs separated by |.");
  }

  const capacity = Number(parts[0].trim());
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    throw new Error("Capacity must be a whole number from 1 to 100.");
  }

  const itemParts = parts[1].split(",").map((part) => part.trim()).filter(Boolean);
  if (itemParts.length < 1 || itemParts.length > MAX_ITEMS) {
    throw new Error(`Enter between 1 and ${MAX_ITEMS} items.`);
  }

  const items = itemParts.map((part, index) => {
    const pair = part.split(":").map((value) => value.trim());
    if (pair.length !== 2 || pair.some((value) => value === "")) {
      throw new Error(`Item ${index + 1} must use the form weight:value.`);
    }
    const [weight, value] = pair.map(Number);
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      throw new Error(`Item ${index + 1} weight must be a whole number from 1 to 100.`);
    }
    if (!Number.isInteger(value) || value < 0 || value > 1000) {
      throw new Error(`Item ${index + 1} value must be a whole number from 0 to 1,000.`);
    }
    return { index, label: String(index + 1), weight, value };
  });

  return { capacity, items };
}

function subsetTotals(indices, items) {
  return indices.reduce((totals, index) => ({
    weight: totals.weight + items[index].weight,
    value: totals.value + items[index].value
  }), { weight: 0, value: 0 });
}

export function buildKnapsackTrace({ capacity, items }) {
  const itemIndices = items.map((_, index) => index);
  const candidates = subsets(itemIndices).sort((left, right) => {
    if (left.length !== right.length) return left.length - right.length;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  });
  const sharedItems = items.map((item) => ({ ...item }));
  const trace = [{
    capacity,
    items: sharedItems,
    phase: "initial",
    activeLine: 1,
    currentSubset: [],
    currentWeight: 0,
    currentValue: 0,
    feasible: true,
    bestSubset: [],
    bestWeight: 0,
    bestValue: 0,
    candidatesEvaluated: 0,
    totalCandidates: candidates.length,
    message: "Start with the empty subset as the best feasible choice."
  }];

  let bestSubset = [];
  let bestWeight = 0;
  let bestValue = 0;

  candidates.forEach((candidate, index) => {
    const { weight, value } = subsetTotals(candidate, items);
    const feasible = weight <= capacity;
    const improves = feasible && value > bestValue;
    if (improves) {
      bestSubset = [...candidate];
      bestWeight = weight;
      bestValue = value;
    }

    const candidateName = candidate.length ? `{${candidate.map((itemIndex) => itemIndex + 1).join(", ")}}` : "∅";
    trace.push({
      capacity,
      items: sharedItems,
      phase: "candidate",
      activeLine: 3,
      currentSubset: [...candidate],
      currentWeight: weight,
      currentValue: value,
      feasible,
      improves,
      bestSubset: [...bestSubset],
      bestWeight,
      bestValue,
      candidatesEvaluated: index + 1,
      totalCandidates: candidates.length,
      message: feasible
        ? `Subset ${candidateName} weighs ${weight} and is feasible with value ${value}${improves ? "; retain it as the best subset" : "; it does not improve the best value"}.`
        : `Subset ${candidateName} weighs ${weight}, which exceeds capacity ${capacity}; disqualify it.`
    });
  });

  trace.push({
    capacity,
    items: sharedItems,
    phase: "complete",
    activeLine: 4,
    currentSubset: [...bestSubset],
    currentWeight: bestWeight,
    currentValue: bestValue,
    feasible: true,
    bestSubset: [...bestSubset],
    bestWeight,
    bestValue,
    candidatesEvaluated: candidates.length,
    totalCandidates: candidates.length,
    message: `Return ${setLabel(bestSubset)} with total weight ${bestWeight} and value ${bestValue}.`
  });

  return trace;
}

function setLabel(indices) {
  return indices.length ? `{${indices.map((index) => index + 1).join(", ")}}` : "∅";
}

function renderKnapsack(step) {
  const included = new Set(step.currentSubset);
  const itemCards = step.items.map((item, index) => `
    <div class="knapsack-item ${included.has(index) ? "is-included" : "is-excluded"}">
      <strong>Item ${item.label}</strong>
      <span>w = ${formatNumber(item.weight)}</span>
      <span>v = ${formatNumber(item.value)}</span>
      <small>${included.has(index) ? "included" : "excluded"}</small>
    </div>`).join("");
  const fill = Math.min(100, (step.currentWeight / step.capacity) * 100);
  const status = step.phase === "initial"
    ? "Ready"
    : step.feasible
      ? "Feasible"
      : "Over capacity";
  const currentLabel = step.phase === "initial"
    ? "No candidate yet"
    : `Current ${setLabel(step.currentSubset)}`;
  const capacityLabel = step.phase === "initial"
    ? `No candidate evaluated; capacity ${step.capacity}`
    : `Current weight ${step.currentWeight} of capacity ${step.capacity}`;
  const weightValue = step.phase === "initial" ? "—" : formatNumber(step.currentWeight);
  const itemValue = step.phase === "initial" ? "—" : formatNumber(step.currentValue);

  return `
    <div class="knapsack-visual">
      <div class="knapsack-items">${itemCards}</div>
      <div class="knapsack-evaluation ${step.feasible ? "is-feasible" : "is-infeasible"}" data-active-visual="true">
        <div class="knapsack-evaluation-heading">
          <span>${currentLabel}</span>
          <strong>${status}</strong>
        </div>
        <div class="knapsack-capacity" role="img" aria-label="${capacityLabel}">
          <span style="--capacity-fill:${fill}%"></span>
        </div>
        <div class="knapsack-totals">
          <span>weight <strong>${weightValue} / ${formatNumber(step.capacity)}</strong></span>
          <span>value <strong>${itemValue}</strong></span>
        </div>
      </div>
      <div class="knapsack-best">
        <span>Best feasible subset</span>
        <strong>${setLabel(step.bestSubset)}</strong>
        <small>weight ${formatNumber(step.bestWeight)} · value ${formatNumber(step.bestValue)}</small>
      </div>
    </div>`;
}

function describeKnapsack(step) {
  const progress = `${step.candidatesEvaluated} of ${step.totalCandidates} candidate subsets evaluated`;
  const availableItems = step.items
    .map((item) => `Item ${item.label}: weight ${formatNumber(item.weight)}, value ${formatNumber(item.value)}`)
    .join("; ");
  const selectedItems = step.currentSubset.length
    ? step.currentSubset.map((index) => {
      const item = step.items[index];
      return `Item ${item.label}: weight ${formatNumber(item.weight)}, value ${formatNumber(item.value)}`;
    }).join("; ")
    : "No items";

  let decision = "Search not started";
  if (step.phase === "complete") decision = "Search complete; return the best feasible subset";
  else if (!step.feasible) decision = "Disqualify because it exceeds capacity";
  else if (step.phase === "candidate" && step.improves) decision = "Retain as the new best subset";
  else if (step.phase === "candidate") decision = "Feasible, but keep the previous best subset";

  return {
    summary: step.message,
    state: [
      { label: "Progress", value: progress },
      { label: "Capacity", value: formatNumber(step.capacity) },
      { label: "Available items", value: availableItems },
      { label: "Current subset", value: step.phase === "initial" ? "None" : setLabel(step.currentSubset) },
      { label: "Selected items", value: step.phase === "initial" ? "None" : selectedItems },
      { label: "Current weight", value: step.phase === "initial" ? "Not evaluated" : `${formatNumber(step.currentWeight)} of capacity ${formatNumber(step.capacity)}` },
      { label: "Current value", value: step.phase === "initial" ? "Not evaluated" : formatNumber(step.currentValue) },
      { label: "Feasibility", value: step.phase === "initial" ? "Not evaluated" : step.feasible ? "Feasible" : "Over capacity" },
      { label: "Best subset so far", value: setLabel(step.bestSubset) },
      { label: "Best totals so far", value: `weight ${formatNumber(step.bestWeight)}, value ${formatNumber(step.bestValue)}` },
      { label: "Decision", value: decision }
    ]
  };
}

export const knapsackModule = {
  id: "exhaustive-knapsack",
  shortTitle: "Knapsack",
  title: "Knapsack — Exhaustive Subsets",
  summary: "Generate every subset, disqualify overweight choices, and retain the feasible subset with greatest value.",
  complexity: "Ω(2ⁿ)",
  source: { slides: "17–21" },
  objective: "Make the 2ⁿ candidate subsets visible while separating feasibility from value.",
  input: {
    label: "Capacity | weight:value, …",
    hint: "Enter a whole-number capacity and 1–6 item pairs.",
    default: "16 | 2:20, 5:30, 10:50, 5:10",
    presets: [
      { label: "Lecture example", value: "16 | 2:20, 5:30, 10:50, 5:10" }
    ],
    parse: parseKnapsackInput
  },
  codeTitle: "Exhaustive-search process",
  pseudocode: [
    { line: 1, text: "best ← ∅" },
    { line: 2, text: "for each subset S of the n items do" },
    { line: 3, text: "evaluate S; if feasible and better, retain it", indent: 1, basic: true, basicLabel: "candidate subset" },
    { line: 4, text: "return best" }
  ],
  buildTrace: buildKnapsackTrace,
  render: renderKnapsack,
  describe: describeKnapsack,
  metrics(step) {
    return [{ label: "Candidate subsets", value: step.candidatesEvaluated, emphasis: true }];
  },
  model(step) {
    if (step.phase !== "complete") {
      return {
        latex: `S_{\\text{checked}}=${step.candidatesEvaluated}`,
        notes: ["The empty subset is a candidate too; each item is either included or excluded."]
      };
    }
    return {
      latex: "N_{\\text{subsets}}(n)=2^n,\\qquad T(n)\\in\\Omega(2^n)",
      notes: ["Every item contributes two choices—include or exclude—and the lecture reports the exhaustive search as Ω(2ⁿ)."]
    };
  },
  analysis: [
    { term: "Input size", value: "The number n of available items" },
    { term: "Counted quantity", value: "Candidate subsets evaluated, including the empty subset" },
    { term: "Feasibility", value: "A subset is retained only when its total weight is at most W" },
    { term: "Candidate count", value: "Every item is included or excluded, giving exactly 2ⁿ subsets" },
    { term: "Growth", value: "The lecture reports the exhaustive search as Ω(2ⁿ)" }
  ]
};
