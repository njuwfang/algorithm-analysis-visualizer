# Add a Later Lecture

The site is content-driven. A later lecture normally requires a lecture manifest, one module file per algorithm, tests, and one registry edit. The shared page shell should not need to change.

## 1. Create the lecture folder

```text
src/lectures/04-sorting/
├── index.js
├── insertion-sort.js
├── merge-sort.js
└── quicksort.js
```

Use lowercase, hyphenated identifiers. Once published, treat identifiers as permanent URLs.

## 2. Implement each module

Copy `templates/module.js`. Keep trace generation pure and deterministic:

```js
const trace = module.buildTrace(module.input.parse(module.input.default));
```

Each state needs:

```js
{
  activeLine: 3,
  message: "Compare A[j] with the key.",
  // module-specific state used by render() and metrics()
}
```

The shell supplies input handling, prepared scenarios, pseudocode highlighting, playback, keyboard controls, counters, formulas, routing, and embedding.

Write the mathematical model as LaTeX. The vendored KaTeX distribution renders HTML and MathML locally, so formulas remain available offline and on GitHub Pages:

```js
model(step) {
  return {
    latex: "T(n) = 2T(n/2) + n \\in \\Theta(n \\log n)",
    notes: ["Connect the terms to the events in the trace."]
  };
}
```

## 3. Define the lecture manifest

Copy `templates/lecture.js` and import the modules in teaching order. The order in `modules` becomes the order in navigation and the previous/next pager.

## 4. Register the lecture

Add the lecture import and object to `src/lectures/registry.js`:

```js
import { lecture04 } from "./04-sorting/index.js";

export const lectures = [lecture03, lecture04];
```

No HTML navigation edits are necessary.

## 5. Add tests

At minimum, test one small trace and its final operation count. For algorithms with best/worst cases, test both. For interactive activities, test legal and illegal transitions in the reducer.

```bash
npm test
npm run validate
```

## 6. Review the teaching alignment

Before publishing, verify:

- the pseudocode matches the lecture;
- the highlighted line matches the visual event;
- the counter increments only for the selected basic operation;
- the formula describes that same count;
- the prepared inputs expose the relevant cases;
- the final state states the exact result and asymptotic class.

## Useful routes

```text
#/04-sorting/insertion-sort
?module=insertion-sort
?embed=1&module=insertion-sort
```

The hash route is the canonical link. Query parameters are convenient for embedded links.
