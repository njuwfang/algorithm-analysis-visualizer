# Website and Visualization Style Guide

This site should feel like a calm academic instrument: clear hierarchy, restrained color, large readable states, and no decorative motion that competes with the algorithm.

Use commit `51c333d45531faa9017d9f97a9e9b1d27445ec30` as the visual-tone reference: warm paper, an airy masthead, softly rounded white cards, restrained shadows, and a faint graph-paper visualization surface. Preserve that tone without restoring the older screen's duplicate panels or controls.

Use flat geometric forms for algorithm objects. Avoid simulated materials, glossy gradients, bevels, inset highlights, and shadows that make controls or diagrams look physically raised.

## Visual language

| Role | Token | Meaning |
|---|---|---|
| Navigation and structure | Indigo | Course hierarchy, formulas, selected controls |
| Current event | Amber | The operation happening now |
| Basic operation | Teal | The operation being counted in the analysis |
| Valid/final state | Green | Confirmed result or legal completion |
| Invalid state | Red | Illegal move, duplicate, or input error |

Use a text label, border, icon, or shape together with color. The visualization must remain understandable when printed in grayscale.

## Page anatomy

Every algorithm page uses the same order:

1. **Lecture context in the header and one algorithm title**
2. **Input and one compact example chooser**
3. **Visualization beside pseudocode**
4. **Playback or practice controls**
5. **One Trace → Count strip**
6. **Mathematical model, with supporting analysis on demand**

Do not rearrange this order for one-off modules. Consistency is part of the teaching method.

The default screen is for students, not site authors. Do not surface architecture notes, deployment links, duplicate workflow rails, repeated complexity labels, or secondary counters. Put supporting detail in a native disclosure when it remains useful.

## Typography

- System sans-serif for prose and controls.
- System monospace for pseudocode, values, and counters; the locally bundled KaTeX math fonts for formulas.
- Avoid body text below 12 px on a projector. Remove low-priority copy instead of shrinking it.
- Prefer short headings and one-sentence explanations.

## Visualization behavior

- One trace state should represent one meaningful event.
- The active pseudocode line and visible state must agree.
- Counters update at the exact event where the operation occurs.
- A completed trace must show the returned result and final count.
- Animation is optional; stepping must always work.
- Avoid random inputs in prepared scenarios. Teaching examples should be reproducible.
- Keep a stable visualization height and reveal scrollbars only when the drawing cannot fit.

## Content writing

Use the lecture's notation and vocabulary. Each module should answer:

- What is the input-size parameter?
- What is the basic operation?
- Do best, average, and worst cases differ?
- What sum or recurrence counts the operation?
- What order of growth follows?

Trace messages should state the visible event directly and use the lecture's vocabulary.

## Responsive and projector checks

Test at approximately:

- 375 × 812: phone
- 1024 × 768: classroom projector
- 1440 × 900: laptop/desktop

Never hide the pseudocode, operation counter, or mathematical model solely to fit the screen.

On narrow screens, place playback controls directly after the visualization and keep pseudocode in a bounded, internally scrolling panel. The active line must scroll into view as the trace advances.

## CSS organization

- `tokens.css`: colors, spacing primitives, type families
- `base.css`: reset and global behavior
- `layout.css`: page shell and responsive layout
- `components.css`: controls, cards, code, formulas, navigation
- `visualizations.css`: algorithm-specific drawing primitives

Prefer existing tokens and components. Add a new token only when it represents a reusable semantic role.
