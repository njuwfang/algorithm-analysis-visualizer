import { lectures } from "../src/lectures/registry.js";
import { validateRegistry } from "../src/core/schema.js";

validateRegistry(lectures);

const summary = lectures.map((lecture) => {
  const modules = lecture.modules.map((module) => {
    const parsed = module.input.parse(module.input.default);
    const trace = module.buildTrace(parsed);
    if (module.activity) {
      const activityState = module.activity.create(parsed);
      module.activity.metrics(activityState);
      module.activity.render(activityState);
    }
    module.metrics(trace[0]);
    module.model(trace[0]);
    module.render(trace[0]);
    return `${module.id} (${trace.length} states)`;
  });
  return `Lecture ${lecture.number}: ${modules.join(", ")}`;
});

console.log("Registry valid.");
for (const line of summary) console.log(line);
