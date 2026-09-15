import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);


test("the shared app binds only elements that exist exactly once", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8")
  ]);

  const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(htmlIds).size, htmlIds.length, "index.html contains a duplicate id");

  const boundIds = [...app.matchAll(/\$\("#([^"]+)"\)/g)].map((match) => match[1]);
  for (const id of boundIds) {
    assert.equal(htmlIds.filter((candidate) => candidate === id).length, 1, `#${id} must exist once`);
  }
});


test("the student shell follows the concise teaching sequence", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const positions = [
    "inputForm",
    "visualization",
    "traceControls",
    "metrics",
    "generalizeTitle"
  ].map((id) => html.indexOf(`id="${id}"`));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(html, /GitHub Pages ready|One shell, one module contract|Reusable workflow/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/);
});


test("course navigation stays in the header without site branding or presentation mode", async () => {
  const [html, app, layout] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8"),
    readFile(new URL("assets/styles/layout.css", root), "utf8")
  ]);
  const header = html.slice(html.indexOf("<header"), html.indexOf("</header>") + 9);

  assert.match(header, /<h1 id="lessonTitle"/);
  assert.match(header, /id="previousModuleButton"/);
  assert.match(header, /id="nextModuleButton"/);
  assert.match(header, /aria-label="Previous and next visualization"/);
  assert.match(header, />Lectures</);
  assert.match(html, /aria-label="Interactive lecture visualization"/);
  assert.doesNotMatch(html, /slideReference|>Slides /);
  assert.doesNotMatch(html, /predictLabel|teachingPrompt|>Predict</);
  assert.doesNotMatch(html, /lecturePill|lessonObjective/);
  assert.match(html, /rel="icon" href="data:image\/svg\+xml/);
  assert.match(app, /route\?\.module\.shortTitle/);
  assert.doesNotMatch(html, /Algorithm Visual Lab|presentButton|lesson-pager/);
  assert.doesNotMatch(html, /class="lesson-heading"/);
  assert.doesNotMatch(app, /presentation|presentButton|togglePresentation/);
  assert.doesNotMatch(layout, /presentation-mode|lesson-pager/);
});


test("visualizations keep a stable viewport and scroll only on overflow", async () => {
  const [app, layout] = await Promise.all([
    readFile(new URL("src/core/app.js", root), "utf8"),
    readFile(new URL("assets/styles/layout.css", root), "utf8")
  ]);

  assert.match(layout, /\.stage-grid\s*\{[^}]*height:\s*clamp\(/s);
  assert.match(layout, /\.visualization\s*\{[^}]*overflow:\s*auto/s);
  assert.match(app, /revealActiveVisualization/);
});


test("inline mathematics delegates horizontal overflow to the pseudocode panel", async () => {
  const components = await readFile(new URL("assets/styles/components.css", root), "utf8");
  const pseudocodeRule = components.match(/\.pseudocode\s*\{([^}]*)\}/)?.[1] ?? "";
  const codeMathRule = components.match(/\.code-math\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.match(pseudocodeRule, /overflow:\s*auto/);
  assert.doesNotMatch(codeMathRule, /overflow/);
});


test("every local page and stylesheet asset reference exists", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const pageAssets = [...html.matchAll(/(?:href|src)="(\.\/[^"?]+)(?:\?[^"?]*)?"/g)]
    .map((match) => match[1]);

  for (const asset of pageAssets) {
    await assert.doesNotReject(access(new URL(asset, root)), `missing page asset: ${asset}`);
  }

  const stylesheets = [
    "assets/styles/tokens.css",
    "assets/styles/base.css",
    "assets/styles/layout.css",
    "assets/styles/components.css",
    "assets/styles/visualizations.css",
    "assets/vendor/katex/katex.min.css"
  ];
  for (const stylesheet of stylesheets) {
    const stylesheetUrl = new URL(stylesheet, root);
    const css = await readFile(stylesheetUrl, "utf8");
    const assets = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
      .map((match) => match[1])
      .filter((asset) => !asset.startsWith("data:"));

    for (const asset of assets) {
      await assert.doesNotReject(access(new URL(asset, stylesheetUrl)), `missing CSS asset: ${asset}`);
    }
  }
});
