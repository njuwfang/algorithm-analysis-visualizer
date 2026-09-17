# Analysis of Algorithms Visualizations

A reusable, self-contained static website for teaching algorithm execution and analysis. Lectures 03–05 preserve one repeated workflow:

> **Trace → Count → Generalize**

The redesign separates the course shell from lecture content, so later lectures can be added without copying the entire application.

Live site: <https://njuwfang.github.io/algorithm-analysis-visualizer/>

## Published lectures

Lecture 03 — Analysis of Algorithms:

- Number of binary digits — iterative
- Tower of Hanoi
- Number of binary digits — recursive
- Master Theorem

The first three follow `03_Analysis_of_Algorithms.pdf`. The Master Theorem is an instructor-requested extension placed in Lecture 03; it is not sourced from the supplied Lecture 03 deck. The teaching assumptions are recorded in `docs/SOURCE_NOTES.md`.

Lecture 04 — Brute-Force Algorithms:

- Selection Sort
- Bubble Sort
- Brute-Force String Matching
- Brute-Force Closest Pair

Lecture 05 — Exhaustive Search:

- Traveling Salesman Problem
- Knapsack — exhaustive subsets
- Assignment — exhaustive permutations

Each lesson keeps the custom input, one example chooser, visualization, lecture pseudocode, selected-operation count, and mathematical model in a compact shared shell. Supporting analysis is available on demand instead of occupying the default screen.

## Accessibility

Each algorithm’s trace mode has a **Show text** control beside the step counter. It opens a **Text trace** view that keeps the current event and up to four meaningful changed state values visible. Extra changes are available under **More changes**, while the exact state, operation counts, and relationships are available under **Full state and relationships**. The text does not rely on color or position.

For keyboard or screen-reader study:

1. Select **Show text**, or use a link with `?view=text` before the route hash.
2. Use **Previous** and **Next** for narrated study. A manual change announces the step position and event, active pseudocode, and primary count. **Repeat step** repeats this short announcement.
3. Browse **Changes this step** for the exact changed values. If more than four values changed, open **More changes**; open **Full state and relationships** only when the complete snapshot is needed.
4. Treat **Play** as a visual overview: it announces start, pause, and completion, while intermediate frames stay silent to avoid a speech backlog.

To open a shared link directly in the text view, add `?view=text` before the route hash:

```text
https://njuwfang.github.io/algorithm-analysis-visualizer/?view=text#/03-analysis/hanoi
```

KaTeX renders mathematical expressions with HTML and MathML. Color is supplemented by labels, outlines, or shapes, and reduced-motion preferences disable nonessential motion.

The previous, next, play/pause, timeline, restart, input, activity, and lecture-navigation controls are keyboard operable. The Tower of Hanoi practice mode exposes labeled peg controls and a nonvisual current-state description even though the trace/text toggle is not shown in practice mode.

Automated checks validate description schemas, stable state and metric labels, trace-delta behavior, and expected accessibility hooks. These checks do not exercise a browser or screen reader. Manual screen-reader validation is still outstanding; before classroom use, test with the student’s browser and screen reader.

## Run in WSL

```bash
./serve.sh
```

Open:

```text
http://localhost:8080
```

A server is required because the browser loads native ES modules. No installation or build step is required for local teaching.

## Quality checks

Node 20 or newer is needed only for repository checks:

```bash
npm run validate
npm test
npm run build
npm run check
```

`npm run build` creates a clean deployable site in `dist/`.

## GitHub Pages

1. Push the project to a GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, then select the repository root.

Alternatively, run `npm run build` and publish the generated `dist/` directory with any static host.

The canonical route format is:

```text
https://njuwfang.github.io/algorithm-analysis-visualizer/#/03-analysis/binary-iterative
```

Because routing uses the URL hash and the vendored KaTeX distribution renders formulas locally, the site works from a project subdirectory without server rewrites or external runtime services.

## Direct links and embedding

```text
#/03-analysis/binary-iterative
#/03-analysis/hanoi
#/03-analysis/binary-recursive
#/03-analysis/master-theorem
#/04-brute-force/selection-sort
#/04-brute-force/bubble-sort
#/04-brute-force/string-matching
#/04-brute-force/closest-pair
#/05-exhaustive-search/traveling-salesman
#/05-exhaustive-search/exhaustive-knapsack
#/05-exhaustive-search/assignment
```

Iframe-friendly link:

```text
?embed=1&module=hanoi
```

Example:

```html
<iframe
  src="https://njuwfang.github.io/algorithm-analysis-visualizer/?embed=1&amp;module=hanoi"
  title="Tower of Hanoi analysis visualization"
  width="100%"
  height="900"
  loading="lazy"
  style="border:0"
></iframe>
```

## Architecture

```text
visualization/
├── index.html
├── AGENTS.md
├── assets/styles/
├── src/core/                 # shell, schema, routing, and trace-delta logic
├── src/lectures/
│   ├── registry.js
│   ├── 03-analysis/          # modules and lecture-local styles.css
│   ├── 04-brute-force/       # modules and lecture-local styles.css
│   └── 05-exhaustive-search/ # modules and lecture-local styles.css
├── docs/
├── templates/
├── tests/
└── scripts/
```

`dist/` is generated and ignored; edit the source files above and rebuild it. `course-materials/` is also ignored so local notes, practice, and assignment drafts can stay inside the project without entering commits.

The shared shell renders any module that satisfies the module contract. See:

- `AGENTS.md` for the concise repository rules
- `docs/ADD_A_LECTURE.md` for the authoring workflow
- `docs/STYLE_GUIDE.md` for website and visualization conventions
- `docs/SOURCE_NOTES.md` for documented source mappings and interpretation choices

## Add a lecture

1. Copy the files in `templates/`.
2. Create a folder under `src/lectures/`.
3. Implement deterministic traces, visual renderers, and a complete `describe(step)` text state with stable labels.
4. Register the lecture in `src/lectures/registry.js`.
5. Add trace, description/delta, and route tests, then run `npm run check`.

Review both visual and text views at phone, projector, and wide-desktop widths. When focus, dialog, or announcement behavior changes, also perform a real browser/screen-reader smoke test or record that it remains unverified.

Navigation, direct links, the header pager, and embedding are generated by the shared shell.

## Browser support

The site targets current evergreen browsers with native ES modules, CSS Grid, and modern JavaScript. KaTeX and its math fonts are stored in the repository; there are no external runtime requests, analytics scripts, or CDNs.
