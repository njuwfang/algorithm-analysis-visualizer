import { lecture03 } from "./03-analysis/index.js?v=20260915-5";
import { validateRegistry } from "../core/schema.js?v=20260915-5";

export const lectures = [lecture03];
validateRegistry(lectures);

export const routes = lectures.flatMap((lecture) =>
  lecture.modules.map((module) => ({
    lecture,
    module,
    key: `${lecture.id}/${module.id}`
  }))
);

export const routeMap = new Map(routes.map((route) => [route.key, route]));
export const moduleIdMap = new Map(routes.map((route) => [route.module.id, route]));

export function firstRoute() {
  return routes[0];
}

export function resolveRoute({ hash = "", search = "" } = {}) {
  const params = new URLSearchParams(search);
  const requestedLecture = params.get("lecture");
  const requestedModule = params.get("module");
  const cleanHash = hash.replace(/^#\/?/, "").replace(/\/$/, "");

  // A hash becomes the canonical route as soon as navigation supplies one.
  // Query parameters remain useful for an initial embedded URL.
  if (cleanHash.includes("/")) {
    const direct = routeMap.get(cleanHash);
    if (direct) return direct;
  }

  if (cleanHash && moduleIdMap.has(cleanHash)) {
    return moduleIdMap.get(cleanHash);
  }

  if (requestedLecture && requestedModule) {
    const direct = routeMap.get(`${requestedLecture}/${requestedModule}`);
    if (direct) return direct;
  }

  if (requestedModule && moduleIdMap.has(requestedModule)) {
    return moduleIdMap.get(requestedModule);
  }

  return firstRoute();
}

export function routeHash(route) {
  return `#/${route.lecture.id}/${route.module.id}`;
}
