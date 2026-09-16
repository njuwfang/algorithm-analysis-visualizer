import test from "node:test";
import assert from "node:assert/strict";
import { lectures, neighboringRoutes, routes, resolveRoute, routeHash } from "../src/lectures/registry.js";


test("registry exposes unique lecture/module routes", () => {
  assert.ok(lectures.length >= 1);
  assert.ok(routes.length >= 3);
  const keys = routes.map((route) => route.key);
  assert.equal(new Set(keys).size, keys.length);
  const publishedLecture03Routes = [
    "03-analysis/binary-iterative",
    "03-analysis/hanoi",
    "03-analysis/binary-recursive",
    "03-analysis/master-theorem"
  ];
  const expectedRoutes = [
    ...publishedLecture03Routes,
    "04-brute-force/selection-sort",
    "04-brute-force/bubble-sort",
    "04-brute-force/string-matching",
    "04-brute-force/closest-pair",
    "05-exhaustive-search/traveling-salesman",
    "05-exhaustive-search/exhaustive-knapsack",
    "05-exhaustive-search/assignment"
  ];
  assert.deepEqual(keys, expectedRoutes);
  assert.ok(!keys.includes("03-analysis/max-element"));
  assert.ok(!keys.includes("03-analysis/unique-element"));
});

test("previous and next routes stay inside the current lecture", () => {
  for (const lecture of lectures) {
    const lectureRoutes = routes.filter((route) => route.lecture.id === lecture.id);

    for (const [index, route] of lectureRoutes.entries()) {
      const { previous, next } = neighboringRoutes(route);
      assert.equal(previous?.key ?? null, lectureRoutes[index - 1]?.key ?? null);
      assert.equal(next?.key ?? null, lectureRoutes[index + 1]?.key ?? null);
      assert.ok(!previous || previous.lecture.id === lecture.id);
      assert.ok(!next || next.lecture.id === lecture.id);
    }
  }
});


test("canonical, legacy, and query routes resolve", () => {
  for (const route of routes) {
    assert.equal(resolveRoute({ hash: routeHash(route) }).key, route.key);
    assert.equal(resolveRoute({ hash: `${routeHash(route)}/` }).key, route.key);
    assert.equal(resolveRoute({ hash: `#${route.module.id}` }).key, route.key);
    assert.equal(resolveRoute({ search: `?module=${route.module.id}` }).key, route.key);
    assert.equal(
      resolveRoute({ search: `?lecture=${route.lecture.id}&module=${route.module.id}` }).key,
      route.key
    );
  }
});


test("invalid routes fall back and canonical hashes take precedence", () => {
  assert.equal(resolveRoute({ hash: "#/missing/route" }).key, routes[0].key);
  assert.equal(
    resolveRoute({ hash: routeHash(routes[0]), search: `?module=${routes.at(-1).module.id}` }).key,
    routes[0].key
  );
});


test("every module builds its default trace", () => {
  for (const { module } of routes) {
    const input = module.input.parse(module.input.default);
    const trace = module.buildTrace(input);
    assert.ok(trace.length > 0, module.id);
    assert.equal(typeof trace.at(-1).message, "string", module.id);
  }
});
