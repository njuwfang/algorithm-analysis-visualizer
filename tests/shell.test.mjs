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
    "textTrace",
    "traceControls",
    "metrics",
    "generalizeTitle"
  ].map((id) => html.indexOf(`id="${id}"`));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(html, /GitHub Pages ready|One shell, one module contract|Reusable workflow/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/);
});

test("the shell provides an equivalent keyboard-accessible text trace", async () => {
  const [html, app, components] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8"),
    readFile(new URL("assets/styles/components.css", root), "utf8")
  ]);

  assert.match(html, /id="textTraceToggle"[^>]+aria-controls="visualization textTrace"/);
  assert.match(html, /id="textTrace"[^>]+tabindex="-1"[^>]+hidden/);
  assert.match(app, /module\.describe\(step\)/);
  assert.match(app, /setAttribute\("aria-current", "step"\)/);
  assert.match(app, /params\.get\("view"\) === "text"/);
  assert.match(app, /url\.searchParams\.set\("view", "text"\)/);
  assert.match(app, /event\.target\.closest\("#textTrace,/);
  assert.match(app, /description\.summary/);
  assert.match(app, /activeCodeText\(module, step\)/);
  assert.match(components, /\.text-trace\s*\{[^}]*overflow:\s*auto/s);
  assert.match(html, /id="liveStatus"[^>]+role="status"[^>]+aria-atomic="true"/);
  assert.match(html, /id="playButton"[^>]+aria-describedby="playbackHint"/);
});

test("modal navigation and trace shortcuts preserve keyboard and assistive-technology commands", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8")
  ]);

  assert.match(html, /id="courseNav"[^>]+role="dialog"[^>]+aria-modal="true"[^>]+aria-labelledby="courseNavTitle"/);
  assert.match(html, /id="navBackdrop"[^>]+aria-hidden="true"/);
  assert.match(app, /dom\.topbar\.inert = open/);
  assert.match(app, /dom\.lessonMain\.inert = open/);
  assert.match(app, /function setNavigationOpen\(open[^)]*\) \{\s*if \(open\) stopPlayback\(\)/);
  assert.doesNotMatch(app, /navBackdrop\.setAttribute\("aria-hidden"/);
  assert.match(app, /!element\.closest\("\[hidden\]"\)/);
  assert.match(app, /event\.defaultPrevented \|\| event\.altKey \|\| event\.ctrlKey \|\| event\.metaKey \|\| event\.shiftKey/);
});

test("route changes use the single shared status region", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8")
  ]);

  assert.equal([...html.matchAll(/\baria-live=/g)].length, 1);
  assert.doesNotMatch(html, /class="route-summary"[^>]*aria-live/);
  assert.match(app, /announcementLead: `Loaded \$\{route\.module\.title\}, step`/);
});

test("manual timeline changes and activity rerenders retain accessible feedback and focus", async () => {
  const app = await readFile(new URL("src/core/app.js", root), "utf8");

  assert.match(app, /stepRange\.addEventListener\("change", \(\) => \{\s*renderCurrent\(\{ shouldAnnounce: true,[^}]+announcementLead:/s);
  assert.match(app, /focusedControlAction/);
  assert.match(app, /matchingControl \?\? \$\("button:not\(\[disabled\]\)"/);
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

test("lecture navigation starts collapsed and expands one lecture at a time", async () => {
  const app = await readFile(new URL("src/core/app.js", root), "utf8");

  assert.match(app, /expandedLectureId:\s*null/);
  assert.match(app, /data-lecture-toggle=/);
  assert.match(app, /aria-expanded="\$\{expanded\}"/);
  assert.match(app, /aria-controls="lecture-modules-/);
  assert.match(app, /\$\{expanded \? "" : "hidden"\}/);
  assert.match(app, /state\.expandedLectureId === lectureId \? null : lectureId/);
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

test("pseudocode indentation keeps line numbers aligned and supports three levels", async () => {
  const components = await readFile(new URL("assets/styles/components.css", root), "utf8");

  for (const [level, padding] of [[1, 24], [2, 40], [3, 56]]) {
    const rule = components.match(new RegExp(`\\.code-indent-${level}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
    assert.match(rule, new RegExp(`padding-left:\\s*${padding}px`));
    assert.doesNotMatch(rule, /margin-left/);
  }
});

test("sorting states use labels and shapes in addition to color", async () => {
  const styles = await readFile(new URL("src/lectures/04-brute-force/styles.css", root), "utf8");

  assert.match(styles, /\.sort-item\.is-sorted::before\s*\{[^}]*content:\s*"✓"/s);
  assert.match(styles, /\.sort-item\.is-compared\s*\{[^}]*border-style:\s*dashed/s);
  assert.match(styles, /\.sort-item\.is-compared::before\s*\{[^}]*content:\s*"CMP"/s);
  assert.match(styles, /\.sort-item\.is-minimum\s*\{[^}]*border-style:\s*double/s);
  assert.match(styles, /\.sort-item\.is-minimum::before\s*\{[^}]*content:\s*"MIN"/s);
  assert.match(styles, /\.sort-item\.is-current::before\s*\{[^}]*content:\s*"NOW"/s);
});


test("every local page and stylesheet asset reference exists", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const pageAssets = [...html.matchAll(/(?:href|src)="(\.\/[^"?]+)(?:\?[^"?]*)?"/g)]
    .map((match) => match[1]);

  for (const asset of pageAssets) {
    await assert.doesNotReject(access(new URL(asset, root)), `missing page asset: ${asset}`);
  }

  const stylesheets = pageAssets.filter((asset) => asset.endsWith(".css"));
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
