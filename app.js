(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const dom = {
    moduleTabs: $("#moduleTabs"),
    moduleKicker: $("#moduleKicker"),
    moduleTitle: $("#moduleTitle"),
    moduleDescription: $("#moduleDescription"),
    moduleBadge: $("#moduleBadge"),
    scenarioButtons: $("#scenarioButtons"),
    inputForm: $("#inputForm"),
    inputLabel: $("#inputLabel"),
    input: $("#algorithmInput"),
    inputHint: $("#inputHint"),
    inputError: $("#inputError"),
    modeSwitcher: $("#modeSwitcher"),
    guidedModeButton: $("#guidedModeButton"),
    practiceModeButton: $("#practiceModeButton"),
    pseudocode: $("#pseudocode"),
    activeLineBadge: $("#activeLineBadge"),
    visualization: $("#visualization"),
    stepCounter: $("#stepCounter"),
    timelineControls: $("#timelineControls"),
    practiceControls: $("#practiceControls"),
    previousButton: $("#previousButton"),
    playButton: $("#playButton"),
    playIcon: $("#playIcon"),
    playLabel: $("#playLabel"),
    nextButton: $("#nextButton"),
    resetButton: $("#resetButton"),
    speedRange: $("#speedRange"),
    undoMoveButton: $("#undoMoveButton"),
    restartPuzzleButton: $("#restartPuzzleButton"),
    metrics: $("#metrics"),
    stepMessage: $("#stepMessage"),
    teachingPrompt: $("#teachingPrompt"),
    formulaPanel: $("#formulaPanel"),
    analysisChecklist: $("#analysisChecklist"),
    liveStatus: $("#liveStatus"),
    helpButton: $("#helpButton"),
    helpDialog: $("#helpDialog")
  };

  const app = {
    moduleId: "max-element",
    parsedInput: null,
    trace: [],
    stepIndex: 0,
    playing: false,
    timer: null,
    hanoiMode: "guided",
    manualHanoi: null
  };

  const PEG_NAMES = ["A", "B", "C"];

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatNumber(value) {
    if (Number.isInteger(value)) return String(value);
    return Number(value.toFixed(4)).toString();
  }

  function clonePegs(pegs) {
    return pegs.map((peg) => [...peg]);
  }

  function parseArray(raw, minLength, maxLength) {
    const parts = raw
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);

    if (parts.length < minLength || parts.length > maxLength) {
      throw new Error(`Enter between ${minLength} and ${maxLength} numbers.`);
    }

    const values = parts.map((part) => Number(part));
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error("Every array item must be a valid number.");
    }

    return values;
  }

  function parsePositiveInteger(raw, maximum = 1_000_000_000) {
    const value = Number(raw.trim());
    if (!Number.isInteger(value) || value < 1 || value > maximum) {
      throw new Error(`Enter a positive integer from 1 to ${maximum.toLocaleString()}.`);
    }
    return value;
  }

  function parseDiskCount(raw) {
    const value = Number(raw.trim());
    if (!Number.isInteger(value) || value < 1 || value > 7) {
      throw new Error("Enter a whole number of disks from 1 to 7.");
    }
    return value;
  }

  function makeInitialPegs(n) {
    return [Array.from({ length: n }, (_, index) => n - index), [], []];
  }

  function maxTrace(values) {
    const trace = [];
    let maxIndex = 0;
    let comparisons = 0;
    let updates = 0;

    trace.push({
      activeLine: 1,
      phase: "initial",
      values: [...values],
      currentIndex: null,
      maxIndex,
      processedThrough: 0,
      comparisons,
      updates,
      message: `Initialize max with A[0] = ${formatNumber(values[0])}.`,
      prompt: "Before stepping: which value will be the final maximum?"
    });

    for (let i = 1; i < values.length; i += 1) {
      const priorMaxIndex = maxIndex;
      const comparisonResult = values[i] > values[priorMaxIndex];
      comparisons += 1;

      trace.push({
        activeLine: 3,
        phase: "compare",
        values: [...values],
        currentIndex: i,
        maxIndex: priorMaxIndex,
        processedThrough: comparisonResult ? i - 1 : i,
        comparisons,
        updates,
        comparisonResult,
        message: `Compare A[${i}] = ${formatNumber(values[i])} with max = ${formatNumber(values[priorMaxIndex])}: ${comparisonResult ? "true" : "false"}.`,
        prompt: comparisonResult
          ? "The comparison is true. Which assignment must happen next?"
          : "The comparison is false. Why can the current maximum stay unchanged?"
      });

      if (comparisonResult) {
        maxIndex = i;
        updates += 1;
        trace.push({
          activeLine: 4,
          phase: "update",
          values: [...values],
          currentIndex: i,
          maxIndex,
          processedThrough: i,
          comparisons,
          updates,
          message: `Update max to A[${i}] = ${formatNumber(values[i])}.`,
          prompt: "How many comparisons have occurred, and does an assignment count as the chosen basic operation?"
        });
      }
    }

    trace.push({
      activeLine: 5,
      phase: "complete",
      values: [...values],
      currentIndex: null,
      maxIndex,
      processedThrough: values.length - 1,
      comparisons,
      updates,
      result: values[maxIndex],
      message: `Return ${formatNumber(values[maxIndex])}, the largest element.`,
      prompt: "Would sorted, reversed, or random order change the number of comparisons?"
    });

    return trace;
  }

  function uniqueTrace(values) {
    const trace = [];
    const visitedPairs = [];
    let comparisons = 0;

    trace.push({
      activeLine: 1,
      phase: "initial",
      values: [...values],
      currentPair: null,
      visitedPairs: [],
      comparisons,
      result: null,
      message: "Begin with the first possible pair of positions.",
      prompt: "Which pair of indices will the nested loops compare first?"
    });

    for (let i = 0; i <= values.length - 2; i += 1) {
      for (let j = i + 1; j <= values.length - 1; j += 1) {
        const equal = values[i] === values[j];
        comparisons += 1;
        visitedPairs.push({ i, j, equal });

        trace.push({
          activeLine: 3,
          phase: "compare",
          values: [...values],
          currentPair: [i, j],
          visitedPairs: visitedPairs.map((pair) => ({ ...pair })),
          comparisons,
          equal,
          result: null,
          message: `Compare A[${i}] = ${formatNumber(values[i])} with A[${j}] = ${formatNumber(values[j])}: ${equal ? "equal" : "different"}.`,
          prompt: equal
            ? "Why is it correct to stop immediately after finding this equal pair?"
            : "Following the nested loops, which pair will be checked next?"
        });

        if (equal) {
          trace.push({
            activeLine: 3,
            phase: "complete",
            values: [...values],
            currentPair: [i, j],
            visitedPairs: visitedPairs.map((pair) => ({ ...pair })),
            comparisons,
            equal,
            result: false,
            message: "Return False because two equal elements were found.",
            prompt: "How did the positions of the duplicate elements affect the comparison count?"
          });
          return trace;
        }
      }
    }

    trace.push({
      activeLine: 4,
      phase: "complete",
      values: [...values],
      currentPair: null,
      visitedPairs: visitedPairs.map((pair) => ({ ...pair })),
      comparisons,
      result: true,
      message: "Return True after examining every possible pair.",
      prompt: "Why is an all-distinct array a worst-case input for this algorithm?"
    });

    return trace;
  }

  function binaryIterativeTrace(original) {
    const trace = [];
    const history = [];
    let current = original;
    let count = 1;
    let comparisons = 0;
    let bodyExecutions = 0;

    trace.push({
      activeLine: 1,
      phase: "initial",
      original,
      current,
      count,
      comparisons,
      bodyExecutions,
      history: [],
      message: "Initialize count to 1.",
      prompt: `How many times can ${original} be halved before it reaches 1?`
    });

    while (true) {
      comparisons += 1;
      const condition = current > 1;
      history.push({
        check: comparisons,
        n: current,
        count,
        condition
      });

      trace.push({
        activeLine: 2,
        phase: "condition",
        original,
        current,
        count,
        comparisons,
        bodyExecutions,
        condition,
        history: history.map((row) => ({ ...row })),
        message: `Test n > 1: ${formatNumber(current)} > 1 is ${condition ? "true" : "false"}.`,
        prompt: condition
          ? "The condition is true. Which two statements execute in the loop body?"
          : "Why is the condition comparison count one larger than the loop-body count?"
      });

      if (!condition) break;

      count += 1;
      bodyExecutions += 1;
      trace.push({
        activeLine: 3,
        phase: "increment",
        original,
        current,
        count,
        comparisons,
        bodyExecutions,
        history: history.map((row) => ({ ...row })),
        message: `Increment count to ${count}.`,
        prompt: "What value will n have after integer division by 2?"
      });

      const beforeDivision = current;
      current = Math.floor(current / 2);
      trace.push({
        activeLine: 4,
        phase: "divide",
        original,
        current,
        count,
        comparisons,
        bodyExecutions,
        beforeDivision,
        history: history.map((row) => ({ ...row })),
        message: `Replace n with ⌊${beforeDivision} / 2⌋ = ${current}.`,
        prompt: "How much smaller is the remaining problem after this step?"
      });
    }

    trace.push({
      activeLine: 5,
      phase: "complete",
      original,
      current,
      count,
      comparisons,
      bodyExecutions,
      history: history.map((row) => ({ ...row })),
      result: count,
      message: `Return ${count} binary digits.`,
      prompt: "When n doubles, by approximately how much does the number of loop repetitions increase?"
    });

    return trace;
  }

  function hanoiTrace(n) {
    const trace = [];
    const pegs = makeInitialPegs(n);
    const moveLog = [];
    let moves = 0;

    const rootCall = { n, from: 0, to: 2, aux: 1 };
    trace.push({
      activeLine: 1,
      phase: "initial",
      n,
      pegs: clonePegs(pegs),
      moves,
      callStack: [rootCall],
      moveLog: [],
      message: `Start with ${n} disk${n === 1 ? "" : "s"} on peg A.`,
      prompt: `Predict the minimum number of moves for ${n} disk${n === 1 ? "" : "s"}.`
    });

    function moveDisk(disk, from, to, callStack, activeLine, kind) {
      const popped = pegs[from].pop();
      if (popped !== disk) {
        throw new Error("Internal Tower of Hanoi trace error.");
      }
      pegs[to].push(disk);
      moves += 1;
      const move = { disk, from, to };
      moveLog.push(move);

      trace.push({
        activeLine,
        phase: "move",
        kind,
        n,
        pegs: clonePegs(pegs),
        moves,
        callStack: callStack.map((frame) => ({ ...frame })),
        moveLog: moveLog.map((entry) => ({ ...entry })),
        currentMove: move,
        message: `Move disk ${disk} from peg ${PEG_NAMES[from]} to peg ${PEG_NAMES[to]}.`,
        prompt: moves === 2 ** n - 1
          ? "How does the move count change when one more disk is added?"
          : "Which recursive subproblem is represented by the active call stack?"
      });
    }

    function solve(k, from, to, aux, ancestors) {
      const frame = { n: k, from, to, aux };
      const stack = [...ancestors, frame];

      if (k === 1) {
        moveDisk(1, from, to, stack, 2, "base");
        return;
      }

      solve(k - 1, from, aux, to, stack);
      moveDisk(k, from, to, stack, 4, "largest");
      solve(k - 1, aux, to, from, stack);
    }

    solve(n, 0, 2, 1, []);

    trace.push({
      activeLine: null,
      activeLabel: "Complete",
      phase: "complete",
      n,
      pegs: clonePegs(pegs),
      moves,
      callStack: [],
      moveLog: moveLog.map((entry) => ({ ...entry })),
      message: `Solved in ${moves} moves, which equals 2^${n} − 1.`,
      prompt: "Use the recursive structure to explain M(n) = 2M(n − 1) + 1."
    });

    return trace;
  }

  function binaryRecursiveTrace(original) {
    const trace = [];
    let additions = 0;
    let calls = 0;
    const chain = [];
    let probe = original;
    while (true) {
      chain.push(probe);
      if (probe === 1) break;
      probe = Math.floor(probe / 2);
    }

    function visit(n, outerFrames) {
      calls += 1;
      const enteringFrame = { n, status: "check base case" };
      const enteringStack = [...outerFrames, enteringFrame];

      trace.push({
        activeLine: 2,
        phase: "enter",
        original,
        current: n,
        stack: enteringStack.map((frame) => ({ ...frame })),
        calls,
        additions,
        chain: [...chain],
        result: null,
        message: `Call BinRec(${n}) and test whether n = 1.`,
        prompt: n === 1
          ? "The base case is reached. What value is returned?"
          : `What argument will be used in the recursive call from BinRec(${n})?`
      });

      if (n === 1) {
        const baseStack = [
          ...outerFrames,
          { n, status: "return 1", returnValue: 1 }
        ];
        trace.push({
          activeLine: 2,
          phase: "base",
          original,
          current: n,
          stack: baseStack.map((frame) => ({ ...frame })),
          calls,
          additions,
          chain: [...chain],
          result: 1,
          message: "Base case: return 1.",
          prompt: "As the calls return, where will the first addition occur?"
        });
        return 1;
      }

      const childN = Math.floor(n / 2);
      const waitingFrames = [
        ...outerFrames,
        { n, status: `waiting for BinRec(${childN})` }
      ];
      const childResult = visit(childN, waitingFrames);
      additions += 1;
      const result = childResult + 1;
      const returningStack = [
        ...outerFrames,
        { n, status: `${childResult} + 1 = ${result}`, returnValue: result }
      ];

      trace.push({
        activeLine: 3,
        phase: "return",
        original,
        current: n,
        stack: returningStack.map((frame) => ({ ...frame })),
        calls,
        additions,
        chain: [...chain],
        result,
        message: `Return ${childResult} + 1 = ${result} from BinRec(${n}).`,
        prompt: additions === chain.length - 1
          ? "Why does the number of additions equal the number of halvings?"
          : "Which waiting call will resume next?"
      });

      return result;
    }

    const result = visit(original, []);
    trace.push({
      activeLine: null,
      activeLabel: "Complete",
      phase: "complete",
      original,
      current: null,
      stack: [],
      calls,
      additions,
      chain: [...chain],
      result,
      message: `BinRec(${original}) returns ${result}; the execution used ${additions} addition${additions === 1 ? "" : "s"}.`,
      prompt: "For n = 2^k, how does the call chain show that A(n) = log₂ n?"
    });

    return trace;
  }

  const modules = [
    {
      id: "max-element",
      navLabel: "Maximum",
      kicker: "Nonrecursive analysis",
      title: "Find the Maximum Element",
      description: "Trace each comparison, distinguish comparisons from assignments, and connect the fixed count to Θ(n).",
      complexity: "Θ(n)",
      inputLabel: "Array A",
      inputHint: "Enter 2–10 numbers separated by commas or spaces.",
      defaultInput: "4, 7, 2, 9, 5",
      presets: [
        { label: "Mixed", value: "4, 7, 2, 9, 5" },
        { label: "Descending", value: "9, 7, 5, 3, 1" },
        { label: "Ascending", value: "1, 3, 5, 7, 9" }
      ],
      parse: (raw) => parseArray(raw, 2, 10),
      buildTrace: maxTrace,
      pseudocode: [
        { line: 1, text: "max ← A[0]" },
        { line: 2, text: "for i ← 1 to n − 1 do" },
        { line: 3, text: "if A[i] > max", indent: 1, basic: true },
        { line: 4, text: "max ← A[i]", indent: 2 },
        { line: 5, text: "return max" }
      ],
      metrics(step) {
        return [
          ["Input size n", step.values.length],
          ["Comparisons", step.comparisons],
          ["max updates", step.updates],
          ["Current max", formatNumber(step.values[step.maxIndex])]
        ];
      },
      checklist: [
        ["Input size", "n, the number of elements in A"],
        ["Basic operation", "The comparison A[i] > max"],
        ["Case behavior", "The comparison count is the same for every arrangement"],
        ["Count", "C(n) = Σ from i = 1 to n − 1 of 1 = n − 1"],
        ["Growth", "n − 1 ∈ Θ(n)"]
      ],
      formula(step) {
        return {
          tokens: ["C(n)", "=", "Σᵢ₌₁ⁿ⁻¹ 1", "=", "n − 1", "∈", "Θ(n)"],
          notes: [
            `Observed for this input: ${step.comparisons} comparison${step.comparisons === 1 ? "" : "s"}.`,
            "Changing the element order can change max assignments, but not the comparison count."
          ]
        };
      },
      render: renderMaximum
    },
    {
      id: "unique-element",
      navLabel: "Uniqueness",
      kicker: "Nonrecursive analysis",
      title: "Element Uniqueness",
      description: "Watch the nested loops enumerate pairs and see how duplicate positions determine early termination or the worst case.",
      complexity: "Θ(n²) worst case",
      inputLabel: "Array A",
      inputHint: "Enter 2–9 numbers. Equal numeric values count as duplicates.",
      defaultInput: "5, 8, 11, 14",
      presets: [
        { label: "Distinct", value: "5, 8, 11, 14" },
        { label: "Early duplicate", value: "5, 5, 8, 11" },
        { label: "Middle duplicate", value: "5, 8, 5, 11" },
        { label: "Last pair equal", value: "5, 8, 11, 11" }
      ],
      parse: (raw) => parseArray(raw, 2, 9),
      buildTrace: uniqueTrace,
      pseudocode: [
        { line: 1, text: "for i ← 0 to n − 2 do" },
        { line: 2, text: "for j ← i + 1 to n − 1 do", indent: 1 },
        { line: 3, text: "if A[i] = A[j] return False", indent: 2, basic: true },
        { line: 4, text: "return True" }
      ],
      metrics(step) {
        const n = step.values.length;
        return [
          ["Input size n", n],
          ["Comparisons", step.comparisons],
          ["Worst-case limit", (n * (n - 1)) / 2],
          ["Result", step.result === null ? "—" : step.result ? "True" : "False"]
        ];
      },
      checklist: [
        ["Input size", "n, the number of elements in the array"],
        ["Basic operation", "The equality comparison in the innermost loop"],
        ["Case behavior", "Depends on whether equal elements exist and where they occur"],
        ["Worst case", "No equal elements, or only the final compared pair is equal"],
        ["Growth", "n(n − 1) / 2 ∈ Θ(n²)"]
      ],
      formula(step) {
        const n = step.values.length;
        const maximum = (n * (n - 1)) / 2;
        return {
          tokens: ["Cworst(n)", "=", "(n − 1) + ⋯ + 1", "=", "n(n − 1) / 2", "∈", "Θ(n²)"],
          notes: [
            `This trace has used ${step.comparisons} of at most ${maximum} pair comparisons.`,
            "The triangular pair matrix is the visual form of the nested summation."
          ]
        };
      },
      render: renderUnique
    },
    {
      id: "binary-iterative",
      navLabel: "Binary · loop",
      kicker: "Nonrecursive analysis",
      title: "Number of Binary Digits — Iterative",
      description: "Follow repeated halving and keep the condition comparisons separate from loop-body repetitions.",
      complexity: "Θ(log n)",
      inputLabel: "Positive decimal integer n",
      inputHint: "Enter an integer from 1 to 1,000,000,000. The visualization uses integer division.",
      defaultInput: "16",
      presets: [
        { label: "Power of two", value: "16" },
        { label: "Not a power of two", value: "13" },
        { label: "Base input", value: "1" },
        { label: "Larger", value: "255" }
      ],
      parse: (raw) => parsePositiveInteger(raw),
      buildTrace: binaryIterativeTrace,
      pseudocode: [
        { line: 1, text: "count ← 1" },
        { line: 2, text: "while n > 1 do", basic: true },
        { line: 3, text: "count ← count + 1", indent: 1 },
        { line: 4, text: "n ← n / 2", indent: 1 },
        { line: 5, text: "return count" }
      ],
      metrics(step) {
        return [
          ["Original n", step.original],
          ["Condition checks", step.comparisons],
          ["Loop repetitions", step.bodyExecutions],
          ["count", step.count]
        ];
      },
      checklist: [
        ["Input size", "The positive integer n"],
        ["Basic operation", "The comparison n > 1"],
        ["Case behavior", "For a fixed n, the execution path is determined"],
        ["Pattern", "n, n/2, n/4, n/8, …, 1"],
        ["Growth", "The number of halvings is logarithmic: Θ(log n)"]
      ],
      formula(step) {
        return {
          tokens: ["n", "→", "n/2", "→", "n/4", "→", "⋯", "→", "1"],
          notes: [
            `Observed: ${step.bodyExecutions} loop repetition${step.bodyExecutions === 1 ? "" : "s"} and ${step.comparisons} condition comparison${step.comparisons === 1 ? "" : "s"}.`,
            "The condition is checked once more after the final loop-body execution, so comparisons = repetitions + 1."
          ]
        };
      },
      render: renderBinaryIterative
    },
    {
      id: "hanoi",
      navLabel: "Tower of Hanoi",
      kicker: "Recursive analysis",
      title: "Tower of Hanoi",
      description: "Move one disk at a time, inspect the active recursive calls, and derive the move recurrence from the puzzle structure.",
      complexity: "O(2ⁿ)",
      inputLabel: "Number of disks n",
      inputHint: "Use 1–7 disks. Three or four disks work best during a live lecture.",
      defaultInput: "3",
      presets: [
        { label: "3 disks", value: "3" },
        { label: "4 disks", value: "4" },
        { label: "5 disks", value: "5" }
      ],
      parse: parseDiskCount,
      buildTrace: hanoiTrace,
      pseudocode: [
        { line: 1, text: "Hanoi(n, source, destination, auxiliary)" },
        { line: 2, text: "if n = 1: move the single disk", indent: 1, basic: true },
        { line: 3, text: "Hanoi(n − 1, source, auxiliary, destination)", indent: 1 },
        { line: 4, text: "move disk n from source to destination", indent: 1, basic: true },
        { line: 5, text: "Hanoi(n − 1, auxiliary, destination, source)", indent: 1 }
      ],
      metrics(step) {
        const n = step.n;
        return [
          ["Number of disks n", n],
          ["Moves made", step.moves],
          ["Minimum moves", 2 ** n - 1],
          ["Active depth", step.callStack ? step.callStack.length : "—"]
        ];
      },
      checklist: [
        ["Input size", "n, the number of disks"],
        ["Basic operation", "Moving one disk"],
        ["Case behavior", "The total number of moves depends on n only"],
        ["Recurrence", "M(n) = M(n − 1) + 1 + M(n − 1), M(1) = 1"],
        ["Solution", "M(n) = 2ⁿ − 1 ∈ O(2ⁿ)"]
      ],
      formula(step) {
        return {
          tokens: ["M(n)", "=", "2M(n − 1) + 1", "⇒", "M(n) = 2ⁿ − 1", "∈", "O(2ⁿ)"],
          notes: [
            `For n = ${step.n}, the exact minimum is ${2 ** step.n - 1} moves; ${step.moves} have been shown.`,
            "The two recursive calls move n − 1 disks, and the middle +1 is the largest-disk move."
          ]
        };
      },
      render: renderHanoi
    },
    {
      id: "binary-recursive",
      navLabel: "Binary · recursion",
      kicker: "Recursive analysis",
      title: "Number of Binary Digits — Recursive",
      description: "Trace the call stack and count additions while expanding A(n) = A(n/2) + 1 toward the base case.",
      complexity: "Θ(log n)",
      inputLabel: "Positive decimal integer n",
      inputHint: "Use powers of two to match the substitution in the slides, or try another positive integer.",
      defaultInput: "16",
      presets: [
        { label: "2⁴", value: "16" },
        { label: "2⁵", value: "32" },
        { label: "Not a power of two", value: "13" },
        { label: "Base input", value: "1" }
      ],
      parse: (raw) => parsePositiveInteger(raw),
      buildTrace: binaryRecursiveTrace,
      pseudocode: [
        { line: 1, text: "BinRec(n)" },
        { line: 2, text: "if n = 1 return 1", indent: 1 },
        { line: 3, text: "else return BinRec(n / 2) + 1", indent: 1, basic: true }
      ],
      metrics(step) {
        return [
          ["Original n", step.original],
          ["Recursive calls", step.calls],
          ["Additions", step.additions],
          ["Current result", step.result === null ? "—" : step.result]
        ];
      },
      checklist: [
        ["Input size", "The positive integer n"],
        ["Basic operation", "The addition performed after a recursive call returns"],
        ["Case behavior", "For a fixed n, the call chain is determined"],
        ["Recurrence", "A(n) = A(n/2) + 1 for n > 1, with A(1) = 0"],
        ["Solution", "For n = 2ᵏ, A(n) = k = log₂ n"]
      ],
      formula(step) {
        return {
          tokens: ["A(n)", "=", "A(n/2) + 1", "⇒", "A(2ᵏ)", "=", "k = log₂ n"],
          notes: [
            `This trace has made ${step.calls} recursive call${step.calls === 1 ? "" : "s"} and performed ${step.additions} addition${step.additions === 1 ? "" : "s"}.`,
            "The slide derivation chooses n = 2ᵏ so repeated halving reaches 1 after exactly k steps."
          ]
        };
      },
      render: renderBinaryRecursive
    }
  ];

  const moduleMap = new Map(modules.map((module) => [module.id, module]));

  function renderMaximum(container, step) {
    const values = step.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;

    const bars = values.map((value, index) => {
      const height = 78 + ((value - min) / spread) * 155;
      const classes = ["array-item"];
      if (index <= step.processedThrough) classes.push("is-processed");
      if (index === step.maxIndex) classes.push("is-max");
      if (index === step.currentIndex) classes.push("is-current");
      return `
        <div class="${classes.join(" ")}" style="--bar-height:${height}px" aria-label="A index ${index} equals ${escapeHtml(formatNumber(value))}">
          <span>${escapeHtml(formatNumber(value))}</span>
          <span class="array-index">A[${index}]</span>
        </div>`;
    }).join("");

    const comparison = step.phase === "compare"
      ? `<span class="annotation-pill"><strong>${escapeHtml(formatNumber(values[step.currentIndex]))}</strong> &gt; <strong>${escapeHtml(formatNumber(values[step.maxIndex]))}</strong> → ${step.comparisonResult ? "True" : "False"}</span>`
      : "";

    container.innerHTML = `
      <div class="viz-stack">
        <div class="viz-caption">
          <span>Processed prefix: A[0…${Math.max(0, step.processedThrough)}]</span>
          <span class="state-chip">max = ${escapeHtml(formatNumber(values[step.maxIndex]))}</span>
        </div>
        <div class="array-row">${bars}</div>
        <div class="array-label-row">
          ${comparison}
          <span class="annotation-pill">green = current maximum</span>
          <span class="annotation-pill">orange = current element</span>
        </div>
      </div>`;
  }

  function renderUnique(container, step) {
    const values = step.values;
    const n = values.length;
    const currentPair = step.currentPair || [];
    const visitedMap = new Map(step.visitedPairs.map((pair) => [`${pair.i}-${pair.j}`, pair]));

    const arrayHtml = values.map((value, index) => {
      const classes = ["compact-array-item"];
      if (currentPair.includes(index)) classes.push("is-current");
      if (step.equal && currentPair.includes(index)) classes.push("is-duplicate");
      return `
        <div class="${classes.join(" ")}">
          <small>A[${index}]</small>
          ${escapeHtml(formatNumber(value))}
        </div>`;
    }).join("");

    let matrixHtml = `<div class="matrix-label"></div>`;
    for (let col = 0; col < n; col += 1) {
      matrixHtml += `<div class="matrix-label">${col}</div>`;
    }
    for (let row = 0; row < n; row += 1) {
      matrixHtml += `<div class="matrix-label">${row}</div>`;
      for (let col = 0; col < n; col += 1) {
        const key = `${row}-${col}`;
        const pair = visitedMap.get(key);
        const classes = ["matrix-cell"];
        let label = "";
        if (col <= row) {
          classes.push("is-unused");
        } else {
          label = `${row},${col}`;
          if (pair) classes.push("is-visited");
          if (currentPair[0] === row && currentPair[1] === col) classes.push("is-current");
          if (pair?.equal) classes.push("is-duplicate");
        }
        matrixHtml += `<div class="${classes.join(" ")}" aria-label="pair ${row}, ${col}">${label}</div>`;
      }
    }

    let resultBanner = "";
    if (step.result !== null) {
      resultBanner = `<div class="result-banner ${step.result ? "is-true" : "is-false"}">Return ${step.result ? "True — all elements are distinct" : "False — duplicate found"}</div>`;
    }

    const pairText = step.currentPair
      ? `Current pair: A[${step.currentPair[0]}] and A[${step.currentPair[1]}]`
      : "Pair-comparison matrix";

    container.innerHTML = `
      <div class="unique-layout">
        <div>
          <div class="viz-caption"><span>${pairText}</span></div>
          <div class="compact-array">${arrayHtml}</div>
          ${resultBanner}
        </div>
        <div class="matrix-wrapper">
          <div class="viz-caption">
            <span>Rows are i; columns are j</span>
            <span class="state-chip">${step.comparisons} checked</span>
          </div>
          <div class="pair-matrix" style="--matrix-size:${n}">${matrixHtml}</div>
        </div>
      </div>`;
  }

  function renderBinaryIterative(container, step) {
    const rows = step.history.map((row, index) => {
      const isLast = index === step.history.length - 1;
      const classes = ["ladder-row"];
      if (isLast && step.phase !== "divide") classes.push("is-active");
      if (!row.condition) classes.push("is-false");
      return `
        <div class="${classes.join(" ")}">
          <span class="ladder-step">${row.check}</span>
          <span>n = ${row.n}</span>
          <span>count = ${row.count}</span>
          <span class="ladder-condition">${row.n} &gt; 1 → ${row.condition ? "True" : "False"}</span>
        </div>`;
    }).join("");

    const pending = step.history.length === 0
      ? `<div class="empty-state">The first condition check will appear here.</div>`
      : rows;

    let transition = "";
    if (step.phase === "divide") {
      transition = `<span class="annotation-pill"><strong>⌊${step.beforeDivision} / 2⌋ = ${step.current}</strong></span>`;
    }

    container.innerHTML = `
      <div class="binary-layout">
        <div class="viz-caption">
          <span>Repeated halving of the loop variable</span>
          <span class="state-chip">current n = ${step.current}</span>
        </div>
        <div class="binary-ladder">${pending}</div>
        <div class="binary-summary">
          ${transition}
          <span class="annotation-pill">loop body: <strong>${step.bodyExecutions}</strong></span>
          <span class="annotation-pill">condition checks: <strong>${step.comparisons}</strong></span>
          <span class="annotation-pill">returned count: <strong>${step.count}</strong></span>
        </div>
      </div>`;
  }

  function diskStackHtml(peg, n) {
    return peg.map((disk, index) => {
      const width = 38 + (disk / n) * 55;
      const topClass = index === peg.length - 1 ? " is-top" : "";
      return `<div class="hanoi-disk${topClass}" style="--disk-width:${width}%" aria-label="disk ${disk}">${disk}</div>`;
    }).join("");
  }

  function hanoiBoardHtml(pegs, n, options = {}) {
    const { practice = false, selectedPeg = null } = options;
    return `
      <div class="hanoi-board ${practice ? "is-practice" : ""}">
        ${pegs.map((peg, index) => `
          <div class="peg-zone ${selectedPeg === index ? "is-selected" : ""}"
               ${practice ? `data-peg-index="${index}" role="button" tabindex="0" aria-label="Peg ${PEG_NAMES[index]}${selectedPeg === index ? ", selected" : ""}"` : ""}>
            <div class="peg" aria-hidden="true"></div>
            <div class="disk-stack">${diskStackHtml(peg, n)}</div>
            <span class="peg-label">${PEG_NAMES[index]}</span>
          </div>`).join("")}
      </div>`;
  }

  function renderHanoi(container, step) {
    const recentMoves = step.moveLog.slice(-4);
    const callStack = step.callStack || [];

    const callStackHtml = callStack.length
      ? callStack.map((frame) => `
          <li class="call-stack-frame">Hanoi(${frame.n}, ${PEG_NAMES[frame.from]} → ${PEG_NAMES[frame.to]}, aux ${PEG_NAMES[frame.aux]})</li>`).join("")
      : `<li class="call-stack-frame">No active call</li>`;

    const moveLogHtml = recentMoves.length
      ? recentMoves.map((move) => `<li>disk ${move.disk}: ${PEG_NAMES[move.from]} → ${PEG_NAMES[move.to]}</li>`).join("")
      : `<li>No moves yet</li>`;

    container.innerHTML = `
      <div class="hanoi-layout">
        ${hanoiBoardHtml(step.pegs, step.n)}
        <div class="hanoi-lower-grid">
          <div class="call-stack-panel">
            <p class="mini-panel-title">Active recursive calls</p>
            <ul class="call-stack-list">${callStackHtml}</ul>
          </div>
          <div class="move-log-panel">
            <p class="mini-panel-title">Most recent moves</p>
            <ol class="move-log">${moveLogHtml}</ol>
          </div>
        </div>
      </div>`;
  }

  function renderManualHanoi(container, state) {
    const statusClass = state.solved ? "is-success" : state.error ? "is-error" : "";
    container.innerHTML = `
      <div class="hanoi-layout">
        ${hanoiBoardHtml(state.pegs, state.n, { practice: true, selectedPeg: state.selectedPeg })}
        <p class="practice-message ${statusClass}">${escapeHtml(state.message)}</p>
        <div class="binary-summary">
          <span class="annotation-pill">moves: <strong>${state.moves}</strong></span>
          <span class="annotation-pill">minimum: <strong>${2 ** state.n - 1}</strong></span>
          <span class="annotation-pill">goal: <strong>A → C</strong></span>
        </div>
      </div>`;
  }

  function renderBinaryRecursive(container, step) {
    const frames = step.stack.length
      ? step.stack.map((frame, index) => {
          const active = index === step.stack.length - 1;
          return `
            <div class="recursion-frame ${active ? "is-active" : ""}">
              BinRec(${frame.n})
              <span class="frame-status">${escapeHtml(frame.status)}</span>
            </div>`;
        }).join("")
      : `<div class="empty-state">Call stack empty.<br>The result has returned to the caller.</div>`;

    const revealedDepth = Math.max(step.calls, 1);
    const recurrenceRows = step.chain.map((value, index) => {
      const isBase = value === 1;
      const next = isBase ? null : Math.floor(value / 2);
      const text = isBase ? "A(1) = 0" : `A(${value}) = A(${next}) + 1`;
      const active = value === step.current;
      const pending = index >= revealedDepth;
      return `<div class="recurrence-step ${active ? "is-active" : ""} ${pending ? "is-pending" : ""}">${text}</div>`;
    }).join("");

    container.innerHTML = `
      <div class="recursive-layout">
        <div class="recursion-stack">
          <p class="mini-panel-title">Call stack — active call on top</p>
          <div class="recursion-frames">${frames}</div>
        </div>
        <div class="recurrence-ladder">
          <p class="mini-panel-title">Recurrence expansion</p>
          <div class="recurrence-steps">${recurrenceRows}</div>
          <div class="binary-summary">
            <span class="annotation-pill">calls: <strong>${step.calls}</strong></span>
            <span class="annotation-pill">additions: <strong>${step.additions}</strong></span>
          </div>
        </div>
      </div>`;
  }

  function currentModule() {
    return moduleMap.get(app.moduleId);
  }

  function renderTabs() {
    dom.moduleTabs.innerHTML = modules.map((module) => `
      <button class="module-tab" type="button" role="tab" data-module-id="${module.id}" aria-selected="${module.id === app.moduleId}">
        ${escapeHtml(module.navLabel)}
      </button>`).join("");
  }

  function renderPseudocode(module) {
    dom.pseudocode.innerHTML = module.pseudocode.map((line) => `
      <li class="code-line ${line.indent ? `code-indent-${line.indent}` : ""} ${line.basic ? "is-basic" : ""}"
          data-code-line="${line.line}"
          data-line-number="${line.line}">
        <span class="code-text">${escapeHtml(line.text)}</span>
      </li>`).join("");
  }

  function renderPresets(module) {
    dom.scenarioButtons.innerHTML = module.presets.map((preset) => `
      <button class="scenario-button" type="button" data-preset-value="${escapeHtml(preset.value)}">
        ${escapeHtml(preset.label)}
      </button>`).join("");
  }

  function renderChecklist(module) {
    dom.analysisChecklist.innerHTML = module.checklist.map(([term, definition]) => `
      <dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("");
  }

  function renderFormula(formula) {
    dom.formulaPanel.innerHTML = `
      <div class="formula-main">
        ${formula.tokens.map((token, index) => {
          const isOperator = ["=", "∈", "⇒", "→"].includes(token);
          return isOperator
            ? `<span class="formula-arrow">${escapeHtml(token)}</span>`
            : `<span class="formula-token">${escapeHtml(token)}</span>`;
        }).join("")}
      </div>
      ${formula.notes.map((note) => `<p class="formula-note">${escapeHtml(note)}</p>`).join("")}`;
  }

  function renderMetrics(entries) {
    dom.metrics.innerHTML = entries.map(([label, value]) => `
      <dl class="metric">
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </dl>`).join("");
  }

  function highlightPseudocode(activeLine, fallbackLabel = "Ready") {
    $$(".code-line", dom.pseudocode).forEach((line) => {
      line.classList.toggle("is-active", activeLine !== null && Number(line.dataset.codeLine) === Number(activeLine));
    });
    dom.activeLineBadge.textContent = activeLine !== null ? `Line ${activeLine}` : fallbackLabel;
  }

  function renderCurrentStep({ announce = false } = {}) {
    const module = currentModule();

    if (module.id === "hanoi" && app.hanoiMode === "practice") {
      renderManualState({ announce });
      return;
    }

    const step = app.trace[app.stepIndex];
    if (!step) return;

    module.render(dom.visualization, step);
    highlightPseudocode(step.activeLine, step.activeLabel || "Ready");
    renderMetrics(module.metrics(step));
    renderFormula(module.formula(step));

    const maximumStep = Math.max(0, app.trace.length - 1);
    dom.stepCounter.textContent = `Step ${app.stepIndex} / ${maximumStep}`;
    dom.stepMessage.textContent = step.message;
    dom.teachingPrompt.textContent = step.prompt;

    dom.previousButton.disabled = app.stepIndex === 0;
    dom.nextButton.disabled = app.stepIndex >= app.trace.length - 1;
    dom.resetButton.disabled = app.stepIndex === 0;

    if (app.stepIndex >= app.trace.length - 1 && app.playing) {
      stopPlayback();
    }

    if (announce) {
      dom.liveStatus.textContent = `Step ${app.stepIndex}. ${step.message}`;
    }
  }

  function createManualHanoi(n) {
    return {
      n,
      pegs: makeInitialPegs(n),
      selectedPeg: null,
      moves: 0,
      history: [],
      log: [],
      solved: false,
      error: false,
      message: "Select a peg containing a top disk, then select the destination peg."
    };
  }

  function manualMetrics(state) {
    return [
      ["Number of disks n", state.n],
      ["Moves made", state.moves],
      ["Minimum moves", 2 ** state.n - 1],
      ["Status", state.solved ? "Solved" : "In progress"]
    ];
  }

  function renderManualState({ announce = false } = {}) {
    const module = currentModule();
    const state = app.manualHanoi;
    if (!state) return;

    renderManualHanoi(dom.visualization, state);
    highlightPseudocode(null, "Practice");
    renderMetrics(manualMetrics(state));
    renderFormula(module.formula({ n: state.n, moves: state.moves }));
    dom.stepCounter.textContent = `Practice · ${state.moves} move${state.moves === 1 ? "" : "s"}`;
    dom.stepMessage.textContent = state.message;
    dom.teachingPrompt.textContent = state.solved
      ? "Can you explain why no solution can use fewer than 2ⁿ − 1 moves?"
      : "Before moving: which smaller Tower of Hanoi subproblem are you solving?";
    dom.undoMoveButton.disabled = state.history.length === 0;

    if (announce) dom.liveStatus.textContent = state.message;
  }

  function saveManualSnapshot(state) {
    state.history.push({
      pegs: clonePegs(state.pegs),
      moves: state.moves,
      log: state.log.map((move) => ({ ...move }))
    });
  }

  function chooseManualPeg(index) {
    const state = app.manualHanoi;
    if (!state || state.solved) return;

    if (state.selectedPeg === null) {
      if (state.pegs[index].length === 0) {
        state.error = true;
        state.message = `Peg ${PEG_NAMES[index]} is empty. Select a peg with a top disk.`;
      } else {
        state.selectedPeg = index;
        state.error = false;
        const disk = state.pegs[index][state.pegs[index].length - 1];
        state.message = `Disk ${disk} selected from peg ${PEG_NAMES[index]}. Now choose a destination.`;
      }
      renderManualState({ announce: true });
      return;
    }

    if (state.selectedPeg === index) {
      state.selectedPeg = null;
      state.error = false;
      state.message = "Selection cleared. Choose a source peg.";
      renderManualState({ announce: true });
      return;
    }

    const source = state.selectedPeg;
    const disk = state.pegs[source][state.pegs[source].length - 1];
    const destinationTop = state.pegs[index][state.pegs[index].length - 1];

    if (destinationTop !== undefined && destinationTop < disk) {
      state.error = true;
      state.message = `Illegal move: disk ${disk} cannot be placed on smaller disk ${destinationTop}.`;
      state.selectedPeg = null;
      renderManualState({ announce: true });
      return;
    }

    saveManualSnapshot(state);
    state.pegs[source].pop();
    state.pegs[index].push(disk);
    state.moves += 1;
    state.log.push({ disk, from: source, to: index });
    state.selectedPeg = null;
    state.error = false;
    state.solved = state.pegs[2].length === state.n;
    state.message = state.solved
      ? `Solved in ${state.moves} move${state.moves === 1 ? "" : "s"}. The minimum is ${2 ** state.n - 1}.`
      : `Moved disk ${disk} from peg ${PEG_NAMES[source]} to peg ${PEG_NAMES[index]}.`;

    renderManualState({ announce: true });
  }

  function undoManualMove() {
    const state = app.manualHanoi;
    if (!state || state.history.length === 0) return;
    const snapshot = state.history.pop();
    state.pegs = clonePegs(snapshot.pegs);
    state.moves = snapshot.moves;
    state.log = snapshot.log.map((move) => ({ ...move }));
    state.selectedPeg = null;
    state.solved = false;
    state.error = false;
    state.message = "The previous move was undone.";
    renderManualState({ announce: true });
  }

  function switchHanoiMode(mode) {
    if (app.moduleId !== "hanoi" || !["guided", "practice"].includes(mode)) return;
    stopPlayback();
    app.hanoiMode = mode;

    const practice = mode === "practice";
    dom.guidedModeButton.classList.toggle("is-active", !practice);
    dom.guidedModeButton.setAttribute("aria-pressed", String(!practice));
    dom.practiceModeButton.classList.toggle("is-active", practice);
    dom.practiceModeButton.setAttribute("aria-pressed", String(practice));
    dom.timelineControls.hidden = practice;
    dom.practiceControls.hidden = !practice;

    if (practice) {
      app.manualHanoi = createManualHanoi(app.parsedInput);
      renderManualState({ announce: true });
    } else {
      app.stepIndex = 0;
      renderCurrentStep({ announce: true });
    }
  }

  function showInputError(message) {
    dom.inputError.textContent = message;
    dom.inputError.hidden = false;
    dom.input.setAttribute("aria-invalid", "true");
  }

  function clearInputError() {
    dom.inputError.textContent = "";
    dom.inputError.hidden = true;
    dom.input.removeAttribute("aria-invalid");
  }

  function applyInput(raw = dom.input.value) {
    const module = currentModule();
    stopPlayback();

    try {
      const parsed = module.parse(raw);
      app.parsedInput = parsed;
      app.trace = module.buildTrace(parsed);
      app.stepIndex = 0;
      clearInputError();

      if (module.id === "hanoi" && app.hanoiMode === "practice") {
        app.manualHanoi = createManualHanoi(parsed);
        renderManualState({ announce: true });
      } else {
        renderCurrentStep({ announce: true });
      }
    } catch (error) {
      showInputError(error instanceof Error ? error.message : "The input could not be read.");
    }
  }

  function setModule(moduleId, { updateUrl = true } = {}) {
    if (!moduleMap.has(moduleId)) moduleId = modules[0].id;
    stopPlayback();
    app.moduleId = moduleId;
    app.hanoiMode = "guided";

    const module = currentModule();
    dom.moduleKicker.textContent = module.kicker;
    dom.moduleTitle.textContent = module.title;
    dom.moduleDescription.textContent = module.description;
    dom.moduleBadge.textContent = module.complexity;
    dom.inputLabel.textContent = module.inputLabel;
    dom.inputHint.textContent = module.inputHint;
    dom.input.value = module.defaultInput;
    dom.modeSwitcher.hidden = module.id !== "hanoi";
    dom.timelineControls.hidden = false;
    dom.practiceControls.hidden = true;
    dom.guidedModeButton.classList.add("is-active");
    dom.guidedModeButton.setAttribute("aria-pressed", "true");
    dom.practiceModeButton.classList.remove("is-active");
    dom.practiceModeButton.setAttribute("aria-pressed", "false");

    renderTabs();
    renderPseudocode(module);
    renderPresets(module);
    renderChecklist(module);
    clearInputError();
    applyInput(module.defaultInput);

    if (updateUrl) {
      const newUrl = `${window.location.pathname}${window.location.search}#${module.id}`;
      try {
        window.history.replaceState(null, "", newUrl);
      } catch {
        // Some preview sandboxes use an opaque origin. The visualizer still works without URL updates.
      }
    }
  }

  function goToStep(index, { announce = true } = {}) {
    const bounded = Math.max(0, Math.min(index, app.trace.length - 1));
    app.stepIndex = bounded;
    renderCurrentStep({ announce });
  }

  function stopPlayback() {
    app.playing = false;
    if (app.timer) {
      window.clearTimeout(app.timer);
      app.timer = null;
    }
    dom.playIcon.textContent = "▶";
    dom.playLabel.textContent = "Play";
    dom.playButton.setAttribute("aria-label", "Play visualization");
  }

  function scheduleNextStep() {
    if (!app.playing) return;
    const delay = Number(dom.speedRange.value);
    app.timer = window.setTimeout(() => {
      if (app.stepIndex >= app.trace.length - 1) {
        stopPlayback();
        return;
      }
      goToStep(app.stepIndex + 1, { announce: false });
      scheduleNextStep();
    }, delay);
  }

  function togglePlayback() {
    if (app.playing) {
      stopPlayback();
      return;
    }

    if (app.stepIndex >= app.trace.length - 1) {
      goToStep(0, { announce: false });
    }

    app.playing = true;
    dom.playIcon.textContent = "❚❚";
    dom.playLabel.textContent = "Pause";
    dom.playButton.setAttribute("aria-label", "Pause visualization");
    scheduleNextStep();
  }

  function initialModuleId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("module");
    const fromHash = window.location.hash.replace(/^#/, "");
    if (fromQuery && moduleMap.has(fromQuery)) return fromQuery;
    if (fromHash && moduleMap.has(fromHash)) return fromHash;
    return modules[0].id;
  }

  dom.moduleTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-module-id]");
    if (!button) return;
    setModule(button.dataset.moduleId);
  });

  dom.scenarioButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset-value]");
    if (!button) return;
    dom.input.value = button.dataset.presetValue;
    applyInput(button.dataset.presetValue);
  });

  dom.inputForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyInput();
  });

  dom.previousButton.addEventListener("click", () => {
    stopPlayback();
    goToStep(app.stepIndex - 1);
  });

  dom.nextButton.addEventListener("click", () => {
    stopPlayback();
    goToStep(app.stepIndex + 1);
  });

  dom.resetButton.addEventListener("click", () => {
    stopPlayback();
    goToStep(0);
  });

  dom.playButton.addEventListener("click", togglePlayback);

  dom.speedRange.addEventListener("input", () => {
    if (app.playing) {
      if (app.timer) window.clearTimeout(app.timer);
      scheduleNextStep();
    }
  });

  dom.guidedModeButton.addEventListener("click", () => switchHanoiMode("guided"));
  dom.practiceModeButton.addEventListener("click", () => switchHanoiMode("practice"));
  dom.undoMoveButton.addEventListener("click", undoManualMove);
  dom.restartPuzzleButton.addEventListener("click", () => {
    app.manualHanoi = createManualHanoi(app.parsedInput);
    renderManualState({ announce: true });
  });

  dom.visualization.addEventListener("click", (event) => {
    const peg = event.target.closest("[data-peg-index]");
    if (!peg || app.moduleId !== "hanoi" || app.hanoiMode !== "practice") return;
    chooseManualPeg(Number(peg.dataset.pegIndex));
  });

  dom.visualization.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const peg = event.target.closest("[data-peg-index]");
    if (!peg || app.moduleId !== "hanoi" || app.hanoiMode !== "practice") return;
    event.preventDefault();
    chooseManualPeg(Number(peg.dataset.pegIndex));
  });

  dom.helpButton.addEventListener("click", () => {
    if (typeof dom.helpDialog.showModal === "function") dom.helpDialog.showModal();
  });

  window.addEventListener("hashchange", () => {
    const id = window.location.hash.replace(/^#/, "");
    if (moduleMap.has(id) && id !== app.moduleId) setModule(id, { updateUrl: false });
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, button, textarea, select")) return;
    if (app.moduleId === "hanoi" && app.hanoiMode === "practice") return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stopPlayback();
      goToStep(app.stepIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      stopPlayback();
      goToStep(app.stepIndex - 1);
    } else if (event.key === " ") {
      event.preventDefault();
      togglePlayback();
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") document.body.classList.add("embed-mode");
  setModule(initialModuleId(), { updateUrl: false });

  // Small, read-only hook for smoke tests and classroom integrations.
  window.AlgorithmLab = Object.freeze({
    modules: modules.map((module) => module.id),
    openModule: (id) => setModule(id),
    getState: () => ({
      moduleId: app.moduleId,
      stepIndex: app.stepIndex,
      traceLength: app.trace.length,
      hanoiMode: app.hanoiMode
    })
  });
})();
