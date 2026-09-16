import { escapeHtml, formatNumber } from "../../core/utils.js?v=20260916-1";

const MAX_POINTS = 8;

export function parsePoints(raw) {
  const chunks = String(raw).split(";").map((part) => part.trim()).filter(Boolean);
  if (chunks.length < 2 || chunks.length > MAX_POINTS) {
    throw new Error(`Enter between 2 and ${MAX_POINTS} points.`);
  }

  return chunks.map((chunk, index) => {
    const coordinates = chunk.split(",").map((part) => part.trim());
    if (coordinates.length !== 2 || coordinates.some((value) => value === "")) {
      throw new Error(`Point ${index + 1} must use the form x,y.`);
    }
    const [x, y] = coordinates.map(Number);
    if (![x, y].every(Number.isFinite)) {
      throw new Error(`Point ${index + 1} must contain two valid numbers.`);
    }
    if (Math.abs(x) > 100 || Math.abs(y) > 100) {
      throw new Error("Keep every coordinate between −100 and 100.");
    }
    return { x, y, label: `P${index + 1}` };
  });
}

function squaredDistance(left, right) {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2;
}

export function buildClosestPairTrace(points) {
  const sharedPoints = points.map((point) => ({ ...point }));
  const trace = [{
    points: sharedPoints,
    phase: "initial",
    activeLine: 1,
    currentPair: null,
    currentSquared: null,
    bestPair: null,
    bestSquared: null,
    pairsChecked: 0,
    coordinateTerms: 0,
    message: "Initialize the best squared distance to infinity."
  }];

  let bestSquared = Infinity;
  let bestPair = null;
  let pairsChecked = 0;
  let coordinateTerms = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const currentSquared = squaredDistance(points[i], points[j]);
      pairsChecked += 1;
      coordinateTerms += 2;
      const improves = currentSquared < bestSquared;
      if (improves) {
        bestSquared = currentSquared;
        bestPair = [i, j];
      }
      trace.push({
        points: sharedPoints,
        phase: "pair",
        activeLine: 4,
        currentPair: [i, j],
        currentSquared,
        bestPair: [...bestPair],
        bestSquared,
        pairsChecked,
        coordinateTerms,
        improves,
        message: `Evaluate ${points[i].label}–${points[j].label}: squared distance ${formatNumber(currentSquared)}${improves ? "; keep it as the closest pair" : "; the current best remains closer"}.`
      });
    }
  }

  trace.push({
    points: sharedPoints,
    phase: "complete",
    activeLine: 5,
    currentPair: null,
    currentSquared: null,
    bestPair: [...bestPair],
    bestSquared,
    pairsChecked,
    coordinateTerms,
    message: `Return squared distance ${formatNumber(bestSquared)} for ${points[bestPair[0]].label}–${points[bestPair[1]].label}.`
  });
  return trace;
}

function pointPosition(points, point) {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  return {
    x: xRange === 0 ? 260 : 34 + ((point.x - minX) / xRange) * 452,
    y: yRange === 0 ? 126 : 218 - ((point.y - minY) / yRange) * 184
  };
}

function edgeHtml(step, pair, className, active = false) {
  if (!pair) return "";
  const start = pointPosition(step.points, step.points[pair[0]]);
  const end = pointPosition(step.points, step.points[pair[1]]);
  return `<line class="${className}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" ${active ? 'data-active-visual="true"' : ""}></line>`;
}

function renderClosestPair(step) {
  const current = new Set(step.currentPair || []);
  const best = new Set(step.bestPair || []);
  const points = step.points.map((point, index) => {
    const position = pointPosition(step.points, point);
    const classes = [
      "closest-point",
      current.has(index) ? "is-current" : "",
      best.has(index) ? "is-best" : ""
    ].filter(Boolean).join(" ");
    return `<g class="${classes}" transform="translate(${position.x} ${position.y})">
      <circle r="9"></circle>
      <text x="0" y="-15" text-anchor="middle">${escapeHtml(point.label)}</text>
      <text class="closest-coordinate" x="0" y="24" text-anchor="middle">(${formatNumber(point.x)}, ${formatNumber(point.y)})</text>
    </g>`;
  }).join("");

  const currentPairLabel = step.currentPair
    ? `${step.points[step.currentPair[0]].label}–${step.points[step.currentPair[1]].label}`
    : "—";
  const bestPairLabel = step.bestPair
    ? `${step.points[step.bestPair[0]].label}–${step.points[step.bestPair[1]].label}`
    : "—";

  return `
    <div class="closest-layout">
      <svg class="closest-plot" viewBox="0 0 520 252" role="img" aria-label="Point set with current and closest pairs">
        ${edgeHtml(step, step.bestPair, "closest-edge is-best")}
        ${edgeHtml(step, step.currentPair, "closest-edge is-current", true)}
        ${points}
      </svg>
      <aside class="closest-reading">
        <div class="closest-reading-row is-current">
          <span>Current pair</span>
          <strong>${escapeHtml(currentPairLabel)}</strong>
          <small>d² = ${step.currentSquared === null ? "—" : formatNumber(step.currentSquared)}</small>
        </div>
        <div class="closest-reading-row is-best">
          <span>Closest so far</span>
          <strong>${escapeHtml(bestPairLabel)}</strong>
          <small>d² = ${step.bestSquared === null ? "—" : formatNumber(step.bestSquared)}</small>
        </div>
      </aside>
    </div>`;
}

export const closestPairModule = {
  id: "closest-pair",
  shortTitle: "Closest pair",
  title: "Brute-Force Closest Pair",
  summary: "Evaluate every unordered pair and retain the smallest squared Euclidean distance.",
  complexity: "Θ(n²)",
  source: { slides: "65–68" },
  objective: "Relate all unordered point pairs to the lecture's two coordinate terms per pair.",
  input: {
    label: "Points x,y; x,y; …",
    hint: "Enter 2–8 two-dimensional points separated by semicolons.",
    default: "1,1; 5,1; 2,4; 6,5; 4,3",
    presets: [
      { label: "Prepared points", value: "1,1; 5,1; 2,4; 6,5; 4,3" }
    ],
    parse: parsePoints
  },
  pseudocode: [
    { line: 1, text: "d ← ∞" },
    { line: 2, text: "for i ← 1 to n − 1 do" },
    { line: 3, text: "for j ← i + 1 to n do", indent: 1 },
    { line: 4, latex: "d \\gets \\min\\!\\left(d,(x_i-x_j)^2+(y_i-y_j)^2\\right)", indent: 2, basic: true, basicLabel: "coordinate terms" },
    { line: 5, text: "return d" }
  ],
  buildTrace: buildClosestPairTrace,
  render: renderClosestPair,
  metrics(step) {
    return [{ label: "Coordinate terms", value: step.coordinateTerms, emphasis: true }];
  },
  model(step) {
    if (step.phase !== "complete") {
      return {
        latex: `C_{\\text{trace}}=2\\cdot ${step.pairsChecked}=${step.coordinateTerms}`,
        notes: ["Each visited pair contributes its x-coordinate term and its y-coordinate term."]
      };
    }
    return {
      latex: "C(n)=2\\binom{n}{2}=n(n-1)\\in\\Theta(n^2)",
      notes: ["Comparing squared distances preserves which pair is closest and avoids taking a square root for every pair."]
    };
  },
  analysis: [
    { term: "Input size", value: "The number n of two-dimensional points" },
    { term: "Basic operation", value: "The two coordinate terms used for each squared-distance calculation" },
    { term: "Case behavior", value: "Every input visits all n(n − 1)/2 unordered pairs" },
    { term: "Returned quantity", value: "The square-root-free algorithm returns the minimum squared distance" },
    { term: "Growth", value: "n(n − 1) coordinate terms, which is Θ(n²)" }
  ]
};
