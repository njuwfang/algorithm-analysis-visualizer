import { escapeHtml } from "../../core/utils.js?v=20260916-1";

const MAX_TEXT_LENGTH = 24;
const MAX_PATTERN_LENGTH = 10;

export function parseStringMatchingInput(raw) {
  const parts = String(raw).split("|");
  if (parts.length !== 2) {
    throw new Error("Enter one text and one pattern separated by |.");
  }

  const text = parts[0].trim();
  const pattern = parts[1].trim();
  if (!text) throw new Error("The text cannot be empty.");
  if (!pattern) throw new Error("The pattern cannot be empty.");
  if (!/^[\x20-\x7E]+$/.test(text) || !/^[\x20-\x7E]+$/.test(pattern)) {
    throw new Error("Use standard ASCII characters so each displayed cell is one character.");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Keep the text to ${MAX_TEXT_LENGTH} characters or fewer.`);
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Keep the pattern to ${MAX_PATTERN_LENGTH} characters or fewer.`);
  }
  if (pattern.length > text.length) {
    throw new Error("The pattern cannot be longer than the text.");
  }

  return { text, pattern };
}

function copyState({ text, pattern, comparisons, alignments, alignment, patternIndex, matchedPrefix, found, phase, activeLine, message }) {
  return {
    text,
    pattern,
    comparisons,
    alignments,
    alignment,
    patternIndex,
    textIndex: patternIndex === null ? null : alignment + patternIndex,
    matchedPrefix,
    found,
    phase,
    activeLine,
    message
  };
}

export function buildStringMatchingTrace({ text, pattern }) {
  const trace = [];
  let comparisons = 0;
  let alignments = 0;

  trace.push(copyState({
    text,
    pattern,
    comparisons,
    alignments,
    alignment: 0,
    patternIndex: null,
    matchedPrefix: 0,
    found: null,
    phase: "initial",
    activeLine: 1,
    message: `Start with the pattern under text position 0.`
  }));

  for (let i = 0; i <= text.length - pattern.length; i += 1) {
    alignments += 1;
    trace.push(copyState({
      text,
      pattern,
      comparisons,
      alignments,
      alignment: i,
      patternIndex: null,
      matchedPrefix: 0,
      found: null,
      phase: "align",
      activeLine: 2,
      message: `Align P[0] with T[${i}] and set j to 0.`
    }));

    let j = 0;
    while (j < pattern.length) {
      comparisons += 1;
      const matches = pattern[j] === text[i + j];
      trace.push({
        ...copyState({
          text,
          pattern,
          comparisons,
          alignments,
          alignment: i,
          patternIndex: j,
          matchedPrefix: matches ? j + 1 : j,
          found: null,
          phase: "compare",
          activeLine: 3,
          message: `Compare P[${j}] = “${pattern[j]}” with T[${i + j}] = “${text[i + j]}”: ${matches ? "match" : "mismatch"}.`
        }),
        matches
      });

      if (!matches) break;
      j += 1;
      trace.push(copyState({
        text,
        pattern,
        comparisons,
        alignments,
        alignment: i,
        patternIndex: null,
        matchedPrefix: j,
        found: null,
        phase: "advance",
        activeLine: 4,
        message: `The characters match; advance j to ${j}.`
      }));
    }

    if (j === pattern.length) {
      trace.push(copyState({
        text,
        pattern,
        comparisons,
        alignments,
        alignment: i,
        patternIndex: null,
        matchedPrefix: pattern.length,
        found: i,
        phase: "complete",
        activeLine: 5,
        message: `All ${pattern.length} characters match; return position ${i}.`
      }));
      return trace;
    }
  }

  trace.push(copyState({
    text,
    pattern,
    comparisons,
    alignments,
    alignment: text.length - pattern.length,
    patternIndex: null,
    matchedPrefix: 0,
    found: -1,
    phase: "complete",
    activeLine: 6,
    message: "No alignment matches; return −1."
  }));
  return trace;
}

function visibleCharacter(character) {
  return character === " " ? "␠" : character;
}

function renderStringMatching(step) {
  const textCells = [...step.text].map((character, index) => {
    const isCurrent = index === step.textIndex;
    const isMatched = index >= step.alignment && index < step.alignment + step.matchedPrefix;
    const classes = ["string-cell", isMatched ? "is-matched" : "", isCurrent ? "is-current" : ""]
      .filter(Boolean)
      .join(" ");
    return `<span class="${classes}" ${isCurrent ? 'data-active-visual="true"' : ""} aria-label="T[${index}] ${escapeHtml(visibleCharacter(character))}">
      <small>${index}</small>${escapeHtml(visibleCharacter(character))}
    </span>`;
  }).join("");

  const patternCells = Array.from({ length: step.text.length }, (_, index) => {
    const patternIndex = index - step.alignment;
    if (patternIndex < 0 || patternIndex >= step.pattern.length) {
      return '<span class="string-cell is-spacer" aria-hidden="true"></span>';
    }
    const isCurrent = patternIndex === step.patternIndex;
    const isMatched = patternIndex < step.matchedPrefix;
    const classes = ["string-cell", "is-pattern", isMatched ? "is-matched" : "", isCurrent ? "is-current" : ""]
      .filter(Boolean)
      .join(" ");
    return `<span class="${classes}" aria-label="P[${patternIndex}] ${escapeHtml(visibleCharacter(step.pattern[patternIndex]))}">
      ${escapeHtml(visibleCharacter(step.pattern[patternIndex]))}
    </span>`;
  }).join("");

  const resultText = step.found === null
    ? `${step.matchedPrefix} of ${step.pattern.length} matched at this alignment`
    : step.found >= 0
      ? `Found at index ${step.found}`
      : "Pattern not found";

  return `
    <div class="string-visual">
      <div class="string-status">
        <span class="state-chip">alignment i = ${step.alignment}</span>
        <strong>${escapeHtml(resultText)}</strong>
      </div>
      <div class="string-track" style="--string-length:${step.text.length}">
        <span class="string-row-label">Text T</span>
        <div class="string-cells">${textCells}</div>
        <span class="string-row-label">Pattern P</span>
        <div class="string-cells">${patternCells}</div>
      </div>
      <div class="string-key" aria-label="Visualization key">
        <span><i class="key-swatch is-current"></i> compared now</span>
        <span><i class="key-swatch is-matched"></i> matching prefix</span>
      </div>
    </div>`;
}

export const stringMatchingModule = {
  id: "string-matching",
  shortTitle: "String matching",
  title: "Brute-Force String Matching",
  summary: "Slide the pattern across the text and count character comparisons until one alignment matches.",
  complexity: "O(mn)",
  source: { slides: "41–64" },
  objective: "Connect each attempted alignment to the worst-case count m(n − m + 1).",
  input: {
    label: "Text | pattern",
    hint: "Separate an ASCII text of at most 24 characters from a nonempty pattern with |.",
    default: "NOBODY_NOTICED_HIM | NOT",
    presets: [
      { label: "Lecture example", value: "NOBODY_NOTICED_HIM | NOT" }
    ],
    parse: parseStringMatchingInput
  },
  pseudocode: [
    { line: 1, text: "for i ← 0 to n − m do" },
    { line: 2, text: "j ← 0", indent: 1 },
    { line: 3, text: "while j < m and P[j] = T[i + j] do", indent: 1, basic: true, basicLabel: "character comparison" },
    { line: 4, text: "j ← j + 1", indent: 2 },
    { line: 5, text: "if j = m return i", indent: 1 },
    { line: 6, text: "return −1" }
  ],
  buildTrace: buildStringMatchingTrace,
  render: renderStringMatching,
  metrics(step) {
    return [{ label: "Character comparisons", value: step.comparisons, emphasis: true }];
  },
  model(step) {
    if (step.phase !== "complete") {
      return {
        latex: `C_{\\text{trace}}=${step.comparisons}`,
        notes: ["One count is added whenever a pattern character is compared with a text character."]
      };
    }
    return {
      latex: "C_{\\text{worst}}(n,m)=\\sum_{i=0}^{n-m}m=m(n-m+1)\\in \\mathrm{O}(mn)",
      notes: ["The worst case compares all m pattern characters at every possible alignment."]
    };
  },
  analysis: [
    { term: "Input size", value: "Text length n and pattern length m" },
    { term: "Basic operation", value: "A comparison P[j] = T[i + j]" },
    { term: "Best case", value: "The pattern matches at the first alignment, or alignments fail immediately" },
    { term: "Worst case", value: "All m characters are compared at each of n − m + 1 alignments" },
    { term: "Growth", value: "m(n − m + 1), reported in the lecture as O(mn)" }
  ]
};
