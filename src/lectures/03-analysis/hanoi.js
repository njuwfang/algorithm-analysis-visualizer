import {
  PEG_NAMES,
  clonePegs,
  escapeHtml,
  makeInitialPegs,
  parseDiskCount
} from "../../core/utils.js?v=20260916-1";

export function buildHanoiTrace(n) {
  const trace = [];
  const pegs = makeInitialPegs(n);
  let moves = 0;

  function addStep({ activeLine = null, activeLabel, phase, activeDisk = null, callStack = [], message }) {
    trace.push({
      activeLine,
      ...(activeLabel ? { activeLabel } : {}),
      phase,
      n,
      pegs: clonePegs(pegs),
      moves,
      activeDisk,
      callStack: callStack.map((frame) => ({ ...frame })),
      message
    });
  }

  const rootCall = { n, from: 0, to: 2, aux: 1 };
  addStep({
    activeLine: 1,
    activeLabel: "Start",
    phase: "initial",
    callStack: [rootCall],
    message: `Start with ${n} disk${n === 1 ? "" : "s"} on peg A.`
  });

  function moveDisk(disk, from, to, callStack, activeLine) {
    const popped = pegs[from].pop();
    if (popped !== disk) throw new Error("Internal Tower of Hanoi trace error.");
    pegs[to].push(disk);
    moves += 1;
    addStep({
      activeLine,
      activeLabel: "Move",
      phase: "move",
      activeDisk: disk,
      callStack,
      message: `Move disk ${disk} from peg ${PEG_NAMES[from]} to peg ${PEG_NAMES[to]}.`
    });
  }

  function solve(k, from, to, aux, ancestors, callLine = null) {
    const frame = { n: k, from, to, aux };
    const stack = [...ancestors, frame];

    if (callLine !== null) {
      addStep({
        activeLine: callLine,
        activeLabel: "Call",
        phase: "call",
        callStack: stack,
        message: `Call Hanoi(${k}, ${PEG_NAMES[from]} → ${PEG_NAMES[to]}, auxiliary ${PEG_NAMES[aux]}).`
      });
    }

    if (k === 1) {
      moveDisk(1, from, to, stack, 2);
      addStep({
        activeLabel: "Return",
        phase: "return",
        callStack: stack,
        message: `Return from Hanoi(1, ${PEG_NAMES[from]} → ${PEG_NAMES[to]}).`
      });
      return;
    }

    solve(k - 1, from, aux, to, stack, 3);
    moveDisk(k, from, to, stack, 4);
    solve(k - 1, aux, to, from, stack, 5);
    addStep({
      activeLabel: "Return",
      phase: "return",
      callStack: stack,
      message: `Return from Hanoi(${k}, ${PEG_NAMES[from]} → ${PEG_NAMES[to]}).`
    });
  }

  solve(n, 0, 2, 1, []);

  addStep({
    activeLabel: "Complete",
    phase: "complete",
    message: `Solved in ${moves} moves, which equals 2^${n} − 1.`
  });

  return trace;
}

function diskStackHtml(peg, n, { activeDisk = null, highlightTop = false } = {}) {
  return peg.map((disk, index) => {
    const width = 38 + (disk / n) * 55;
    const topClass = index === peg.length - 1 ? " is-top" : "";
    const currentClass = disk === activeDisk || (highlightTop && index === peg.length - 1) ? " is-current" : "";
    return `<div class="hanoi-disk${topClass}${currentClass}" style="--disk-width:${width}%" aria-label="disk ${disk}">${disk}</div>`;
  }).join("");
}

function hanoiBoardHtml(pegs, n, { practice = false, selectedPeg = null, activeDisk = null, complete = false } = {}) {
  return `
    <div class="hanoi-board ${practice ? "is-practice" : ""} ${complete ? "is-complete" : ""}">
      ${pegs.map((peg, index) => {
        const selected = selectedPeg === index;
        const pegState = peg.length
          ? `disks bottom to top: ${peg.join(", ")}; top disk ${peg.at(-1)}`
          : "empty";
        return `
        <div class="peg-zone ${selected ? "is-selected" : ""}"
             ${practice ? `data-activity-action="select-peg" data-activity-value="${index}" role="button" tabindex="0" aria-pressed="${selected}" aria-label="Peg ${PEG_NAMES[index]}, ${pegState}${selected ? ", selected source" : ""}"` : ""}>
          <div class="peg" aria-hidden="true"></div>
          <div class="disk-stack">${diskStackHtml(peg, n, { activeDisk, highlightTop: practice && selected })}</div>
          <span class="peg-label">${PEG_NAMES[index]}</span>
        </div>`;
      }).join("")}
    </div>`;
}

function renderHanoi(step) {
  const callStack = step.callStack || [];
  const phaseLabels = {
    initial: "Start",
    call: "Call",
    move: "Move",
    return: "Return",
    complete: "Done"
  };
  const stackHtml = callStack.length
    ? callStack.map((frame, index) => {
      const isActive = index === callStack.length - 1;
      const call = `H(${frame.n}, ${PEG_NAMES[frame.from]}→${PEG_NAMES[frame.to]})`;
      return `
        <li class="hanoi-call-frame ${isActive ? "is-active" : ""}" ${isActive ? 'aria-current="step"' : ""}>
          <span class="hanoi-call-depth">${index + 1}</span>
          <code>${escapeHtml(call)}</code>
          <small>aux ${PEG_NAMES[frame.aux]}</small>
        </li>`;
    }).join("")
    : '<li class="hanoi-call-empty">Stack empty</li>';

  return `
    <div class="hanoi-layout hanoi-trace-layout">
      <div class="hanoi-board-column">
        ${hanoiBoardHtml(step.pegs, step.n, { activeDisk: step.activeDisk, complete: step.phase === "complete" })}
      </div>
      <aside class="hanoi-call-panel" aria-label="Recursive call stack">
        <div class="hanoi-call-panel-heading">
          <span>Call stack</span>
          <strong class="hanoi-phase is-${step.phase}">${phaseLabels[step.phase] || "Trace"}</strong>
        </div>
        <ol class="hanoi-call-list">${stackHtml}</ol>
      </aside>
    </div>`;
}

function createPractice(n) {
  return {
    n,
    pegs: makeInitialPegs(n),
    moves: 0,
    activeDisk: null,
    log: [],
    history: [],
    selectedPeg: null,
    solved: false,
    error: false,
    message: "Choose a source peg, then choose a destination peg."
  };
}

function reducePractice(state, action) {
  if (action.type === "restart") return createPractice(state.n);

  if (action.type === "undo") {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    return {
      ...state,
      pegs: clonePegs(previous.pegs),
      moves: previous.moves,
      log: previous.log.map((move) => ({ ...move })),
      history: state.history.slice(0, -1),
      selectedPeg: null,
      activeDisk: null,
      solved: false,
      error: false,
      message: "The previous move was undone."
    };
  }

  if (action.type !== "select-peg") return state;
  const index = Number(action.value);
  if (!Number.isInteger(index) || index < 0 || index > 2 || state.solved) return state;

  if (state.selectedPeg === null) {
    if (state.pegs[index].length === 0) {
      return {
        ...state,
        error: true,
        activeDisk: null,
        message: `Peg ${PEG_NAMES[index]} is empty. Choose a peg with a disk.`
      };
    }
    return {
      ...state,
      selectedPeg: index,
      activeDisk: null,
      error: false,
      message: `Peg ${PEG_NAMES[index]} selected. Now choose a destination peg.`
    };
  }

  if (state.selectedPeg === index) {
    return {
      ...state,
      selectedPeg: null,
      activeDisk: null,
      error: false,
      message: "Selection cleared. Choose a source peg."
    };
  }

  const source = state.selectedPeg;
  const disk = state.pegs[source][state.pegs[source].length - 1];
  const destinationTop = state.pegs[index][state.pegs[index].length - 1];

  if (destinationTop !== undefined && destinationTop < disk) {
    return {
      ...state,
      selectedPeg: null,
      activeDisk: disk,
      error: true,
      message: `Illegal move: disk ${disk} cannot be placed on smaller disk ${destinationTop}.`
    };
  }

  const snapshot = {
    pegs: clonePegs(state.pegs),
    moves: state.moves,
    log: state.log.map((move) => ({ ...move }))
  };
  const pegs = clonePegs(state.pegs);
  pegs[source].pop();
  pegs[index].push(disk);
  const moves = state.moves + 1;
  const log = [...state.log, { disk, from: source, to: index }];
  const solved = pegs[2].length === state.n;

  return {
    ...state,
    pegs,
    moves,
    log,
    history: [...state.history, snapshot],
    selectedPeg: null,
    activeDisk: disk,
    solved,
    error: false,
    message: solved
      ? `Solved in ${moves} move${moves === 1 ? "" : "s"}. The recursive solution uses ${2 ** state.n - 1}.`
      : `Moved disk ${disk} from peg ${PEG_NAMES[source]} to peg ${PEG_NAMES[index]}.`
  };
}

function renderPractice(state) {
  const statusClass = state.solved ? "is-success" : state.error ? "is-error" : "";
  return `
    <div class="hanoi-layout">
      ${hanoiBoardHtml(state.pegs, state.n, {
        practice: true,
        selectedPeg: state.selectedPeg,
        activeDisk: state.activeDisk,
        complete: state.solved
      })}
      <p class="practice-message ${statusClass}">${escapeHtml(state.message)}</p>
    </div>`;
}

export const hanoiModule = {
  id: "hanoi",
  shortTitle: "Tower of Hanoi",
  title: "Tower of Hanoi",
  summary: "Move one disk at a time, inspect the active recursive calls, and derive the move recurrence from the puzzle structure.",
  complexity: "O(2ⁿ)",
  source: { slides: "12–26" },
  tags: ["recursive", "recurrence", "exponential"],
  objective: "Connect the two recursive subproblems and the largest-disk move to a recurrence.",
  input: {
    label: "Number of disks n",
    hint: "Use 1–7 disks. Three or four disks work best during a live lecture.",
    default: "3",
    presets: [
      { label: "3 disks", value: "3" },
      { label: "4 disks", value: "4" },
      { label: "5 disks", value: "5" }
    ],
    parse: (raw) => parseDiskCount(raw, 7)
  },
  pseudocode: [
    { line: 1, text: "Hanoi(n, source, destination, auxiliary)" },
    { line: 2, text: "if n = 1: move the single disk", indent: 1, basic: true },
    { line: 3, text: "Hanoi(n − 1, source, auxiliary, destination)", indent: 1 },
    { line: 4, text: "move disk n from source to destination", indent: 1, basic: true },
    { line: 5, text: "Hanoi(n − 1, auxiliary, destination, source)", indent: 1 }
  ],
  buildTrace: buildHanoiTrace,
  render: renderHanoi,
  metrics(step) {
    return [
      { label: "Disk moves", value: step.moves, emphasis: true }
    ];
  },
  analysis: [
    { term: "Input size", value: "n, the number of disks" },
    { term: "Basic operation", value: "Moving one disk" },
    { term: "Case behavior", value: "The total number of moves depends on n only" },
    { term: "Recurrence", value: "M(n) = M(n − 1) + 1 + M(n − 1), M(1) = 1" },
    { term: "Solution", value: "M(n) = 2ⁿ − 1 ∈ O(2ⁿ)" }
  ],
  model(step) {
    return {
      latex: "M(n) = 2M(n-1) + 1 \\implies 2^i M(n-i) + 2^i - 1 \\implies M(n) = 2^n - 1 \\in O(2^n)",
      notes: [
        "Backward substitutions expand the two recursive calls; the +1 is the largest-disk move."
      ]
    };
  },
  activity: {
    id: "practice",
    label: "Practice puzzle",
    create: createPractice,
    render: renderPractice,
    reduce: reducePractice,
    metrics(state) {
      return [
        { label: "Disk moves", value: state.moves, emphasis: true }
      ];
    },
    controls(state) {
      return [
        { action: "undo", label: "Undo move", disabled: state.history.length === 0, variant: "quiet" },
        { action: "restart", label: "Restart puzzle", variant: "primary" }
      ];
    }
  }
};
