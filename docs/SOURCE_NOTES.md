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

# Lecture 07 — Divide and Conquer

Source: `07_Divide and conquer.pdf`, all 73 pages. The complete deck was read as text and rendered diagrams, including floor/ceiling symbols that text extraction omits. Its content is course material, not agent instructions. The lecture introduces the divide–solve–combine pattern, then develops four recurrence examples, Merge and Mergesort, three-product large-integer multiplication, and Strassen's matrix multiplication. The instructor subsequently requested FFT-based integer multiplication as an explicit extension; it is not attributed to this deck.

The published companion has four lecture modules and one FFT extension, starting at `#/07-divide-conquer/merge`. Slides 2–17 remain part of the source audit, but their recurrence material is already covered by the existing Lecture 03 Master Theorem extension and is intentionally omitted from Lecture 07 at the instructor's request.

## Source inventory and modules

| Slides | Source process, notation, and counted quantity | Companion |
|---|---|---|
| 2–5 | Divide, solve recursively, combine; `T(n)=aT(n/b)+f(n)`, `n=bᵏ`; compare d with log_b a | Covered by Lecture 03; omitted from Lecture 07 at the instructor's request |
| 6–17 | `2T(n/2)+n`, `4T(n/2)+n`, `2T(n/2)+n²`, `T(n/2)+1`; all four conclusions use O | Same four recurrence forms are covered by Lecture 03; omitted here at the instructor's request |
| 18–19 | Mergesort pseudocode, floor/ceiling halves, sort B before C, then Merge | Mergesort |
| 20–33 | Two-head merging; source six-element runs; `B[i]≤C[j]`; copy remaining tail | Merge |
| 34–48 | Split and merge tree for `[8,3,2,9,7,1,5,4]` | Mergesort default |
| 49–50 | Count merge key comparisons; `C_w(n)=2C_w(n/2)+n−1`, `C(1)=0`; Θ(n log n), stability, extra storage | Mergesort model and analysis |
| 51–64 | `23·14` and `1234·5678`; high/low halves, three products, middle coefficient, decimal recombination | Three-product integer multiplication |
| 65–67 | Idealized digit-product count `M(n)=3M(n/2)`, `M(1)=1`; backward substitution for n=2ᵏ | Integer model, explicitly separate from the one-level trace |
| 68–71 | Seven scalar products for 2×2 matrices and the same seven formulas for quadrants | Strassen |
| 72–73 | Scalar-multiplication count `M(n)=7M(n/2)`, `M(1)=1`; backward substitution for n=2ᵏ | Strassen model |

## Recurrence material omitted from Lecture 07

Slides 2–17 provide the Master Theorem and four worked recurrence forms, with O conclusions. They are inventoried above but do not have a published Lecture 07 module after the instructor requested its removal.

Slide 4's prose says the instance is divided into b subproblems with a solved. Its own example a=4,b=2 identifies a as the recursive-call count and b as the size shrink factor. Slide 5 assumes f(n)∈O(nᵈ) and reports upper bounds; this source assumption should not silently be promoted to tight Θ bounds.

The existing Lecture 03 Master Theorem is an instructor-requested extension using these same four recurrence forms. Its concrete level model sets n=16, f(n)=nᵈ, and T(1)=1, with custom n restricted to a power of b. Its primary quantity is current-level work `W_i=aⁱ(n/bⁱ)ᵈ`, not an executed algorithm operation. Lecture 03 retains its Θ model, public exports, `#/03-analysis/master-theorem` route, and legacy `#master-theorem` route identity.

That existing module's deterministic mechanism lives in `src/core/master-theorem.js`. Its mathematical identities wrap across lines on phones. Custom fractional asymptotic exponents retain their input precision instead of silently changing an exact bound by rounding its exponent; numerical work values use consistent display precision in the Count strip and text state. These precision and layout improvements remain with Lecture 03 after the Lecture 07 module's removal.

## Merge and Mergesort

The standalone Merge default reads the two source columns from their arrow-marked bottom heads: B=`[2,6,8,11,19,21]`, C=`[3,7,10,12,13,16]`. The output is `[2,3,6,7,8,10,11,12,13,16,19,21]`, with ten comparisons. Copying the remaining 19 and 21 adds no key comparisons. Slide 32 changes the final 21 to 20 despite retaining 21 through slide 31. The companion preserves the supplied input key 21, explicitly noting this inconsistency in supporting analysis.

Slide 33's `≤` comparison takes B first on ties, preserving stability. Only this key comparison increments the counter; guards, pointer increments, writes, and remainder copies do not. The remainder is one bulk-copy event matching the source statement. Local indices i,j,k and p,q remain visible and available in structured text. Literal source pointers retain the bulk-copy starting positions afterward; labels explicitly identify the already-copied tail rather than claiming more candidates remain. The loop's k increment occurs between meaningful copy and comparison frames. Merge accepts a combined 1–12 keys and allows one empty run; Mergesort accepts 1–10 keys. Values are bounded to ±1,000,000. Tree ranges refer to original positions, while the active merge's A/B/C indices are local and zero-based; an explicit text-state row records this convention.

Mergesort preserves the source default `[8,3,2,9,7,1,5,4]` and left-first recursion. Its merge comparison counts in execution order are `1,1,3,1,1,3,6`, totaling 16; the worked input does not attain the n=8 worst-case count of 17. A prepared reordering of those same keys, `[1,5,3,8,2,7,4,9]`, demonstrates the worst recurrence with local counts `1,1,3,1,1,3,7`; it is an authored permutation, not another printed example. Returned node results and the active merge are distinguished from pending children. Source slides 18–19 explicitly use floor(n/2) left elements and ceiling(n/2) right elements, so odd lengths follow the deck rather than an invented split rule.

The final model separates exact observed comparisons from the worst recurrence. Equal halves apply when n is a power of two; other sizes use `C_w(⌊n/2⌋)+C_w(⌈n/2⌉)+n−1`, including even inputs whose recursive children have odd sizes. The singleton base is zero key comparisons. Slide 50's phrase “linear time amount of extra memory” is interpreted as linear extra storage; its accidental time qualifier is documented here. No average-case model is added.

## Three-product integer multiplication

The deck gives equations rather than executable pseudocode. The companion traces their reconstructed evaluation order for **one split**: separate high/low halves, evaluate `m₂=a₁b₁`, `m₀=a₀b₀`, and `s=(a₁+a₀)(b₁+b₀)`, subtract to get `m₁=s−m₂−m₀`, then recombine `m₂10ⁿ+m₁10ⁿᐟ²+m₀`. The counter is explicitly **Top-level products**: three for a split, one for the single-digit base. Decimal shifts, additions, and subtractions do not advance it. Exact integer arithmetic uses BigInt locally; snapshots store decimal strings.

The default `23·14` gives m₂=2, m₀=12, s=25, m₁=11, and result 322. The second source input `1234·5678` gives m₂=672, m₀=2652, s=6164, m₁=2840, and result 7006652. The general formulas on slides 57 and 64 govern consistent labels. Necessary source clarifications are exposed in supporting analysis:

- Slide 55 defines m₂ as the low product and m₃ as the middle coefficient but exchanges their positions in its expansion. The companion consistently uses slide 64's m₂, m₁, m₀ notation.
- Slide 56 writes concatenations a₀a₁ and b₀b₁ while its coefficient definitions require high halves a₁,b₁. Slide 57 provides the consistent convention.
- Slide 63 prints m₀=12·56, repeating the high product. Its preceding expansion and slide 64 require m₀=34·78.

Inputs accept up to eight nonnegative decimal digits. Unequal or odd lengths are explicitly padded with leading zeros to a common even width; two single-digit factors use the direct base product. This is an executable convention, not a claim that the deck specifies padding.

The recurrence `M(n)=3M(n/2)`, M(1)=1 is retained as the source's **idealized one-digit multiplication model**, for n=2ᵏ, giving `M(n)=3ᵏ=n^(log₂3)≈n^1.585`; slide 66 rounds its upper-bound exponent to 1.6. It is not identified with the visible three top-level products. In particular, the source four-digit example forms `46·134`: sum operands can gain a digit. The module does not invent a literal recursive digit count that assumes all three concrete operands stay n/2 digits, nor does it count addition/subtraction time as zero total running time.

At the instructor's request, the drawing now explains the reuse with a four-region coefficient rectangle derived from the expansion on slides 53 and 64. Columns are a₁,a₀ and rows b₁,b₀. Its unweighted whole is `s=(a₁+a₀)(b₁+b₀)`, not the original decimal product a·b; the schematic explicitly says place values come later and is not drawn to scale. Only the top-left m₂ and bottom-right m₀ corners receive individual numeric products. Subtracting those known corners leaves the two off-diagonal regions together as m₁. Their individual numeric products are never evaluated or counted. The pure projection and stable text rows identify every region, its operands, the whole, and the removed/retained relationships, including explicit inactive values for the scalar base.

The shift and return views keep a compact reminder of that argument and show an ordinary decimal addition ledger. Each coefficient is right-aligned after appending its prescribed zeros: m₂ shifts n places, m₁ shifts h places, and m₀ stays at the ones column. Coefficient digits are distinguished from appended zeros. The ledger adds overlapping shifted integers with carries; it does not concatenate fixed-width coefficient fields. Thus the source examples show `200+110+12=322` and `6720000+284000+2652=7006652`. The arithmetic trace, pseudocode, three-product counter, input limits, and idealized-model qualification are preserved.

## FFT integer multiplication — instructor-requested extension

FFT is absent from the supplied deck and was added at the instructor's request as a separate module, `#/07-divide-conquer/fft-multiplication`. Its scope was subsequently reduced to explain why FFT can be used for multiplication, with no trace of FFT's internal recursion, butterflies, twiddles, inverse scaling, or individual carries. The default has nine states and a five-line conceptual outline. The existing three-product module and its count remain unchanged.

The mathematical source is the representation-conversion argument in sections 1–3 of [Yan-Bin Jia, *Fast Fourier Transform and Polynomial Multiplication*, Iowa State](https://faculty.sites.iastate.edu/jia/files/inline-files/fft.pdf). Decimal digits become coefficients with a=A(10), b=B(10). At every shared evaluation point x, C(x)=A(x)B(x). Enough distinct point values uniquely determine the product polynomial, so inverse FFT recovers C's coefficients; C(10), with decimal carries, is the integer product. The drawing retains both input polynomials, the shared-point table, and the conversion arrows throughout the trace. Each matching product is a single counted event. The primary metric is **Pointwise products**, ending at N; operations inside FFT, inverse FFT, and carrying are excluded from this count. No recursive FFT recurrence or twiddle count appears in the student view. The generalization counts N matching products and briefly states Θ(n log n) total unit-cost arithmetic work after completion; it does not claim integer bit complexity.

For digit lengths p and q, the product has p+q−1 coefficient positions. Internally both vectors are zero-padded to the smallest power of two N at least p+q−1. Forward evaluation uses exp(+2πik/N); inverse recovery uses negative angles and division by N. The numerical conversions are computed with radix-2 FFT, although their recursive internals are not trace events. Four-digit inputs keep N at most eight. The full text state and supporting analysis retain the padding convention, the number of distinct points needed for recovery, precision assumptions, and the count's limited scope.

The default `23×14` produces A values `[5,3+2i,1,3−2i]`, B values `[5,4+i,3,4−i]`, and matching products `[25,10+11i,3,10−11i]`. Inverse FFT recovers coefficients `[12,11,2,0]`, so C(x)=12+11x+2x² and C(10)=322. Decimal carrying is one final conversion event; its exact digit and carry relationships remain available in the equivalent text state. The `1234×5678` lecture example and the authored `99×99` carry example are also prepared. Custom zero, one-point, and two-point inputs remain supported and tested. The default trace has N+5=9 states; eight-point examples have thirteen. Double-precision computation checks the maximum normalized imaginary/rounding residual against 1e−7 and rounds recovered coefficients. Only displayed nonintegral values are rounded to three decimals; text values include stored real and imaginary components.

## Strassen's matrix multiplication

The module follows every product and output identity on slides 68–71, with a reconstructed sequential evaluation order. The source supplies symbolic matrices, so the default A=`[[1,2],[3,4]]`, B=`[[5,6],[7,8]]` is an explicitly authored numeric instantiation for tracing those equations. It yields products `65,35,−2,8,24,22,−30` and C=`[[19,22],[43,50]]`.

Input matrices are equally sized 1×1, 2×2, or 4×4, with integer entries in ±99. A scalar base multiplication is the counted event; intermediate matrix addition, subtraction, and quadrant recombination do not advance it. Every recursive block product is solved to scalar bases, including products with zero entries, giving exactly 1, 7, or 49 scalar multiplications. Current operands, the parent/product relationship, computed products, and partial output entries have a stable structured text equivalent. For a 4×4 call, each local Aij, Bij, and Cij denotes a 2×2 block. The visible scope and equivalent block-index text state make this distinction explicit.

The model retains `M(n)=7M(n/2)`, M(1)=1 for power-of-two dimensions, and `M(n)=7ᵏ=n^(log₂7)≈n^2.807`. It describes scalar multiplication counts, not a full arithmetic-time or bit-complexity model. Slide 73's penultimate substitution accidentally ends `7ᵏM(1)=3ᵏ`; the companion uses 7ᵏ, consistent with the recurrence and that slide's final expression. This source convention is visible in supporting analysis.

The executable sequence follows the lecture's displayed order: split the inputs; compute M₁ through M₇; combine C₀₀, C₀₁, C₁₀, and C₁₁; return C. The deck gives identities rather than pseudocode, so recursive calls, the scalar base, and this sequential control flow are explicit reconstruction. Each product is evaluated exactly once per call. The output identities retain their printed addition/subtraction order: C₀₀=M₁+M₄−M₅+M₇, C₀₁=M₃+M₅, C₁₀=M₂+M₄, and C₁₁=M₁+M₃−M₂+M₆. Ordered A-block·B-block factors are preserved, including for noncommuting blocks. Zero entries and repeated values do not skip calls or cause numeric-result deduplication.

The instructor-requested tensor perspective extends the lecture, which does not introduce tensors. Its mathematical basis is the bilinear-algorithm interpretation in [Fawzi et al., *Nature* (2022), equation 1 and Algorithm 1](https://www.nature.com/articles/s41586-022-05172-4): an order-three multiplication tensor is expressed as a sum of rank-one outer products. A seven-term decomposition gives an upper bound of seven on tensor rank; this visualization does not prove the lower bound. The ordinary eight-product expansion must not be called a rank-eight tensor.

For this companion, all three local axes use the lecture's row-major order `[00,01,10,11]`. The coefficient `T[a,b,c]` multiplies the ordered A entry/block `a` and B entry/block `b` in output `c`. Thus `T[2i+j,2j+k,2i+k]=1` for `i,j,k∈{0,1}` and all other coefficients are zero. These are eight ones in a 4×4×4 array. Code stores the same tensor as four output slices `[c][a][b]`, with A rows and B columns. For a 4×4 input this is the local rule for four 2×2 blocks on each axis, rather than the full 16×16×16 scalar multiplication tensor. Recursive calls apply the same local rule with their own retained products.

Each canonical lecture product defines a rank-one term `Rr=u_r⊗v_r⊗w_r`. The existing A-operand coefficients give `u`, B-operand coefficients give `v`, and the four output formulas supply `w`. Consequently `Mr=(u_r·A)(v_r·B)` and `C=Σ_r w_r Mr`. All 64 coefficients of `Σ_r Rr` are verified against the ordinary multiplication tensor, with A-before-B ordering retained for matrix blocks. For example M₁ uses `u=v=w=[1,0,0,1]`: its eight nonzero coefficients include two target positions and six extra positions that other terms cancel. A negative numeric value such as M₃=−2 remains distinct from its coefficient signs; w₃ adds that value to C₀₁ and C₁₁.

The primary drawing exposes four C slices. Each coefficient separates the selected rank-one term from the sum of terms already retained in that recursive call. Target outlines identify the eight positions that must finish at one; all other positions must finish at zero. Signed overlaps and explicit before-plus-incoming-equals-after relationships explain cancellation. The factor vectors and concrete selected product connect this coefficient model back to the lecture algorithm. Every nonzero vector coefficient is boxed for all seven products, including −1 coefficients, with no redundant numeric underlining. These boxes identify all participating A/B positions and C destinations; zero and unselected coefficients are not boxed. The earlier display boxed only the vector positions for a single example tensor cell, which misleadingly omitted other participating inputs. A specific tensor cell remains outlined below, with its three-coefficient product printed explicitly. The instructor's preferred compact factor layout is retained without separate numeric input rows. Rank one describes a separable outer product, not a single occupied cell. Coefficients are independent of the numeric input values and are not 64 additional evaluated products. A selected but unretained term is a preview, outside the retained sum. A complete coefficient tensor does not fill algorithm C early; its entries/blocks are still written by the four canonical combine events.

The companion pseudocode is headed **Strassen algorithm**. The module opts into the shared `codeLayout: "expanded"` layout: its complete fifteen-line procedure is open in normal page flow, beside the visualization and controls on desktop and below the controls on phones. The visualization retains its stable height. The reference has readable spacing and no inner scrolling window or automatic scrolling that hides the other algorithm steps. Modules without this option keep their existing layout.

One combine event writes each C entry/block after all seven products return. The default trace has 37 states and the 4×4 preset 268; their scalar multiplication counts remain 7 and 49. The scalar preset has four states and one counted multiplication. Formal coefficient checks may summarize why completed output formulas equal the ordinary row-by-column identities, without evaluating extra numeric products or inserting additional algorithm events. Stable text rows include the full ordered recipe, current call and operands, retained products, planned combinations, partial C, and the named scalar-operation count.

## Lecture 07 verification

`npm run check` passes after the removal, including route/schema contracts, prepared KaTeX expressions, deterministic traces, and the static build. Independent oracles verify merge comparison counts from stable output origins and Strassen results against conventional matrix products. Tests cover the four published Lecture 07 modules' source results and intermediates, counted-event increments, stable description/metric labels, immutable snapshots, odd-size splits, equal-key stability, base cases, padding and carry behavior, and exact integer arithmetic. The retained Lecture 03 Master Theorem has separate regression coverage for its original Θ conclusions and exact fractional exponents.

The four published Lecture 07 direct routes were reviewed in visual and text views at 375×812, 1024×768, and 1440×900, using initial, transition, and final states. Panes remain 300, 264, and 288 pixels high respectively. The shared defaults use those heights; the requested tensor view uses a larger fixed canvas of 568 pixels on phones and 380 pixels on desktop. Default drawings and mathematical expressions fit without page-level horizontal scrolling. Focused checks additionally cover every Strassen visual state across its four presets, all integer trace states across both source examples and edge cases, merge head selection/copy/remainder events, and Mergesort returned children and root merges. Long custom keys and wider intermediate matrices use contained horizontal scrolling; a ten-key custom recursion tree may need vertical scrolling in the projector pane. Active values remain revealable without changing keyboard focus.

After the Lecture 07 Master Theorem removal, another 30 navigation and direct-route checks confirm the four current Lecture 07 routes and the retained Lecture 03 Master Theorem across those three widths and both views.

Invalid input preserves the last valid trace, keyboard stepping and timeline focus work, and complete indexed states remain available in the text disclosures. The existing Lecture 03 Master Theorem also received visual/text checks across all four recurrence presets and the same three widths, plus fractional boundary and maximum-size custom inputs, exact exponent precision, and legacy `#master-theorem` route identity. Formula wrapping was verified against both the actual scroll area and visible KaTeX glyph bounds. These are browser and structural checks; manual screen-reader validation remains outstanding, as documented for the existing shared shell.

The multiplication intuition revision adds independent checks of the explanatory relationships. Integer tests verify every rectangle coordinate and operand, the whole-minus-corners identity without separately evaluating cross products, decimal shift offsets, exact digit alignment, and overlapping coefficients with carries. All 318 visual/text samples across the two source examples, padding, zero, base, and maximum factors pass at the three viewport sizes; a separate 72-sample student-facing review checks the whole, removed corners, cross pair, and ledger. Default source diagrams fit the phone and projector panes; counted products use teal, while the recovered cross regions use valid-state green.

Strassen tests verify the lecture's M₁–M₇ computation order and four output assignments, the exact source identities, classical and noncommuting matrix oracles, scalar increments and totals, recursive parent/product relationships, no premature C values, immutable snapshots, and stable equivalent text descriptions. Tensor tests independently verify the eight ordinary coefficients, all seven outer products, the full 64-coefficient identity, per-call partial sums, preview-versus-retained state, coefficient cancellations, input-independent tensor structure, and unchanged scalar counts. Browser checks compare all 64 displayed current-term and retained-sum coefficients, factor vectors, target outlines, cancellation marks, numeric C values, events, and scalar counts throughout all 1,038 prepared visual states at 375×812, 1024×768, and 1440×900, plus 99 selected text states. Twelve phone block states needed 10–11 more pixels; those exact states pass after increasing the fixed phone canvas to 568 pixels. The desktop canvas remains 380 pixels. All labels are at least 12 pixels, the canvas is contained by its parent, transport stays below it, and all fifteen algorithm lines remain open without an inner scrollbar. A separate 120-sample teaching review checks the three-factor-to-cell equality, coefficient cancellation, preview retention, eight final target ones, twelve cancellation pairs, zero-input independence, and separate numeric outputs. Twelve targeted ±99 custom frames verify exact results/counts, complete tensor values, readable glyphs, and contained scrolling. A scalar-ready wording correction has a regression test and twelve refreshed visual/nine text checks across all three widths. The final `npm run check` passes all 21 test files and builds the static site.

The vector-box correction has 108 refreshed visual and 33 text checks at the same three viewport sizes. All seven products are checked against independently transcribed source coefficients in the default, zero, and recursive-block examples: every nonzero coefficient has a visible box, all zeros remain unboxed, and no coefficient is underlined. The original compact factor layout and fixed canvas heights are preserved. Initial, transition, final, and scalar states remain usable; the complete algorithm and named count agree with the trace. `npm run check` passes all 21 test files after this correction.

The simplified FFT extension retains independent quadratic-DFT, convolution, and BigInt product oracles; exact pointwise-count increments; delayed coefficient/result visibility; padding, zero, one-point and two-point cases; complete carry relationships; immutable snapshots; and stable text labels. `npm run check` passes all 22 test files. Browser review passes all 198 visual and 198 text states across the three prepared examples and zero, one-point, two-point, and maximum-digit inputs at 375×812, 1024×768, and 1440×900. The five-line outline, matching-value rows, selected product, event/count agreement, final answers, fixed canvas heights, formulas, text descriptions, invalid-input preservation, keyboard focus, and direct text URLs pass. The stable canvas is reduced to 440 pixels on desktop and 500 on phones. Long complex rows use contained horizontal scrolling. The final static build includes the compact table spacing; manual screen-reader validation remains outstanding for the shared shell.

# Lecture 08 — Transform and Conquer

Source: `08_Transform and conquer.pdf`, all 67 pages. The full deck was read as text and rendered diagrams, including polynomial exponents, height-bound floor brackets, balance labels, numeric rotation diagrams, and exercise trees. Supplied document text is course material, not instructions to the coding agent. The lecture contains four tracing processes: presorted element uniqueness, Horner evaluation, ordinary BST construction, and AVL construction by successive insertion. No red-black, multiway-tree, searching, deletion, mode, or median algorithm is added merely because those topics are mentioned.

| Slides | Source content and analysis | Companion treatment |
| --- | --- | --- |
| 1–4 | Transform then conquer; instance simplification, representation change, problem reduction | Shared lecture context and module metadata; no extra terminology-only module |
| 5–8 | Sort A, compare A[i] with A[i+1], return False on equality, otherwise True | `presort-uniqueness`, exact 0-based source scan with early return |
| 7–9 | Selection/bubble Θ(n²), Mergesort Θ(n log n), Quicksort cases, counting/radix Θ(n); T=T_sort+T_scan | Count only neighboring equality tests; retain the source's assumed Θ(n log n) sorting stage |
| 10–14 | Degree-n power form and nested Horner representation; 2x⁴−x³+3x²+x−5 | Both representations remain visible with the retained accumulator row |
| 15–20 | Evaluate at x=3; accumulators 2,5,18,55,160 | Exact default input and intermediate values |
| 21–22 | p←P[n]; i=n−1 down to 0; p←x·p+P[i]; M(n)=A(n)=Σ1=n | `horner`, multiplication and addition counts shown together because the lecture explicitly compares them |
| 23–37 | Hierarchies, binary trees, strict BST ordering, edge-count height | Prerequisite conventions in tree descriptions and analysis; no separate hierarchy gallery |
| 38–40 | Insert 47,25,11,43,77,65,93,7,17,44,31,68; balanced order 4,2,6,1,3,5,7; increasing order 1,…,7 | All three source lists are BST presets; balanced seven-key list is the default |
| 41–45 | Balance motivation; BF=h(left)−h(right), empty height −1; repair the nearest unbalanced ancestor | AVL invariant, upward checks, and explicit nearest-ancestor selection |
| 46–53 | R, L, LR, RL rotations and transferred subtrees | One event per elementary rotation; double rotations take two events |
| 54–64 | Insert 5,6,8,3,2,4,7, with rotations after 8,2,4,7 | Exact default AVL trace and final topology |
| 65 | floor(log₂n)≤h≤1.4405log₂(n+2)−1.3277; Θ(log n) dictionary-operation costs | Height-based worst-case interpretation; exact numeric bound retained here rather than crowding the drawing |
| 66 | Classify three displayed trees, including an ordering failure | Inventoried prerequisite; no separate classification mode. Height balance alone is not sufficient for AVL validity |
| 67 | AVL exercises 1,…,6; 6,…,1; 3,6,5,1,2,4 | All three lists are prepared AVL inputs |

## Presorting

The deck gives no numeric uniqueness example, so the default instantiates its exact procedure with keys from slide 38, `47,25,11,43,77,65,25`, including one repeated 25. The unique preset uses slide 39's keys; the equal-key case repeats a source key. These authored instances are labeled by their behavior rather than falsely called source worked examples. Numeric inputs are 1–10 integer keys in ±99. Sorting is the single transformation event from source pseudocode; its internal algorithm is not retraced. The numeric host sort only produces the displayed sorted instance. The time model assumes the Θ(n log n) comparison-sort stage on slide 9 and is not a measured complexity claim about the host's sorting implementation.

The primary count is an evaluated neighboring equality test, excluding the sorting operation and loop guards. All-unique inputs need n−1 such tests, and the procedure stops immediately on the first equal pair. Slide 9 writes T_scan=Θ(n), which describes the full/worst-case scan; the companion uses O(n) in the total model to accommodate the source's early return. With the assumed Θ(n log n) sort, total time is still Θ(n log n) for n>1. The source's unqualified linear counting/radix sorting claim is not used to infer a different total model without its required domain assumptions.

## Horner's rule

Input coefficients are listed highest degree first, matching the slide table, then parsed into P[0..n] with P[i] the coefficient of x^i, matching slide 21's pseudocode. Degree n is the size parameter, not the number n+1 of coefficients. Initialization p=P[n] counts neither a multiplication nor an addition. Each p=x·p+P[i] update counts one of each, including zero/unit operands. The polynomial 2x⁴−x³+3x²+x−5 at x=3 yields p=2,5,18,55,160 and exactly four multiplications and four additions. The nested expression and accumulator row are both retained so the representation change is visible.

Input permits one to eight integer coefficients in ±20 and an integer evaluation point in ±10; leading zero coefficients are rejected for a nonconstant polynomial so the displayed n is its actual degree. This bound keeps every supported integer intermediate exact in JavaScript numbers. A constant polynomial is a supported base case with zero arithmetic operations. The x=0 and x=−3 presets reuse the source polynomial at authored alternative input points, without introducing another algorithm or analysis claim.

## BST and AVL trees

The deck specifies definitions, insertion orders, and rotation diagrams, but gives no executable tree pseudocode. The companion's iterative BST insertion and AVL insertion control flow are explicit reconstruction. Keys are distinct integers in ±99, with at most twelve entries so the full slide-38 list remains supported. Duplicate keys are rejected rather than inventing a multiset rule inconsistent with slide 36's strict ordering. One conceptual three-way comparison between the inserted key and a visited node is counted for the BST module; empty-position and pointer tests are excluded. The balanced and chain lists on slides 39–40 yield heights 2 and 6 and construction counts 10 and 21 under this convention. The general count C=Σc_i and the increasing-order sum Σ(i−1)=n(n−1)/2 are reconstructed from those insertion paths; they are not source formulas printed on the slides.

Height counts edges, with h(empty)=−1 and h(leaf)=0. Slide 35's node-level sentence says root-to-leaf even though the level diagram uses root-to-node depth; the companion follows the latter, separately retaining the source's edge-based height convention. The AVL balance factor is always h(left)−h(right), including transient imbalance before repair. Current heights and factors reflect the actual current tree; they are not stale values from before an insertion or half-completed double rotation.

On the worked AVL list `5,6,8,3,2,4,7`, the repair sequence is L at 5 after inserting 8; R at 5 after inserting 2; LR at 6 after inserting 4; and RL at 6 after inserting 7. The second repair correctly selects node 5, even though its ancestor 6 is also unbalanced. LR and RL are each exposed as two elementary rotations, preserving the intermediate BST and all middle-subtree transfers. The final tree is root 5, left subtree 3 with children 2 and 4, and right subtree 7 with children 6 and 8, all BF=0. The primary AVL count is **Rotations**: one for each elementary L/R, six in the default. Comparison and balance-check details remain in the full text state. R=Σr_i, r_i∈{0,1,2}, counts these repairs and is not total insertion time.

Slides 47 and 49 contain numeric diagrams that place smaller keys on right branches, contrary to the explicit BST condition on slide 36. The L example draws the descending sequence 3→2→1 to the right, and the RL example has root 3 with right child 1. These must not be silently reproduced as valid BSTs. The companion follows the ordering definition, the generic subtree-transfer diagrams on slides 50–53, and the consistent worked sequence on slides 54–64. Supporting student analysis makes this convention explicit. The four elementary test triples are R:3,2,1; L:1,2,3; LR:3,1,2; RL:1,3,2; the right-heavy L/RL patterns correct the source's numeric labeling while preserving its stated rotation types.

Slide 65's Θ(log n) searching/insertion/deletion statements are interpreted as worst-case height-based dictionary-operation costs, not a claim that every particular operation traverses Θ(log n) nodes. No deletion or search algorithm is added because the deck gives no worked process for it. Slide 66's third exercise also violates BST ordering despite being height-balanced; this is inventoried but not recreated as a misleading valid AVL input.

## Lecture 08 verification

Pure trace tests independently check multiset preservation and the first duplicate's scan position, direct polynomial evaluation and exact arithmetic counts, source BST topology and path counts, every AVL intermediate's ordering/heights/balance factors, nearest-ancestor selection, all four rotation types, nonempty middle-subtree transfers, and agreement with an independent recursive AVL oracle over all five-key insertion orders plus source exercises. Snapshot immutability, deterministic replay, stable complete description labels, invalid inputs, and count/pseudocode agreement are also checked. `npm run check` passes all 24 test files and builds the static site. Browser review checks all 1,416 prepared visual states across the thirteen presets, 360 selected text states visited out of order, and 99 custom initial/transition/final snapshots at 375×812, 1024×768, and 1440×900. The checks compare displayed arrays, Horner accumulators, every tree node and parent-child edge, ordering/depth geometry, balance labels, transferred-edge highlighting, operation counts, event messages, and complete equivalent text values against their snapshots. All four direct text URLs, native keyboard stepping/focus, Ready labels, invalid-input preservation, formula wrapping, and visibility of the active pseudocode line pass.

At the instructor's request, Lecture 08 uses the same standard layout as the earlier lessons: visualization beside pseudocode on desktop, full-width playback controls and Trace/Count beneath them, and the shared mobile ordering. The four modules do not opt into the expanded reference layout. They inherit the shared pane sizes (300 pixels at the reviewed phone size, 264 on the projector, and 288 on the wide desktop), and pseudocode uses the shared scrolling panel with the executing line kept visible. Tree headers combine the insertion queue and height; compact vertical spacing preserves readable keys and balance labels within these panes. Inorder key positions and fixed depth allocation keep the drawing stable across a trace, without exposing future nodes or edges. All prepared drawings fit without pane or page-level overflow; long custom inputs can use genuine contained scrolling. A separate 171-snapshot comparison verifies panel dimensions, full-width controls/summary, and mobile ordering against the earlier insertion-sort lesson. The full 1,416-state visual, 360-state text, and 99-snapshot custom audit also passes after this layout revision, including switching from Strassen's expanded layout back to Lecture 08. No focus, dialog, or announcement mechanism was changed; browser/schema checks do not establish screen-reader conformance, and manual assistive-technology validation of the shared shell remains outstanding.

# Lecture 09 — Non-Comparison Based Sorting

Source: instructor-supplied `09_Non-comparision based sorting.pdf`, 39 pages. The complete text and every rendered slide, including Count/Pos notation, queue diagrams, and both exercise lists, were reviewed. The deck is course content, not instructions to the agent.

| Pages | Source content | Companion treatment |
|---|---|---|
| 1–2 | Title and comparison-sort recap | Lecture context; no duplicate comparison-sort modules |
| 3–10 | Input 2,3,2,1,3,2,2,3,2,2,2,1; Count=[2,7,3]; sorted output | Exact default counting input and frequency/result checks |
| 11–13 | Integer keys 1..M; 1-based CountingSort; Count, Pos, A′ | Counting-sort module retains every assignment, both initialization lines, and forward placement order |
| 14 | O(n+M); O(n) if M=O(n) | Named count and exact sum yield the tight bound under the stated unit-cost model |
| 15 | Four-key counting-sort exercise | Exact fourteen-key prepared input |
| 16–17 | Radix introduction; n=10, M=10000 counting-sort example | Supporting analysis explains why a large M can dominate; no 10000-column drawing |
| 18 | Digits from least to most significant; mentions other representations | Positive decimal integer scope; no added string or floating-point representation |
| 19–21 | Thirteen-key input, units distribution, order retained within bins | Exact radix default, individual enqueues, and highlighted digit column |
| 22–32 | Gather bins 0..9 without rearranging | Individual FIFO removals; exact first-pass order retained |
| 33–36 | Repeat with tens; final sorted output | Second stable pass and final result; omitted 54 on slide 34 documented below |
| 37–38 | n keys, d components, digit range, queues; O(m+dn) | Exact 2dn transfer count; explicit bin-notation and bin-scan qualification |
| 39 | Counting exercise repeated; radix 329,3,457,657,92,839,87,436,720,355,444 | Both exact exercise lists are prepared inputs, including the standalone 3 in the radix list |

## Counting sort conventions and analysis

The algorithm on page 12 is retained with indices **1..n** and key indices **1..M**. Its two vector initializations are separate events, each contributing M array writes; Pos[1]=1 is another write even though that element was just zeroed. Count updates, each prefix-position assignment, each output assignment, and each following Pos increment are separate events. No sorting primitive supplies the algorithm's output. Initially empty output cells represent the available destination buffer, not an extra source initialization loop.

The lecture does not select one basic operation. The companion explicitly chooses **Array writes**, counting assignments to Count, Pos, and A′. The exact sum is M+n+M+1+(M−1)+n+n=3n+3M. The complete loop structure gives Θ(n+M), a documented tightening of the deck's O(n+M), and Θ(n) when M=O(n). This is a unit-cost integer indexing/arithmetic model. Scalar variables, reads, and loop guards are excluded from the displayed count; absence of key-to-key comparisons does not mean there are no index/loop tests.

The default's Count is [2,7,3], initial positions [1,3,10], and final Pos [3,10,13]. Its 45 writes produce [1,1,2,2,2,2,2,2,2,3,3,3]. Original input identities in that output are [4,12,1,3,6,7,9,10,11,2,5,8]. The exercise counts are [4,2,4,4], starts [1,5,7,11], and 54 writes. Retained **Start** values explain each block even as Pos advances; output # labels expose stable order. Start and input identities are explanatory metadata, not extra arrays or writes in the lecture algorithm.

Custom input includes an explicit M so absent keys and the range cost remain expressible. Limits are 1–14 keys and 1≤M≤32; these are drawing/trace limits, not restrictions claimed for the algorithm. The default twelve and exercise fourteen entries intentionally exceed the usual ten-item guidance to preserve the source. Page 17's n=10, M=10000 example remains in supporting analysis because a full range trace is unsuitable for the shared pane. No outside prepared input is added.

## Radix sort conventions, source discrepancies, and analysis

The deck supplies worked diagrams, FIFO queue behavior, and analysis rather than executable pseudocode. The nine-line outline is an explicit reconstruction: create queues, visit decimal columns from least to most significant, append each input key to its bin's rear, visit bins 0..9, remove each front into the gathered buffer, and adopt that buffer as the next A. The actual trace uses those queues rather than a comparison sort. Initial queue creation, pass boundaries, each transfer, and adoption are meaningful events. Adopting the buffer is a reference change, not a second n-key copy.

The counter is **Key moves**: one enqueue or one dequeue into output. Every full pass contributes n+n; K(n,d)=Σ(n+n)=2dn. Digit extraction, initial queue construction, loop/bin tests, and buffer adoption are excluded from this counter and are not falsely claimed to be total time. A single-digit input still has one pass. Custom input is 1–14 positive integer keys at most 99999; shorter keys receive leading zeros for digit selection, while the numeric values and original occurrence identities are preserved. Index labels are 1-based for consistency with the counting-sort section; radix diagrams themselves have no index convention. Decimal p=0..d−1 in the outline corresponds to pass p+1 in the drawing and text.

The first worked order after units is [10,51,31,62,23,13,54,5,37,18,48,8,29]. After tens it is [5,8,10,13,18,23,29,31,37,48,51,54,62]. Exactly 52 key moves are performed. The eleven-key exercise has three passes and 66 moves, ending [3,87,92,329,355,436,444,457,657,720,839]. Full text retains each completed pass, every FIFO queue's front-to-rear order, every item's original identity, and the invariant that the last p digits are sorted after p completed passes.

Two slide discrepancies are not silently inherited:

- Page 34 omits **54** from tens bin 5, although the original input contains it. Pages 35–36 include it correctly after 51. The trace follows those complete diagrams and preserves the input multiset. This convention is also stated in student-facing supporting analysis.
- Page 37 calls digit values 0..m, while page 38 refers to m bins. The companion explicitly uses **m=10 as the number of bins**, labeled 0..m−1. Page 38's O(m+dn) accounts for initial construction and key transfers but omits repeated visits to empty bins. The reconstructed outline visits every bin each pass, giving Θ(m+d(n+m)) if m varies. With decimal m=10 it is Θ(dn), consistent with the lecture's conclusion under its fixed-bin assumption; linearity in n also requires fixed d. The source formula and the qualification both remain visible in the completed mathematical model's notes and supporting analysis. No generalized variable-radix algorithm is added.

## Lecture 09 layout and verification

Both modules use the standard earlier lecture layout, without expanded-code mode or shared-shell geometry overrides. Count/Pos and queue drawings use lecture-local styles, preserve the normal pane heights, and provide contained scrolling only when the source-sized array or a long custom range/queue cannot fit. Active keys, indexed positions, selected digit outlines, transfer equations, and complete text states identify each action without relying on color. Production remains static and offline with local KaTeX. Shared focus, dialogue, and announcement mechanisms are unchanged; manual screen-reader validation of the shared shell remains outstanding.

`npm run check` passes all 25 test files and builds the static site. New pure tests verify every intermediate frequency/prefix position and array-write increment, stable output identities, FIFO item conservation, exact source pass orders, all completed digit invariants, 2dn moves, small/duplicate/long-key cases, snapshot independence, stable descriptions, and invalid input. Browser review covers all **696 prepared visual states**, **111 selected text states visited out of order**, and **63 custom initial/transition/final states** at 375×812, 1024×768, and 1440×900. Displayed arrays, Count/Start/Pos, each queue and its identities, selected digits, events, counts, and equivalent text values match the pure snapshots. All prepared drawings fit the shared pane heights without outer overflow; source-sized arrays can scroll horizontally on phones. Prepared queues and individual numeric cells remain readable. Direct visual/text routes, native keyboard stepping and focus, formula fit, executing-line visibility, invalid-input trace preservation, and returning from Strassen's expanded layout all pass, with no browser errors. Five-digit custom cells reserve their full width even before a digit is active; longer queues/ranges use contained scrolling. These automated checks do not establish screen-reader conformance.
