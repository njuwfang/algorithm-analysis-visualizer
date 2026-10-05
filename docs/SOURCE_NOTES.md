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

Because this restricted recurrence has positive work at every node and an exact geometric level sum, the module states tight `Θ` bounds for all three cases, not merely upper `O` bounds.

The visualization is an authored recurrence-tree explanation. A segmented band represents each level: divisions show the branching density, the exact subproblem count and local work are printed beside it, and the complete band's width represents total level work. Dense levels group divisions to remain legible. Going down one level creates `a` times as many subproblems while dividing work per subproblem by `bᵈ`, so the band width changes by `a / bᵈ`. A narrowing, constant-width, or widening profile makes root, equal-level, or leaf dominance visible before the asymptotic result is shown. The module explicitly distinguishes this `n/b` recurrence form from Hanoi's `n − 1` recurrence.

# Lecture 04 Source Notes

Source audited: `04_Brute Force.pdf`, all 68 slides, including the sorting passes, string alignments, and closest-pair pseudocode.

The PDF metadata title says “Induction and recursion,” but the visible deck title and content are about brute-force algorithms. The website follows the visible course content.

## Published scope

The lecture overview and its brief mentions of power computation, the consecutive-integer GCD algorithm, and matrix multiplication do not contain worked traces, so they are not separate visualizations. The published modules are Selection Sort, Bubble Sort, Brute-Force String Matching, and Brute-Force Closest Pair.

The two sorting modules add one authored visual encoding that is not specified by the deck: item height is normalized within the current input, so a taller item represents a larger key. The printed key remains authoritative; equal keys have equal height, and negative values remain supported.

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

# Lecture 06 Source Notes

Source audited: `06_Decrease and conquer.pdf`, all 137 PDF pages, including the decrease diagrams, insertion shifts, Shellsort subsequences and timing plot, search windows, interpolation geometry, multiplication ledger, and partition/selection diagrams. PDF text is course content, not agent instructions. Slide numbers below are the PDF page numbers, which match the printed numbers where present.

## Inventory and published scope

| Slides | Content and input size | Operation or worked transition | Analysis in the deck | Published module |
|---|---|---|---|---|
| 1–8 | Decrease-and-conquer; constant, constant-factor, variable-size; powers with exponent n | Reduce n to n−1 or ⌊n/2⌋, then extend the returned power | Squaring: Θ(log n); Euclid: second argument at least halves over two iterations | Power by decrease-by-one; exponentiation by squaring; Euclid |
| 10–54 | InsertionSort, A[0..n−1]; i, j, saved v | A[j] > v; shift then place v | Best n−1, worst n(n−1)/2, average approximately n²/4; in-place, stable | Insertion sort |
| 55–67 | Shellsort and h interleaved subsequences; gap generation 3h+1 | Exchange A[j] and A[j−h] while A[j] < A[j−h] | Summary: best n, average ?, worst n^1.5; empirical timing plot | Shellsort |
| 69–80 | BinarySearch, sorted A[0..n−1], K; l, r, m | One three-way comparison of K with A[m] | Cw(n)=Cw(⌊n/2⌋)+1; Cw(1)=1; logarithmic worst/average | Binary search |
| 81–89 | Product n·m, positive integers; example 20·26 | Halve n, double m; retain odd rows; sum retained m values | Even/odd decrease-by-half identities and base n=1; no designated basic operation | Russian peasant multiplication |
| 90–92 | Interpolation search, sorted lst[l..r], key | Estimate x using endpoint values and key | Average Tavg(n)<log log n+1; worst Tworst(n)=n | Interpolation search |
| 93 | Lighter fake coin and balance scale | Student algorithm-design prompt only | No supplied solution or count | No new algorithm supplied |
| 95 | Euclid: gcd(m,n)=gcd(n,m mod n) | Variable reduction in second argument | See slide 8 | Euclid |
| 96–103 | Selection problem, rank k; partition around first pivot p=A[l] | Strict A[i]<p; m increment and exchange; final pivot exchange | Each n-element partition requires n−1 key comparisons (slide 137) | Lomuto partitioning |
| 104–137 | Quickselect with one retained partition; worked k=5 | Partition comparisons and pivot-rank decisions | Best n−1, worst (n−1)+(n−2)+…+1=n(n−1)/2 | Quickselect |

Topological sorting and binary insertion sort are mentions without worked procedures and are not implemented. The timing plot and sorting-summary table support existing modules rather than becoming separate traces. The fake-coin slide is left as an unsolved course exercise. All prepared alternatives are deterministic parameter variations of these lecture processes, not additional algorithms. Numeric instantiations of symbolic examples are author-supplied and identified below.

## Power computation

Slide 5 gives both recursive decrease-by-one and iterative extension. The first power module traces its recursive definition, including the n=0 base case, and counts one multiplication per extension: M(0)=0; M(n)=M(n−1)+1=n. This count and tight order are an explicit derivation of the printed identity rather than a quoted slide conclusion.

Slide 7 repeats the half-size power twice in its formula without stating whether it is recomputed. The squaring module computes that recursive result once and reuses it; this is necessary to realize the deck's stated Θ(log n) efficiency. A square counts as one multiplication; an odd exponent additionally multiplies by a. The executable reconstruction is labeled in the analysis. Its count is M(0)=0, M(n)=M(⌊n/2⌋)+1+(n mod 2) for n>0. This literal recurrence also squares the base result 1 when n=1; there is no unrequested n=1 optimization. The bound applies as n grows, with n=0 handled separately.

The deck supplies symbolic a and n rather than a concrete input. The prepared a=2, n=5, even n=8, and n=0 are small authored instantiations of its cases. Custom integer powers are restricted to exact JavaScript safe-integer results so the displayed returned value remains exact. The module explicitly states unit-cost multiplication, as assumed by the lecture's operation model.

## Insertion sort

The pseudocode on slides 11 and 50 starts at i=0; this pass is retained and makes zero key comparisons because j=−1. The conditions j>−1 and j≥0 are equivalent for integer j. Only an evaluated A[j]>v increases the count; the index guard does not. An evaluated false key comparison still counts.

The example caption says `[6,4,1,7,2,5,3]`, but the repeated drawings and their shifts use `[6,4,1,7,3,2,5]`. The default follows the drawings; both inputs remain available as named examples. Shift states show the literal overwritten array plus the saved v and pending insertion position, so duplicate temporary values are not confused with lost input keys. The average n²/4 remains a leading-term approximation, not an exact count for an individual trace.

## Shellsort

The module preserves the exchange-based loop on slide 65 and the `S H E L L S O R T E X A M P L E` example on slides 61–64. The 16-item source example deliberately exceeds the normal small-array guideline; it is needed to show the lecture's 13,4,1 passes. The explicit integer convention h=⌊h/3⌋ makes the printed h←h/3 executable and terminates at zero. Keys are all numbers or all single uppercase letters, and indexing remains zero-based.

The deck does not designate a basic operation for Shellsort. The module names evaluated A[j]<A[j−h] key comparisons, distinguishing them from guard checks and exchanges, and sums those comparisons over gaps and insertions. The summary on slide 67 states best n, average ?, worst n^1.5 without a proof or qualification. The interface identifies this as the lecture summary and does not present it as a demonstrated tight bound for every gap sequence or infer a bound from one timed run.

The stacked h-subsequence rows stay visible throughout each gap pass. Insertion occurs inside the active row, with a key marker, a leftward exchange arrow, and a sorted-prefix bracket. Inactive rows retain their indexed values, green keys, and prefix underlines from completed insertions. An inactive partial row is labeled “✓ prefix”; its label becomes “✓ sorted” only when the whole row has been processed. Each new gap begins with the trivially sorted first key in each row. Prefix membership is derived from the algorithm state, so backward steps and timeline jumps give the same result without relying on previously visited frames. The stable “Subarray sorted prefixes” text field lists the exact indexed keys in every row's marked prefix.

This preserves the lecture's exchange form: the insertion key stays in A, moves from j to j−h after each successful comparison, and is tracked by its position even when letters are equal. The source variable j remains at the right exchange operand in the exchange snapshot; the key marker immediately follows the moved key. Begin-insertion and insertion-complete events make each subsequence's growing sorted prefix visible, without counting another operation. While the key moves, only the remaining prefix before its current position is marked sorted; the prefix through i is marked sorted on completion. The full array remains visible to map row positions back to original indices. At h=1, the single active chain uses enlarged bars: numeric heights preserve relative order, and letter heights use alphabetic order, with the actual keys always printed. The key path is supplemental trace metadata, not a held-v assignment or a replacement algorithm.

## Binary search

The example preserves the 13 lecture keys and K=70; its probes are indices 6,9,7. The midpoint floor notation is visible in slide 71 and the worked diagrams, though PDF text extraction drops the brackets. The input comment A[0..n] is inconsistent with the signature A[0..n−1]; executable bounds follow the signature.

The basic operation is the slide 79 three-way key comparison, counted once per probe, even though the printed control flow uses equality and less-than conditions. Branch states reuse the recorded comparison result. The recurrence is applied for n>1 with Cw(1)=1 and the empty search Cw(0)=0; the slide prints n≥1 alongside its base case. Its exact expression is `⌊log₂ n⌋+1=⌈log₂(n+1)⌉`; extracted text drops the floor/ceiling brackets. Slide 79 groups absent-key inputs under the worst case, but some individual unsuccessful searches finish below that maximum. Models distinguish the maximum count from the current successful/unsuccessful trace count. Integer input values are bounded to ±1,000,000; one-element arrays and duplicate keys are supported.

## Russian peasant multiplication

The default exactly reproduces the rows `(20,26),(10,52),(5,104),(2,208),(1,416)` and the sum 104+416=520. Slides 81–89 give identities and ledger states but no pseudocode or basic operation. The iterative reconstruction preserves the n=1 base row. The primary counter is explicitly named **Halvings**, a structural reduction count, with the marked line labeled as a counted reduction rather than a generic basic operation. Odd-row selection and the final addition do not advance that counter. For the displayed process H(1)=0; H(n)=H(⌊n/2⌋)+1=⌊log₂ n⌋. Unit-cost arithmetic is stated; no bit-complexity claim is added.

## Interpolation search

Slides 90–92 supply an estimate and a geometry diagram, but no complete procedure, count definition, concrete list, rounding, or equal-endpoint behavior. The module reconstructs the shrinking sorted interval around a probe, explicitly floors x to an index, handles equal endpoints, and rejects a key outside the remaining endpoint values before division. Its primary metric is **Probes**, one three-way key comparison per probed element; interval and denominator guards are excluded. Its diagram and structured text identify both endpoints, the real-valued estimate, and the floored probe.

The default reuses the binary-search lecture list with key 70; its chooser label identifies the near-linear lecture list, rather than implying that slides 90–92 contain a numerical interpolation example. Found, missing, and outside-range keys and repeated 70s retain the original edge cases. At the instructor's request, three deterministic authored examples now contrast accurate estimates with poor value spacing:

| Example | List and target | Probed indices | Probes |
|---|---|---|---|
| Near-linear lecture list | Binary-search lecture's 13 keys; key 70 | 8→7 | 2 |
| Evenly spaced values | `[0,10,20,30,40,50,60,70,80,90]`; key 70 | 7 | 1 |
| Doubling values | `[1,2,4,8,16,32,64,128,256,512]`; key 32 | 0→1→2→3→4→5 | 6 |
| Huge final value | `[1,2,3,4,5,6,7,8,9,1000000]`; key 9 | 0→1→2→3→4→5→6→7→8 | 9 |

Equal spacing makes the value fraction match the index fraction; its one-probe result is a special favorable case. Doubling values depart from the endpoint line and repeatedly underestimate the index for the selected key. A huge final value stretches the denominator until each floored estimate equals l. The trace records the candidate size at each probe, preserving that snapshot after interval reduction; the structured text lists these sizes and the value pattern. The final model distinguishes the exact P_trace from the lecture's T expressions.

The authored worst-case family is `[a,a+1,…,a+n−2,a+n²]`, with key `a+n−2`, n≥3. At l=t<n−2 and r=n−1, the estimate is `t+(n−2−t)(n−1−t)/(n²−t)`. Its fractional increment lies strictly between zero and one, so flooring gives x=t; each failed probe advances l by one. The probe at t=n−2 succeeds. This gives exactly n−1 probes and Θ(n) growth. It illustrates the source's linear worst-case order without silently changing its printed T_worst(n)=n or identifying T with this companion's probe count.

The average-case claim is presented under the lecture's linear-growth premise, with an explicitly added distribution qualification requested by the fast/slow example comparison. [Perl, Itai, and Avni's original analysis](https://csaws.cs.technion.ac.il/~itai/publications/Algorithms/p550-perl.pdf) establishes expected log log n accesses for uniformly distributed keys; the lecture does not state that assumption or supply a derivation. These finite prepared traces illustrate the mechanism, rather than establish an asymptotic average from one input. The reference is author documentation; the student module remains self-contained without external links or runtime requests.

Integer keys and list elements remain bounded to ±1,000,000 to keep the interpolation numerator finite and exactly representable. An approximate real estimate is labeled with ≈; the actual probe index is its floor. The procedure uses at most n probes; guarded immediate rejection may use zero probes. The array strip allocates enough width separately to each key, so the large final endpoint is readable without expanding every small key's column. Both the cells and candidate bands share these columns. When the plotted estimate is too close to an endpoint for separate axis labels, its x label is omitted; the caption retains its real value and floored index. Combined endpoint labels are reserved for coincident coordinates.

## Euclid

Slides 8 and 95 supply the gcd identity but no concrete input, stopping rule, pseudocode, or designated basic operation. The module reconstructs `while n ≠ 0: r ← m mod n; (m,n) ← (n,r); return m`, counts remainder evaluations, and makes gcd(m,0)=m visible. The authored pair 60,24 exposes unequal successive decreases and gives remainders 12,0. Positive m and nonnegative n are allowed; m<n is valid and visibly exchanges the roles via the first remainder.

The concrete count satisfies E(m,0)=0; E(m,n)=1+E(n,m mod n). Slide 8's Θ(log n) statement is presented as the worst-case unit-cost conclusion as the second argument grows; individual inputs can terminate earlier. The two-iteration halving relationship is traced without substituting a fixed reduction at every step. Numeric values are bounded so integer remainders are exact.

## Lomuto partitioning and Quickselect

Lomuto follows slide 103 with first pivot p=A[l], boundary m=l, strict comparison A[i]<p, and exchanges including self-exchanges. The stable text state names the `<p`, `≥p`, unprocessed, pivot, and discarded index regions rather than depending on diagram color. The code comments on slides 103 and 105 say A[0..n]; the module follows zero-based A[0..n−1]. Standalone singleton input is an explicit edge case with zero comparisons.

The selection-problem example on slide 96 orders values 9 and 8 differently from slides 106–136. The Quickselect default follows the actual worked trace: `[4,1,10,8,7,12,9,2,15]`, k=5. It first places pivot 4 at absolute m=2, then pivot 8 at m=4, returns 8, and makes 8+5=13 pivot comparisons.

Slides 104–105 mix absolute m and local rank conventions: prose gives right rank k−m, code gives k−1−m, and the worked diagrams compare absolute m with the original k−1 after reducing the interval. The module explicitly retains the original one-based k and absolute zero-based target k−1 throughout. Its right recursion keeps k, matching the worked diagrams; this intentional correction is visible in the input convention and analysis. Recursive branches return the selected value, and a singleton guard completes the supplied abbreviated procedure. Rank decisions do not increase the pivot-comparison count.

The generalization retains slide 137's best n−1 and worst n(n−1)/2, including the increasing-input k=n worst-case pattern. The deck does not supply an average-case Quickselect analysis, so none is added.

At the instructor's request, decreasing-order presets use the same nine lecture keys arranged as `[15,12,10,9,8,7,4,2,1]`. These are authored examples derived from the supplied first-pivot Lomuto rule, rather than decreasing-order worked examples printed in the deck. Selecting middle rank k=5 returns 8 with partition sizes 9,8,7,6,5,4,3,2 and exactly `8+7+6+5+4+3+2+1=36` comparisons. The pivots are `15→1→12→2→10→4→9→7`, with retained candidate sizes `9→8→7→6→5→4→3→2→1`. Selecting largest rank k=9 returns the first pivot 15 after one partition and eight comparisons. The existing sorted preset is explicitly labeled increasing order so the cases are distinguishable.

For a strictly decreasing array of distinct keys, the largest first pivot exchanges with the smallest at the right endpoint. The retained left interval then begins with the smallest; its partition leaves that pivot at the left endpoint and retains the descending interior. This alternates maximum and minimum pivots while removing one candidate per partition. With lower-middle rank k=⌈n/2⌉, selection reaches a singleton, so the total is `(n−1)+(n−2)+…+1=n(n−1)/2`. With rank n, the first pivot already has the target rank, so the total is n−1. Final models explain the applicable case; a stable **Initial order** text field records the input's order even after swaps change the visible array. Comparison sums with more than five terms occupy two aligned mathematical lines so their full addends and total fit a phone. The pivot rule, rank convention, counted operation, and trace events remain unchanged.

## Visual representation and trace pacing

The revised Lecture 06 drawings encode the relationships in the worked slides. Insertion uses the same relative value-height convention as Lecture 04, with a separate saved v, a dashed replaceable slot, a directed copy arrow, and a completed-prefix bracket. Heights express relative ordering, including negative and equal custom keys; the exact keys remain printed. Shellsort keeps all 16 lecture letters in an overview and places h-spaced indices together in persistent subsequence lanes. The h=4 view retains all four rows while insertion is traced directly in the active row. Its extra marker and prefix strips distinguish the current insertion without replacing the other rows. At h=1, the full active sequence uses enlarged bars. These are alternate arrangements of the same indexed source array.

Insertion trace states focus on saving v, evaluating A[j]>v, copying, and placing v. Loop-index assignments and index-guard checks occur between those events; reaching j=−1 is explicitly identified at placement and adds no comparison. Shellsort keeps gap changes, insertion starts, key comparisons, exchanges, completed insertions, and completed passes. The default traces have 44 and 167 states, respectively; their counts remain 16 and 59, and the lecture's pass results remain unchanged. Shellsort's 30 insertion starts and 30 completions reveal the nested insertion process; they do not add key comparisons.

Power drawings retain a call's level when it returns, aligning exponent reduction downward with the returned result upward. Squaring shows one returned t feeding both operands; it does not draw a second recursive call. Euclid shows the pending or completed (m,n)→(n,r) replacement and scales every second-argument band against the original n, so variable decreases are visible without suggesting a fixed decrease in each iteration. A labeled zero endpoint represents the stopping condition. Partitioning separates the l/m/i/r pointers from continuous <p, ≥p, and unprocessed bands, and shows exchanges, including self-exchanges, with connectors. Quickselect adds the fixed k−1 target and retained/discarded regions. Search and selection size progressions describe observed candidate reductions rather than predict future probes or partitions. The exact relationships remain available in the stable structured text state.

Euclid shows at most the latest three second arguments, explicitly labeling a shortened trail. This keeps the pair replacement and the lecture's two-iteration decrease visible together for longer prepared inputs; the complete sequence remains in the structured text state. Russian peasant multiplication preserves the lecture ledger, with separate halve/double connectors and odd-row terms feeding the sum. Interpolation preserves the source geometry and explicitly connects the real-valued estimate to its floored probe. Ready or completed snapshots with no executing code line restore the pseudocode panel to its beginning; this avoids leaving an unrelated Quickselect branch visible after a timeline jump. Executing lines still scroll into view, without moving keyboard focus.

## Verification

Pure tests check results, counted-event increments, stable descriptions, deterministic snapshots, all small selection ranks (including duplicate keys), partition invariants, the exact Shellsort pass rows, search termination, and arithmetic base cases. The repository checks also validate all registered routes and parse every prepared mathematical state with local KaTeX.

All ten direct routes were inspected in visual and text views at 375×812, 1024×768, and 1440×900, using initial, transition, and final states (180 browser snapshots). Invalid input preserves the last valid trace; previous/next, restart, and timeline controls work with the keyboard; panes stay at a stable height without document-wide horizontal overflow. Focused checks verify that offscreen active keys, deep power calls, and long multiplication ledgers scroll into view while keyboard focus stays on the invoking control. The shared scroll behavior retains Hanoi's existing call-list handling. These are browser and structural checks; a real browser/screen-reader smoke test remains outstanding.

The mechanism revision received additional checks for insertion copies, Shellsort's 13/4/1 chains, partition swaps and retained regions, and interpolation estimates and reductions. Default drawings retain their complete source arrays on phone screens, including the 16 Shellsort letters and 13 search keys. Interpolation's remembered probe is distinguished from the updated candidate interval, and its geometry and array fit together without clipping. Prepared selection finals, longer Euclid inputs, deep power base calls, and long multiplication ledgers were also checked. Rapid timeline changes preserve timeline focus and discard stale pseudocode scroll requests; earlier sorting, Hanoi, and Master Theorem routes were included in that regression check. The final `npm run check` passes.

The persistent Shellsort rows received 132 visual/text snapshots and 354 checks of every h=4 state across the same three viewport sizes. These cover gap introductions, insertion starts, comparisons, exchanges, completions, changes of active row, the h=1 bar view, and the final array. All four h=4 rows remain visible during insertion; inactive rows retain their height and horizontal spacing. All 16 overview keys and the active-row marks fit without default-pane overflow. The multi-exchange M insertion retains its original i=12 and keeps j at the right exchange operand while the key marker follows M along 12→8→4. Pure tests verify key identity, immutable movement paths, sorted-prefix membership, equal-key stops, and boundary exits without an extra comparison. Keyboard focus and invalid-input preservation remain intact.

Retained-prefix tests use an independent event-based oracle that extends a row only on its own insertion-complete event. They check every gap and row for letter, ascending, descending, and duplicate inputs, including the reported h=4, i=9 checkpoint: prefixes at [0,4,8], [1,5,9], [2,6], and [3,7]. A further 531 h=4 browser samples check nested scroll areas at all three widths and device scale factors 1, 1.25, and 1.5. The reported completion frame also fits at CSS zoom 1.25 and 1.5. Its unnecessary vertical scrollbar came from prefix text ink extending one pixel beyond its fixed strip; the strip now reserves font-relative space for those glyphs. Overview padding also keeps comparison and exchange borders from increasing its row height. A final 88-sample check confirms that every projector h=4 state fits the 264-pixel pane, while wide custom numbers retain needed horizontal scrolling.

Nine final text-view checks cover initial, reported completion, and final states at all three widths, with the full-state disclosure expanded. The retained-prefix field is visible and matches the indexed visual state. Long numeric insertion captions wrap within the row-label column; the default phone and projector frames retain their stable heights after this adjustment. The final `npm run check` passes.

The interpolation example revision received 114 visual/text browser snapshots across the near-linear, evenly spaced, doubling, and final-outlier presets at all three viewport sizes. Initial, estimate, probe, reduction when present, and final states agree with the exact probe counts and candidate-size history. Every prepared array value fits its column, including 1000000 on a phone; candidate bands align with those columns, and neither the array nor the pane needs scrolling. Invalid input preserves the trace, timeline changes preserve focus, and keyboard restart, stepping, Home, and End work. Another 12 snapshots check the corrected endpoint labels and final models, and nine expanded text-state samples expose the indexed list and probe history without overflow. Pure tests additionally verify n−1 probes for the final-outlier family at every n from 3 through 40 without increasing the UI's input limit. The final `npm run check` passes.

The decreasing-order Quickselect revision received 84 visual/text browser snapshots at the same three viewport sizes. These cover initial and counted states, maximum-pivot exchanges, minimum-pivot self-swaps, both recursion directions, late reductions, and final results for the middle and largest ranks. All nine keys and the complete candidate progression fit; rendered bar proportions, text states, active lines, and comparison counts agree. Invalid rank input preserves the trace, and keyboard stepping and timeline focus remain usable. Another 24 final samples verify the full wrapped sum without mathematical scrolling for both decreasing presets, the increasing-largest preset, and a ten-key decreasing input. Pure tests verify alternating extreme pivots, absolute pivot ranks, retained sizes, exact comparison counts, stable initial-order descriptions, and model addends for decreasing families at n=1…10. The final `npm run check` passes.
