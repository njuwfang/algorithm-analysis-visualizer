# Analysis of Algorithms Visualizations

A reusable, self-contained static website for teaching algorithm execution and analysis. Lectures 03–09 and their summary/extension companion preserve one repeated workflow:

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

Lecture 06 — Decrease and Conquer:

- Power — decrease by one
- Exponentiation by squaring
- Insertion Sort
- Shellsort
- Binary Search
- Russian Peasant Multiplication
- Interpolation Search
- Euclid's Algorithm
- Lomuto Partitioning
- Quickselect

These follow all 137 pages of `06_Decrease and conquer.pdf`. Reconstructed procedures and the deck's input/indexing ambiguities are recorded in [SOURCE_NOTES.md](docs/SOURCE_NOTES.md). Open `#/06-decrease-conquer/power-decrease-one` to start the lecture; every module also supports `?view=text` before the hash.

Lecture 07 — Divide and Conquer:

- Merge — two sorted arrays
- Mergesort — divide, recursively sort, and merge
- Three-product integer multiplication
- FFT integer multiplication — instructor-requested extension
- Strassen's Matrix Multiplication

The four lecture modules follow `07_Divide and conquer.pdf`, whose complete 73 pages were reviewed. The recurrence material is already covered by the existing Lecture 03 Master Theorem extension and is omitted from Lecture 07 at the instructor's request. The integer module traces one decomposition level and distinguishes those products from the deck's idealized recursive digit-multiplication model. Strassen traces recursive blocks down to scalar products. Source inconsistencies and explicit conventions are recorded in [SOURCE_NOTES.md](docs/SOURCE_NOTES.md). Start at `#/07-divide-conquer/merge`.

The separate FFT extension at `#/07-divide-conquer/fft-multiplication` explains why representation changes help multiplication: digit polynomials → values at shared points → matching-value products → recovered coefficients → integer product. The default `23×14` example has nine steps and a five-line outline. FFT and inverse FFT appear as conversion steps; recursive internals are omitted. The counter includes only pointwise products. Its optional cost discussion uses a unit-cost arithmetic model. FFT is additional material requested by the instructor, not part of the supplied deck.

The integer view uses a four-region product rectangle and an aligned decimal addition ledger. At the instructor's request, Strassen adds a three-way tensor view: four output slices show how seven rank-one terms combine into the coefficients of matrix multiplication. Its full algorithm reference stays open beside the visualization on desktop and flows below the controls on phones.

Lecture 08 — Transform and Conquer:

- Presorting for Element Uniqueness
- Horner's Rule
- Binary Search Tree Insertion
- AVL Insertion and Rotations

These follow all 67 pages of `08_Transform and conquer.pdf`. Presorting shows why only neighbors need checking; Horner retains the lecture's running values through `p(3)=160`. The tree modules compare insertion order and trace all four AVL rotation types, including the transferred middle subtrees. Source diagram inconsistencies and reconstructed tree procedures are documented in [SOURCE_NOTES.md](docs/SOURCE_NOTES.md). Start at `#/08-transform-conquer/presort-uniqueness`.

Lecture 09 — Non-Comparison Based Sorting:

- Counting Sort — frequencies, block starts, and stable placement
- LSD Radix Sort — stable FIFO bins from least to most significant digit
- MSD Radix Sort — recursive leading-prefix groups; instructor-requested extension
- American Flag Sort — counts, bucket boundaries, and in-place cycles; instructor-requested extension

Counting Sort and LSD Radix Sort follow all 39 pages of `09_Non-comparision based sorting.pdf`. Both include the lecture's worked input and exercise, retain the standard shared layout, and provide equivalent text states. Counting sort traces the exact 1-based Count/Pos procedure and counts array writes. LSD radix sort counts distribution/gathering key moves; each pass checkpoint retains the incoming order and shows how FIFO preserves earlier digits while bin order extends the sorted suffix. Every completed pass order remains available in the text state. The source's omitted key and cost-model qualifications are documented in [SOURCE_NOTES.md](docs/SOURCE_NOTES.md). Start at `#/09-non-comparison-sorting/counting-sort`.

MSD Radix Sort follows LSD, reusing the digit inputs to show recursive prefix ranges, retained child results, and singleton stopping. American Flag Sort comes last, combining counting-based bucket boundaries with recursive radix partitioning and cycles of swaps within A, with no n-item output array. American Flag counts swaps; MSD counts digit inspections; LSD counts key moves. These extensions are not in the deck; their NIST sources and explicit reconstruction choices are recorded in [SOURCE_NOTES.md](docs/SOURCE_NOTES.md). All four modules retain the standard lesson layout. The existing `radix-sort` route remains stable, and former Pigeonhole links open American Flag Sort.

Lectures 06–09 Review — Summary and Extensions:

- Strategy connections across the four lectures
- Inversions and adaptive insertion sort
- Counting inversions with merge
- Comparison-sorting lower bound through a three-key decision tree
- Hybrid mergesort with insertion-sort leaves
- Guided algorithm selection and justification

This instructor-requested synthesis uses the same layout, controls, deterministic examples, and equivalent text traces as earlier lectures. It is labeled **06–09 Review**, leaving Lecture 10 available for the next course section; the existing `10-summary-extensions` URLs remain stable. The new material connects insertion shifts to disorder, counts inversion batches during merge, distinguishes one decision path from worst-case tree height, and compares hybrid and standard mergesort using the same key-comparison definition. Selection cases ask for a written justification before revealing a worked candidate; they are learning practice with no required AI tool or answer submission. Quicksort is assumed already introduced. There is no new supplied deck: sources and authored conventions are recorded in [SOURCE_NOTES.md](docs/SOURCE_NOTES.md). Start at `#/10-summary-extensions/strategy-connections`.

Each lesson keeps the custom input, one example chooser, visualization, lecture pseudocode or reasoning steps, selected-operation count, and mathematical model in a compact shared shell. Supporting analysis is available on demand instead of occupying the default screen.

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
#/06-decrease-conquer/power-decrease-one
#/06-decrease-conquer/exponentiation-squaring
#/06-decrease-conquer/insertion-sort
#/06-decrease-conquer/shellsort
#/06-decrease-conquer/binary-search
#/06-decrease-conquer/russian-peasant
#/06-decrease-conquer/interpolation-search
#/06-decrease-conquer/euclid-gcd
#/06-decrease-conquer/lomuto-partition
#/06-decrease-conquer/quickselect
#/07-divide-conquer/merge
#/07-divide-conquer/mergesort
#/07-divide-conquer/integer-multiplication
#/07-divide-conquer/strassen
#/08-transform-conquer/presort-uniqueness
#/08-transform-conquer/horner
#/08-transform-conquer/bst-insertion
#/08-transform-conquer/avl-insertion
#/09-non-comparison-sorting/counting-sort
#/09-non-comparison-sorting/radix-sort
#/09-non-comparison-sorting/msd-radix-sort
#/09-non-comparison-sorting/american-flag-sort
#/10-summary-extensions/strategy-connections
#/10-summary-extensions/insertion-inversions
#/10-summary-extensions/merge-inversions
#/10-summary-extensions/sorting-lower-bound
#/10-summary-extensions/hybrid-mergesort
#/10-summary-extensions/choosing-algorithms
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
│   ├── 05-exhaustive-search/ # modules and lecture-local styles.css
│   ├── 06-decrease-conquer/ # modules and lecture-specific drawings
│   ├── 07-divide-conquer/   # recursive splits, merging, and product identities
│   ├── 08-transform-conquer/ # presorting, Horner, BSTs, and AVL rotations
│   ├── 09-non-comparison-sorting/ # counting, LSD/MSD radix, and American flag sorts
│   └── 10-summary-extensions/ # strategy synthesis, inversions, limits, and hybrids
├── docs/
├── templates/
├── tests/
└── scripts/
```

`dist/` is generated and ignored; edit the source files above and rebuild it. `course-materials/` is an ignored, undeployed workspace for teaching materials. See [AGENTS.md](./AGENTS.md#local-course-materials) for its authoring rules; older course repositories are references only.

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
