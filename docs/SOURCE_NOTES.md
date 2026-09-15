# Lecture 03 Source Notes

These notes record deliberate implementation choices where the lecture deck is abbreviated or internally inconsistent.

Source audited: `03_Analysis_of_Algorithms.pdf`, all 29 slides, including the Tower of Hanoi diagrams on slides 12–23.

## Published scope

The maximum-element and element-uniqueness examples are intentionally omitted from the published visualization. Their traces are too simple to justify separate interactive modules; the site begins with iterative binary digits. Their source files remain as unpublished reference implementations.

## Maximum element (not published)

The loop runs from index 1 through index n − 1, so the visualizer counts exactly n − 1 comparisons. This follows the summation and Θ(n) result in the deck, even though one sentence on the analysis slide describes n as the number of comparisons.

## Iterative binary digits

For concrete non-power-of-two inputs, the visualizer uses integer division `⌊n/2⌋`. The mathematical panel still emphasizes the deck's repeated-halving pattern and logarithmic growth.

The deck describes the total as approximately `log₂ n`; the site’s `Θ(log n)` module label is an authored asymptotic classification rather than text printed on slides 8–9.

## Tower of Hanoi

The slides describe the recursive solution in prose but do not print pseudocode. The module’s five-line pseudocode is a direct reconstruction of slide 24 and is labeled as algorithm state, not quoted slide text. Call-entry and return states are included around the disk moves so students can see the recursive descent and unwinding; only disk moves advance the operation count.

The site calls `2ⁿ − 1` the exact move count **for this recursive algorithm** and retains the deck's asymptotic statement `O(2ⁿ)`. The deck does not prove that this count is globally minimal, so the interface does not make an optimality claim. The optional practice puzzle is a teaching extension of the slide sequence.

## Recursive binary digits

The operation counter records additions, not calls, because the recurrence in the deck defines `A(n)` as the total number of additions. The trace may draw call frames to explain control flow, but calls are not presented as a counted metric.

As with the iterative version, concrete non-power-of-two inputs use `⌊n/2⌋`. Slides 28–29 derive the result only after choosing `n = 2ᵏ` by the **smoothness rule**; the model keeps that restriction explicit. The module’s `Θ(log n)` label extends the slide’s exact power-of-two derivation into the usual asymptotic classification.

## Master Theorem (instructor-requested extension)

The supplied Lecture 03 deck does not contain the Master Theorem. The module is published under Lecture 03 at the instructor's request; no additional deck is used as its content source.

The module uses the explicit teaching form `T(n) = aT(n/b) + nᵈ`, assumes `n = bᵏ`, and assigns unit work to each base case. Its four prepared recurrences use the authored classroom value `n = 16`; they are examples for comparing the three possible level-work patterns, not claims about examples in the supplied deck. For readable custom trees, the interface limits `a` to 1–8, `b` to 2–8, `d` to 0–4, and powers of `b` to at most six levels.

The visualization is an authored recurrence-tree explanation. A segmented band represents each level: divisions show the branching density, the exact subproblem count and local work are printed beside it, and the complete band's width represents total level work. Dense levels group divisions to remain legible. Going down one level creates `a` times as many subproblems while dividing work per subproblem by `bᵈ`, so the band width changes by `a / bᵈ`. A narrowing, constant-width, or widening profile makes root, equal-level, or leaf dominance visible before the asymptotic result is shown. The module explicitly distinguishes this `n/b` recurrence form from Hanoi's `n − 1` recurrence.
