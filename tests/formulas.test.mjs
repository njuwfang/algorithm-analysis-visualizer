import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { routes } from "../src/lectures/registry.js";
import { maxElementModule } from "../src/lectures/03-analysis/max-element.js";
import { uniqueElementModule } from "../src/lectures/03-analysis/unique-element.js";

const root = new URL("../", import.meta.url);


test("loads the vendored KaTeX renderer without a CDN", async () => {
  const [html, app, katex] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8"),
    readFile(new URL("assets/vendor/katex/katex.min.js", root), "utf8")
  ]);

  assert.match(html, /\.\/assets\/vendor\/katex\/katex\.min\.css/);
  assert.match(html, /\.\/assets\/vendor\/katex\/katex\.min\.js/);
  assert.doesNotMatch(html, /cdn\.jsdelivr|cdnjs|unpkg/);
  assert.match(app, /window\.katex\.render\(model\.latex/);
  assert.ok(katex.length > 100_000, "vendored KaTeX bundle appears incomplete");
});


test("KaTeX parses every mathematical line and formula state", async () => {
  const source = await readFile(new URL("assets/vendor/katex/katex.min.js", root), "utf8");
  const context = { self: {} };
  vm.runInNewContext(source, context);

  const modules = [
    ...routes.map((route) => route.module),
    maxElementModule,
    uniqueElementModule
  ];
  for (const module of modules) {
    for (const [index, line] of module.pseudocode.entries()) {
      if (!line.latex) continue;
      assert.doesNotThrow(
        () => context.self.katex.renderToString(line.latex, {
          output: "htmlAndMathml",
          strict: "error",
          throwOnError: true,
          trust: false
        }),
        `${module.id}, mathematical line ${index}`
      );
    }

    const extraInputs = module.id === "master-theorem"
      ? ["2, 2, 0.5, 16", "2, 4, 0.5, 64", "1, 4, 0.5, 64", "3, 2, 1, 16"]
      : [];
    const inputs = new Set([module.input.default, ...module.input.presets.map((preset) => preset.value), ...extraInputs]);
    for (const raw of inputs) {
      const input = module.input.parse(raw);
      const trace = module.buildTrace(input);
      for (const [index, step] of trace.entries()) {
        const model = module.model(step);
        const rendered = context.self.katex.renderToString(model.latex, {
          output: "htmlAndMathml",
          strict: "error",
          throwOnError: true,
          trust: false
        });

        assert.match(rendered, /class="katex-mathml"/, `${module.id}, ${raw}, state ${index}`);
        assert.match(rendered, /class="katex-html"/, `${module.id}, ${raw}, state ${index}`);
      }
    }
  }
});
