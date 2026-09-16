import { escapeHtml, formatNumber } from "../../core/utils.js?v=20260916-1";
import { factorial, permutations } from "./search-utils.js?v=20260916-1";

const CITIES = ["a", "b", "c", "d"];
const EDGE_KEYS = ["ab", "ac", "ad", "bc", "bd", "cd"];
const CITY_INDEX = new Map(CITIES.map((city, index) => [city, index]));
const CITY_POSITIONS = Object.freeze({
  a: { x: 92, y: 58 },
  b: { x: 388, y: 58 },
  c: { x: 92, y: 262 },
  d: { x: 388, y: 262 }
});
const EDGE_LAYOUT = Object.freeze([
  { key: "ad", from: "a", to: "d", labelX: 210, labelY: 132 },
  { key: "bc", from: "b", to: "c", labelX: 270, labelY: 132 },
  { key: "ab", from: "a", to: "b", labelX: 240, labelY: 35 },
  { key: "ac", from: "a", to: "c", labelX: 62, labelY: 162 },
  { key: "bd", from: "b", to: "d", labelX: 418, labelY: 162 },
  { key: "cd", from: "c", to: "d", labelX: 240, labelY: 292 }
]);

function edgeKey(left, right) {
  return [left, right].sort().join("");
}

function tourLabel(tour) {
  return tour.join(" → ");
}

function tourEdgeKeys(tour) {
  return tour.slice(0, -1).map((city, index) => edgeKey(city, tour[index + 1]));
}

function makeCanonicalTours(weights) {
  return permutations(CITIES.slice(1))
    .filter((middle) => CITY_INDEX.get(middle[0]) < CITY_INDEX.get(middle.at(-1)))
    .map((middle) => {
      const tour = [CITIES[0], ...middle, CITIES[0]];
      const edgeKeys = tourEdgeKeys(tour);
      const edgeWeights = edgeKeys.map((key) => weights[key]);
      return {
        tour,
        edgeKeys,
        edgeWeights,
        cost: edgeWeights.reduce((sum, weight) => sum + weight, 0)
      };
    });
}

export function parseTravelingSalesmanInput(raw) {
  const parts = String(raw)
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (parts.length !== EDGE_KEYS.length) {
    throw new Error("Enter six edge weights in the order ab, ac, ad, bc, bd, cd.");
  }

  const values = parts.map(Number);
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Every edge weight must be a positive finite number.");
  }
  if (!Number.isFinite(values.reduce((sum, value) => sum + value, 0))) {
    throw new Error("The edge weights are too large to add safely.");
  }

  return Object.fromEntries(EDGE_KEYS.map((key, index) => [key, values[index]]));
}

export function buildTravelingSalesmanTrace(weights) {
  const candidates = makeCanonicalTours(weights);
  const candidateTotal = factorial(CITIES.length - 1) / 2;
  const common = {
    weights: { ...weights },
    candidates: candidates.map((candidate) => ({
      ...candidate,
      tour: [...candidate.tour],
      edgeKeys: [...candidate.edgeKeys],
      edgeWeights: [...candidate.edgeWeights]
    })),
    candidateTotal
  };
  const trace = [{
    ...common,
    activeLine: 1,
    phase: "initial",
    currentIndex: null,
    currentCandidate: null,
    evaluatedCount: 0,
    best: null,
    message: "Fix city a as the start. Six orders remain, but reversing a tour gives the same undirected cycle, so only three tours need evaluation."
  }];

  let best = null;
  candidates.forEach((candidate, index) => {
    const previousBest = best;
    const improved = best === null || candidate.cost < best.cost;
    if (improved) best = candidate;

    const calculation = candidate.edgeWeights.map(formatNumber).join(" + ");
    let outcome;
    if (improved) {
      outcome = "It becomes the best tour so far.";
    } else if (candidate.cost === previousBest.cost) {
      outcome = `It ties the best cost ${formatNumber(previousBest.cost)}; keep the first canonical tour.`;
    } else {
      outcome = `The best remains ${tourLabel(previousBest.tour)} with cost ${formatNumber(previousBest.cost)}.`;
    }

    trace.push({
      ...common,
      activeLine: 4,
      phase: "candidate",
      currentIndex: index,
      currentCandidate: { ...candidate, tour: [...candidate.tour] },
      evaluatedCount: index + 1,
      improved,
      best: { ...best, tour: [...best.tour] },
      message: `Evaluate ${tourLabel(candidate.tour)}: ${calculation} = ${formatNumber(candidate.cost)}. ${outcome}`
    });
  });

  trace.push({
    ...common,
    activeLine: 5,
    activeLabel: "Complete",
    phase: "complete",
    currentIndex: null,
    currentCandidate: null,
    evaluatedCount: candidateTotal,
    best: { ...best, tour: [...best.tour] },
    message: `All ${candidateTotal} direction-independent tours have been evaluated. A shortest tour is ${tourLabel(best.tour)} with cost ${formatNumber(best.cost)}.`
  });

  return trace;
}

function renderGraph(step, activeTour) {
  const activeEdges = new Set(activeTour ? tourEdgeKeys(activeTour) : []);
  const description = activeTour
    ? `${step.phase === "complete" ? "Best" : "Current"} route ${tourLabel(activeTour)}.`
    : "Complete weighted graph on cities a, b, c, and d.";

  const edges = EDGE_LAYOUT.map((edge) => {
    const from = CITY_POSITIONS[edge.from];
    const to = CITY_POSITIONS[edge.to];
    const active = activeEdges.has(edge.key);
    return `
      <g class="tsp-edge-group ${active ? "tsp-is-active" : ""}">
        <line class="tsp-edge" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" vector-effect="non-scaling-stroke"></line>
        <g class="tsp-edge-label" transform="translate(${edge.labelX} ${edge.labelY})">
          <rect x="-20" y="-15" width="40" height="30" rx="8"></rect>
          <text text-anchor="middle" dominant-baseline="central">${escapeHtml(formatNumber(step.weights[edge.key]))}</text>
        </g>
      </g>`;
  }).join("");

  const nodes = CITIES.map((city) => {
    const position = CITY_POSITIONS[city];
    const isStart = city === CITIES[0];
    return `
      <g class="tsp-city ${isStart ? "tsp-is-start" : ""}" transform="translate(${position.x} ${position.y})">
        <circle r="25"></circle>
        <text text-anchor="middle" dominant-baseline="central">${city}</text>
      </g>`;
  }).join("");

  return `
    <svg class="tsp-graph" viewBox="0 0 480 320" role="img" aria-labelledby="tsp-graph-title tsp-graph-description">
      <title id="tsp-graph-title">Four-city weighted graph</title>
      <desc id="tsp-graph-description">${escapeHtml(description)}</desc>
      ${edges}
      ${nodes}
    </svg>`;
}

function renderTravelingSalesman(step) {
  const activeTour = step.phase === "complete" ? step.best?.tour : step.currentCandidate?.tour;
  const heading = step.phase === "initial"
    ? "Three tours after removing reverse duplicates"
    : step.phase === "complete"
      ? "Shortest tour"
      : `Candidate ${step.evaluatedCount} of ${step.candidateTotal}`;
  const prominentTour = activeTour ? tourLabel(activeTour) : "a is fixed as the start";
  const prominentCost = step.phase === "initial"
    ? "6 orders ÷ 2 directions = 3 tours"
    : `cost ${formatNumber(step.phase === "complete" ? step.best.cost : step.currentCandidate.cost)}`;

  const candidateRows = step.candidates.map((candidate, index) => {
    const evaluated = index < step.evaluatedCount;
    const current = index === step.currentIndex;
    const best = evaluated && step.best && tourLabel(candidate.tour) === tourLabel(step.best.tour);
    const classes = ["tsp-candidate"];
    if (evaluated) classes.push("tsp-is-evaluated");
    if (current) classes.push("tsp-is-current");
    if (best) classes.push("tsp-is-best");
    return `
      <li class="${classes.join(" ")}" ${current ? 'aria-current="step"' : ""} ${current || (step.phase === "complete" && best) ? 'data-active-visual="true"' : ""}>
        <span>${escapeHtml(tourLabel(candidate.tour))}</span>
        <strong>${evaluated ? escapeHtml(formatNumber(candidate.cost)) : "—"}</strong>
      </li>`;
  }).join("");

  return `
    <div class="tsp-layout">
      <div class="tsp-graph-panel">
        ${renderGraph(step, activeTour)}
      </div>
      <section class="tsp-search-panel" aria-label="Exhaustive tour search">
        <div class="tsp-current">
          <small>${escapeHtml(heading)}</small>
          <strong>${escapeHtml(prominentTour)}</strong>
          <span>${escapeHtml(prominentCost)}</span>
        </div>
        <ol class="tsp-candidates">${candidateRows}</ol>
        <div class="tsp-best">
          <span>Best so far</span>
          <strong>${step.best ? `${escapeHtml(tourLabel(step.best.tour))} · ${escapeHtml(formatNumber(step.best.cost))}` : "Not evaluated"}</strong>
        </div>
      </section>
    </div>`;
}

export const travelingSalesmanModule = {
  id: "traveling-salesman",
  shortTitle: "Traveling salesman",
  title: "Traveling Salesman Problem",
  summary: "Generate each direction-independent tour, evaluate its length, and retain the shortest tour found so far.",
  complexity: "O(n!)",
  source: { slides: "9–16" },
  tags: ["brute-force", "exhaustive-search", "permutations"],
  objective: "Connect systematic tour generation and reverse-direction symmetry to the factorial candidate count.",
  input: {
    label: "Edge weights ab, ac, ad, bc, bd, cd",
    hint: "Enter six positive numbers for the undirected four-city graph.",
    default: "2, 5, 7, 8, 3, 1",
    presets: [
      { label: "Lecture graph", value: "2, 5, 7, 8, 3, 1" }
    ],
    parse: parseTravelingSalesmanInput
  },
  pseudocode: [
    { line: 1, text: "fix city a as the start" },
    { line: 2, text: "bestTour ← none; bestCost ← ∞" },
    { line: 3, text: "for each permutation p of b, c, d with first(p) < last(p) do" },
    { line: 4, text: "evaluate a → p → a; retain it if its cost is smaller", indent: 1, basic: true, basicLabel: "candidate tour" },
    { line: 5, text: "return bestTour and bestCost" }
  ],
  buildTrace: buildTravelingSalesmanTrace,
  render: renderTravelingSalesman,
  metrics(step) {
    return [
      { label: "Candidate tours", value: step.evaluatedCount, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, the number of cities; the interactive lecture example fixes n = 4" },
    { term: "Candidate", value: "One Hamiltonian cycle with city a fixed as the start" },
    { term: "Counted quantity", value: "Direction-independent candidate tours evaluated" },
    { term: "Symmetry", value: "A tour and the same tour traversed backward are one undirected cycle" },
    { term: "Candidate count", value: "(n − 1)! / 2, which is in O(n!)" }
  ],
  model(step) {
    if (step.phase === "initial") {
      return {
        latex: "N_4 = \\frac{(4-1)!}{2} = \\frac{6}{2} = 3",
        notes: ["Fixing city a removes rotations; keeping one of two directions removes reverse duplicates."]
      };
    }

    if (step.phase === "candidate") {
      const cities = step.currentCandidate.tour.join(",");
      const additions = step.currentCandidate.edgeWeights.map(formatNumber).join("+");
      return {
        latex: `d(${cities}) = ${additions} = ${formatNumber(step.currentCandidate.cost)}`,
        notes: [step.improved ? "This candidate becomes the best seen so far." : "This candidate does not improve the best cost."]
      };
    }

    return {
      latex: "N(n) = \\frac{(n-1)!}{2} \\in \\mathrm{O}(n!)",
      notes: ["The factor one half removes reverse-direction duplicates but does not change factorial growth."]
    };
  }
};
