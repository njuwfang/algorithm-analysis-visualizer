# Add a Later Lecture

The site is content-driven. A later lecture normally requires a lecture manifest, one module file per algorithm, tests, and one registry edit. The shared page shell should not need to change.

## 1. Create the lecture folder

```text
src/lectures/04-sorting/
├── index.js
├── insertion-sort.js
├── merge-sort.js
├── quicksort.js
└── styles.css
```

Use lowercase, hyphenated identifiers. Once published, treat identifiers as permanent URLs.
Keep selectors used only by this lecture in its local `styles.css`; reserve `assets/styles/` for shared shell, component, and visualization primitives. Add the lecture stylesheet to `index.html` after the shared stylesheets so the static GitHub Pages build can load it.

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

Each module must also describe that state without relying on the drawing:

```js
describe(step) {
  return {
    summary: step.message,
    state: [
      { label: "Array", value: `[${step.values.join(", ")}]` },
      { label: "Compared indices", value: `${step.left} and ${step.right}` }
    ]
  };
}
```

The description powers the shared text-trace view. Include every relationship needed to understand the algorithm state; do not refer only to colors, left/right placement, or animation. Keep the ordered state-label set unique and identical across steps; use values such as `"none"` or `"not evaluated"` when a concept is inactive. Metric labels follow the same rule. If a state row repeats a metric label, the value and meaning must match because the shell displays it in the Count region rather than twice.

The shell matches labels to produce tracked before-and-after changes. Optional `details` sentences are tracked by position, so preserve the meaning of each position; put an important changing relationship in `state` with its own label.

If a module has an optional hands-on activity, its `activity.describe(state)` uses the same description shape. The activity's actionable elements must also have keyboard behavior and names that include their current state.

The shell supplies input handling, prepared scenarios, pseudocode highlighting, playback, keyboard controls, counters, formulas, routing, and embedding.

For a worked process that is not an algorithm, such as a theorem decision rule, set the optional `codeTitle` field so the shared panel receives an accurate heading:

```js
codeTitle: "Theorem cases"
```

When a line is mathematical rather than pseudocode, provide `latex` instead of `text` and a concise `spoken` equivalent for live step announcements:

```js
{
  line: 4,
  latex: "d < \\log_b a \\Longrightarrow \\Theta(n^{\\log_b a})",
  spoken: "d is less than log base b of a, so the order is theta of n to log base b of a"
}
```

If the counted quantity is not literally a basic operation, pair `basic: true` with a concise `basicLabel`, such as `"level work"`.

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

At minimum, test one small trace, its stable description/metric labels, and its final operation count. For algorithms with best/worst cases, test both. For interactive activities, test legal and illegal transitions in the reducer and its nonvisual description.

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
- the final state states the exact result and asymptotic class;
- the text view completely represents an initial, transition, and final visual state;
- the current event and no more than four meaningful changes remain visible, excess changes appear under **More changes**, and **Full state and relationships** contains the exact snapshot;
- manual stepping and **Repeat step** announce only the position and event, active pseudocode, and primary count, while exact changes remain browseable.

Check visual and text views at 375 px, 1024 × 768, and a wide desktop size. If focus, dialog, or live-announcement behavior changed, smoke-test it with a real browser and screen reader when available; source tests alone cannot establish accessibility conformance.

## Useful routes

```text
#/04-sorting/insertion-sort
?module=insertion-sort
?embed=1&module=insertion-sort
```

The hash route is the canonical link. Query parameters are convenient for embedded links.
