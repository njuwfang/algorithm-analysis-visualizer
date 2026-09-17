import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);


test("the text trace keeps a concise current step and one collapsed full-state view", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8")
  ]);
  const traceStart = html.indexOf('id="textTrace"');
  const trace = html.slice(traceStart, html.indexOf("</article>", traceStart));

  for (const id of [
    "textTraceSummary",
    "textTracePosition",
    "textTraceActiveCode",
    "textTraceKeyChangesSection",
    "textTraceChangeSummary",
    "textTraceKeyChanges",
    "textTraceMoreChanges",
    "textTraceMoreChangesSummary",
    "textTraceChanges",
    "textTraceStateRows",
    "textTraceMetricRows",
    "textTraceDetails",
    "textTraceDetailsList",
    "repeatStepButton"
  ]) {
    assert.match(trace, new RegExp(`\\bid="${id}"`), `#${id} must remain stable across trace updates`);
  }

  for (const oldId of ["textTraceHistory", "readChangesButton", "readStateButton"]) {
    assert.doesNotMatch(trace, new RegExp(`\\bid="${oldId}"`), `#${oldId} should not remain in the simplified view`);
    assert.doesNotMatch(app, new RegExp(`dom\\.${oldId}\\b`), `${oldId} should not remain bound in the app`);
  }

  assert.match(
    trace,
    /<details\b[^>]*class="text-trace-disclosure"[\s\S]*?<summary>[\s\S]*?Full state and relationships[\s\S]*?id="textTraceStateRows"[\s\S]*?id="textTraceMetricRows"[\s\S]*?<\/details>/,
    "the complete state should use one native, collapsed disclosure"
  );
  assert.ok(trace.indexOf('id="textTraceSummary"') < trace.indexOf('id="textTraceKeyChanges"'));
  assert.ok(trace.indexOf('id="textTraceKeyChanges"') < trace.indexOf('id="textTraceStateRows"'));
});


test("key changes are bounded and exclude information already shown elsewhere", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/core/app.js", root), "utf8")
  ]);

  assert.equal([...html.matchAll(/\brole="status"/g)].length, 1, "trace updates should share one status region");
  assert.match(html, /id="liveStatus"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
  assert.match(app, /deriveTraceChanges/);
  assert.match(app, /const TEXT_TRACE_CHANGE_LIMIT\s*=\s*4/);
  assert.match(app, /normalizedLabel\("Active pseudocode"\)/);
  assert.match(app, /context\.metrics\.map\(\(\{ label \}\) => normalizedLabel\(label\)\)/);
  assert.match(app, /\^Relationship \\d\+\$/);
  assert.match(app, /\.slice\(0,\s*TEXT_TRACE_CHANGE_LIMIT\)/);
  assert.match(app, /\.slice\(TEXT_TRACE_CHANGE_LIMIT\)/);
  assert.match(app, /function relationshipRows\(description\)[\s\S]*description\.details/);
  assert.match(app, /\.\.\.relationshipRows\(description\)/, "relationships must remain available in the full canonical snapshot");
  assert.match(
    app,
    /if \(index > 0\)[\s\S]*state\.trace\[index - 1\][\s\S]*deriveTraceChanges/,
    "deltas must use the preceding algorithm step, not whichever step was visited last"
  );
  assert.doesNotMatch(app, /dom\.textTrace\.innerHTML\s*=/, "updating a step must not replace the focused trace subtree");
});


test("manual narration is concise and has one repeat-step action", async () => {
  const app = await readFile(new URL("src/core/app.js", root), "utf8");
  const activeCode = app.slice(
    app.indexOf("function activeCodeText"),
    app.indexOf("function traceSnapshot")
  );
  const announcement = app.slice(
    app.indexOf("function stepSummaryAnnouncement"),
    app.indexOf("function renderActiveLine")
  );

  assert.match(activeCode, /activeCode\.text \?\? activeCode\.spoken/);
  assert.match(activeCode, /Line \$\{activeCode\.line\}: \$\{spokenCode\}/);
  assert.match(announcement, /context\.description\.summary/);
  assert.match(announcement, /activeCodeText\(context\.module, context\.step\)/);
  assert.match(announcement, /primaryCountText\(context\.metrics\)/);
  assert.doesNotMatch(announcement, /context\.changes/, "live speech should not recite the structured field delta");

  const handler = app.match(/dom\.repeatStepButton\.addEventListener\("click",[\s\S]*?\n\s*\}\);/)?.[0] ?? "";
  assert.match(handler, /stopPlayback\(\)/, "Repeat step must pause moving content before speech");
  assert.match(handler, /announce\(/, "Repeat step must send its summary to the live status");
  assert.ok(handler.indexOf("stopPlayback()") < handler.indexOf("announce("), "Repeat step must stop before announcing");
  assert.match(handler, /stepSummaryAnnouncement\(traceContextAt\(\), "Current step"\)/);
});


test("autoplay remains quiet per step but announces start, pause, and completion", async () => {
  const app = await readFile(new URL("src/core/app.js", root), "utf8");
  const finish = app.slice(app.indexOf("function finishPlayback"), app.indexOf("function scheduleNextStep"));
  const scheduler = app.slice(app.indexOf("function scheduleNextStep"), app.indexOf("function togglePlayback"));
  const toggle = app.slice(app.indexOf("function togglePlayback"), app.indexOf("function dispatchActivity"));

  assert.match(scheduler, /goToStep\([^\n]+shouldAnnounce:\s*false/);
  assert.match(finish, /announce\(/, "natural completion needs one status announcement");
  assert.match(scheduler, /finishPlayback\(\)/, "the scheduler must report natural completion");
  assert.match(toggle, /announce\(/, "starting and pausing need status announcements");
  assert.match(`${finish}\n${scheduler}\n${toggle}`, /(?:auto)?play[^\n]*(?:started|playing)/i);
  assert.match(`${finish}\n${scheduler}\n${toggle}`, /(?:paused|pause)/i);
  assert.match(finish, /(?:complete|finished|ended)/i);
});
