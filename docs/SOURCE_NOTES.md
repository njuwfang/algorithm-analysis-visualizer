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

# Lecture 04 Source Notes

Source audited: `04_Brute Force.pdf`, all 68 slides, including the sorting passes, string alignments, and closest-pair pseudocode.

The PDF metadata title says “Induction and recursion,” but the visible deck title and content are about brute-force algorithms. The website follows the visible course content.

## Published scope

The lecture overview and its brief mentions of power computation, the consecutive-integer GCD algorithm, and matrix multiplication do not contain worked traces, so they are not separate visualizations. The published modules are Selection Sort, Bubble Sort, Brute-Force String Matching, and Brute-Force Closest Pair.

## Selection Sort

The trace preserves the lecture array `[89, 45, 68, 90, 29, 34, 17]`, zero-based indexing, the strict comparison `A[j] < A[min]`, and the swap statement after every pass. A self-swap still counts as an executed swap statement. The counted basic operation is the key comparison, giving exactly

`C(n) = Σᵢ₌₀ⁿ⁻² Σⱼ₌ᵢ₊₁ⁿ⁻¹ 1 = n(n − 1)/2 ∈ Θ(n²)`.

## Bubble Sort

The trace implements the lecture's complete nested loops without an early-exit optimization. It therefore performs `n(n − 1)/2` adjacent-key comparisons for every input; only the swap count depends on the arrangement.

One code comment on slide 39 says `A[0..n]`, while the procedure signature and loop bounds use `A[0..n−1]`. The module follows the signature and executable bounds. The deck writes the basic comparison as `A[j+1] < A[j]`; the equivalent executable test `A[j] > A[j+1]` is retained from its printed pseudocode.

## Brute-Force String Matching

The default trace is the lecture example `NOBODY_NOTICED_HIM` with pattern `NOT`, which returns zero-based position 7 after 12 character comparisons. The slides assume a nonempty pattern with `m ≤ n` without stating those preconditions; the input parser makes both requirements explicit.

The input also uses ASCII characters so one displayed cell corresponds to one character and one counted comparison. This matches the deck's character-by-character notation and avoids silently treating a multi-code-unit symbol as two positions.

The counter advances only for `P[j] = T[i+j]`, not for loop-bound tests. The worst case therefore matches the deck's `m(n − m + 1)` count and `O(mn)` conclusion.

## Brute-Force Closest Pair

The slides first compute Euclidean distance with a square root, then remove the square root while continuing to call the returned quantity “distance.” The module explicitly labels the returned quantity as squared distance because minimizing it selects the same pair.

The final analysis slide names square-root computation as the basic operation but places `2` inside the sum for every pair. One square root per pair would instead total `n(n − 1)/2`. To preserve the printed count `n(n − 1)`, the module makes its interpretation visible: the two counted terms are the x-coordinate and y-coordinate contributions in each squared-distance calculation.

The deck supplies no concrete coordinate set. The single prepared set is an authored deterministic input used only to expose the all-pairs process; students may replace it with custom points.

# Lecture 05 Source Notes

Source audited: `05_Exhaustive search.pdf`, all 26 slides, including the weighted graph, subset table, and assignment matrix.

The PDF metadata title again says “Induction and recursion,” but the visible deck is about exhaustive search. Slides 1–5 repeat Lecture 04's closest-pair material, so the site links that content only once under Lecture 04 rather than publishing a duplicate module.

Slides 8–9 define exhaustive search as generating every candidate, evaluating or disqualifying it while retaining the best, and then announcing the result. The deck does not print formal pseudocode for its three problems. Each module labels its right-hand panel “Exhaustive-search process” and reconstructs only that stated generate–evaluate–retain process.

## Traveling Salesman Problem

The four-city graph uses the lecture weights `ab=2`, `ac=5`, `ad=7`, `bc=8`, `bd=3`, and `cd=1`. Although one slide says only “weighted connected graph,” the problem statement says every pairwise distance is known and the pictured graph is complete; the module uses that complete undirected graph.

Slide 15 shows four of the six tours that start at `a`, includes both directions of one cycle, and omits two tours. Slide 16 then correctly observes that reverse directions are equivalent and gives `(n − 1)!/2`. The trace follows that stated symmetry rule and evaluates the three canonical undirected tours. Its shortest tour has cost 11; the reverse traversal is equally valid.

The interactive input changes only the six edge weights of the same four-city graph. The mathematical model generalizes the candidate count to `n` cities.

## Knapsack

The trace preserves capacity 16 and the four lecture items with weights `[2, 5, 10, 5]` and values `[20, 30, 50, 10]`. Its best subset is `{2, 3}`, with weight 15 and value 80.

The lecture states that exhaustive search considers `2ⁿ` subsets, but its table lists only the 15 nonempty subsets. The trace includes `∅`, then follows the table's cardinality-first ordering, so all 16 candidates are visible. The model labels `2ⁿ` as the candidate count and retains the deck's `Ω(2ⁿ)` efficiency statement; the slides do not specify the cost of recomputing a subset's totals.

## Assignment Problem

The module uses the lecture's 4 × 4 cost matrix and evaluates all 24 job permutations. Slide 26 prints only five representative rows; the trace generates the complete permutation set.

The complete trace finds the true minimum assignment `⟨3, 2, 1, 4⟩`, with cost `2 + 4 + 5 + 4 = 15`. The mathematical panel labels `n!` as the candidate count and preserves the lecture's `O(n!)` conclusion rather than introducing a different analysis model.
