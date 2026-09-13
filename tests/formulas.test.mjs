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


test("KaTeX parses every module formula", async () => {
  const source = await readFile(new URL("assets/vendor/katex/katex.min.js", root), "utf8");
  const context = { self: {} };
  vm.runInNewContext(source, context);

  const modules = [
    ...routes.map((route) => route.module),
    maxElementModule,
    uniqueElementModule
  ];
  for (const module of modules) {
    const input = module.input.parse(module.input.default);
    const model = module.model(module.buildTrace(input)[0]);
    const rendered = context.self.katex.renderToString(model.latex, {
      output: "htmlAndMathml",
      strict: "error",
      throwOnError: true,
      trust: false
    });

    assert.match(rendered, /class="katex-mathml"/, module.id);
    assert.match(rendered, /class="katex-html"/, module.id);
  }
});
