const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedLabels(rows) {
  return rows.map(({ label }) => label.trim().toLowerCase());
}

function validateStableLabels(labels, expected, prefix) {
  const stable = labels.length === expected.length
    && labels.every((label, index) => label === expected[index]);
  assert(
    stable,
    `${prefix} labels must remain stable across trace states; expected [${expected.join(", ")}], received [${labels.join(", ")}].`
  );
}

function validateMetrics(metrics, prefix) {
  assert(Array.isArray(metrics) && metrics.length > 0, `${prefix} must return a non-empty array.`);
  const labels = new Set();
  for (const [index, metric] of metrics.entries()) {
    assert(typeof metric?.label === "string" && metric.label.trim(), `${prefix}[${index}].label is required.`);
    const label = metric.label.trim().toLowerCase();
    assert(!labels.has(label), `${prefix} has duplicate label "${metric.label}".`);
    labels.add(label);
    assert(metric.value !== undefined && metric.value !== null, `${prefix}[${index}].value is required.`);
    if (metric.emphasis !== undefined) {
      assert(typeof metric.emphasis === "boolean", `${prefix}[${index}].emphasis must be a boolean.`);
    }
  }
}

function validateModel(model, prefix) {
  assert(typeof model?.latex === "string" && model.latex.trim(), `${prefix}.latex is required.`);
  assert(Array.isArray(model?.notes), `${prefix}.notes must be an array.`);
  for (const [index, note] of model.notes.entries()) {
    assert(typeof note === "string" && note.trim(), `${prefix}.notes[${index}] must be a non-empty string.`);
  }
}

function validateDescription(description, prefix) {
  assert(typeof description?.summary === "string" && description.summary.trim(), `${prefix}.summary is required.`);
  assert(Array.isArray(description?.state) && description.state.length > 0, `${prefix}.state must be a non-empty array.`);
  const labels = new Set();
  for (const [index, item] of description.state.entries()) {
    assert(typeof item?.label === "string" && item.label.trim(), `${prefix}.state[${index}].label is required.`);
    const label = item.label.trim().toLowerCase();
    assert(!labels.has(label), `${prefix}.state has duplicate label "${item.label}".`);
    labels.add(label);
    assert(typeof item?.value === "string" && item.value.trim(), `${prefix}.state[${index}].value is required.`);
  }
  if (description.details !== undefined) {
    assert(Array.isArray(description.details), `${prefix}.details must be an array.`);
    for (const [index, detail] of description.details.entries()) {
      assert(typeof detail === "string" && detail.trim(), `${prefix}.details[${index}] must be a non-empty string.`);
    }
  }
}

export function validateModule(module, lectureId) {
  const prefix = `Module ${lectureId}/${module?.id ?? "<unknown>"}`;
  assert(module && typeof module === "object", `${prefix} must be an object.`);
  assert(ID_PATTERN.test(module.id), `${prefix} has an invalid id.`);

  for (const key of ["title", "shortTitle", "summary", "complexity", "objective"]) {
    assert(typeof module[key] === "string" && module[key].trim(), `${prefix}.${key} is required.`);
  }
  if (module.codeTitle !== undefined) {
    assert(typeof module.codeTitle === "string" && module.codeTitle.trim(), `${prefix}.codeTitle must be a non-empty string.`);
  }

  assert(module.source && typeof module.source.slides === "string" && module.source.slides.trim(), `${prefix}.source.slides is required.`);
  assert(module.input && typeof module.input === "object", `${prefix}.input is required.`);
  assert(typeof module.input.label === "string" && module.input.label.trim(), `${prefix}.input.label is required.`);
  assert(typeof module.input.hint === "string" && module.input.hint.trim(), `${prefix}.input.hint is required.`);
  assert(typeof module.input.parse === "function", `${prefix}.input.parse must be a function.`);
  assert(typeof module.input.default === "string", `${prefix}.input.default must be a string.`);
  assert(Array.isArray(module.input.presets), `${prefix}.input.presets must be an array.`);
  assert(Array.isArray(module.pseudocode) && module.pseudocode.length > 0, `${prefix}.pseudocode is required.`);
  assert(typeof module.buildTrace === "function", `${prefix}.buildTrace must be a function.`);
  assert(typeof module.render === "function", `${prefix}.render must be a function.`);
  assert(typeof module.describe === "function", `${prefix}.describe must be a function.`);
  assert(typeof module.metrics === "function", `${prefix}.metrics must be a function.`);
  assert(typeof module.model === "function", `${prefix}.model must be a function.`);
  assert(Array.isArray(module.analysis) && module.analysis.length > 0, `${prefix}.analysis is required.`);

  const presetValues = new Set();
  for (const [index, preset] of module.input.presets.entries()) {
    assert(typeof preset?.label === "string" && preset.label.trim(), `${prefix}.input.presets[${index}].label is required.`);
    assert(typeof preset?.value === "string", `${prefix}.input.presets[${index}].value must be a string.`);
    assert(!presetValues.has(preset.value), `${prefix}.input.presets has duplicate value "${preset.value}".`);
    presetValues.add(preset.value);
    module.input.parse(preset.value);
  }

  const pseudocodeLines = new Set();
  let hasBasicOperation = false;
  for (const [index, line] of module.pseudocode.entries()) {
    assert(Number.isInteger(line?.line), `${prefix}.pseudocode[${index}].line must be an integer.`);
    assert(!pseudocodeLines.has(line.line), `${prefix} has duplicate pseudocode line ${line.line}.`);
    const hasText = typeof line.text === "string" && line.text.trim();
    const hasLatex = typeof line.latex === "string" && line.latex.trim();
    assert(hasText || hasLatex, `${prefix}.pseudocode[${index}] needs text or latex.`);
    assert(!(hasText && hasLatex), `${prefix}.pseudocode[${index}] cannot define both text and latex.`);
    if (hasLatex) {
      assert(
        typeof line.spoken === "string" && line.spoken.trim(),
        `${prefix}.pseudocode[${index}].spoken is required for a latex line.`
      );
    }
    if (line.basicLabel !== undefined) {
      assert(line.basic === true, `${prefix}.pseudocode[${index}].basicLabel requires basic: true.`);
      assert(typeof line.basicLabel === "string" && line.basicLabel.trim(), `${prefix}.pseudocode[${index}].basicLabel must be a non-empty string.`);
    }
    pseudocodeLines.add(line.line);
    hasBasicOperation ||= line.basic === true;
  }
  assert(hasBasicOperation, `${prefix} must mark its counted basic operation.`);

  for (const [index, item] of module.analysis.entries()) {
    assert(typeof item?.term === "string" && item.term.trim(), `${prefix}.analysis[${index}].term is required.`);
    assert(typeof item?.value === "string" && item.value.trim(), `${prefix}.analysis[${index}].value is required.`);
  }

  if (module.activity) {
    assert(typeof module.activity.id === "string" && ID_PATTERN.test(module.activity.id), `${prefix}.activity.id is invalid.`);
    assert(typeof module.activity.label === "string" && module.activity.label.trim(), `${prefix}.activity.label is required.`);
    assert(typeof module.activity.create === "function", `${prefix}.activity.create must be a function.`);
    assert(typeof module.activity.render === "function", `${prefix}.activity.render must be a function.`);
    assert(typeof module.activity.describe === "function", `${prefix}.activity.describe must be a function.`);
    assert(typeof module.activity.reduce === "function", `${prefix}.activity.reduce must be a function.`);
    assert(typeof module.activity.metrics === "function", `${prefix}.activity.metrics must be a function.`);
    assert(typeof module.activity.controls === "function", `${prefix}.activity.controls must be a function.`);
  }

  const parsed = module.input.parse(module.input.default);
  const trace = module.buildTrace(parsed);
  assert(Array.isArray(trace) && trace.length > 0, `${prefix}.buildTrace returned no states.`);
  let expectedStateLabels = null;
  let expectedMetricLabels = null;
  for (const [index, state] of trace.entries()) {
    assert(typeof state.message === "string" && state.message.trim(), `${prefix} trace state ${index} needs a non-empty message.`);
    if (state.activeLabel !== undefined) {
      assert(typeof state.activeLabel === "string" && state.activeLabel.trim(), `${prefix} trace state ${index} has an invalid activeLabel.`);
    }
    if (state.activeLine !== null && state.activeLine !== undefined) {
      assert(pseudocodeLines.has(state.activeLine), `${prefix} trace state ${index} references missing pseudocode line ${state.activeLine}.`);
    }

    const renderedState = module.render(state);
    assert(typeof renderedState === "string" && renderedState.trim(), `${prefix}.render must return HTML for trace state ${index}.`);

    const metrics = module.metrics(state);
    const description = module.describe(state);
    validateMetrics(metrics, `${prefix}.metrics for trace state ${index}`);
    validateDescription(description, `${prefix}.describe for trace state ${index}`);

    const stateLabels = normalizedLabels(description.state);
    const metricLabels = normalizedLabels(metrics);
    if (index === 0) {
      expectedStateLabels = stateLabels;
      expectedMetricLabels = metricLabels;
    } else {
      validateStableLabels(stateLabels, expectedStateLabels, `${prefix}.describe for trace state ${index}`);
      validateStableLabels(metricLabels, expectedMetricLabels, `${prefix}.metrics for trace state ${index}`);
    }

    const metricsByLabel = new Map(metrics.map((metric) => [
      metric.label.trim().toLowerCase(),
      metric
    ]));
    for (const row of description.state) {
      const metric = metricsByLabel.get(row.label.trim().toLowerCase());
      assert(
        !metric || row.value === String(metric.value),
        `${prefix}.describe for trace state ${index} reuses metric label "${row.label}" with a different value.`
      );
    }

    validateModel(module.model(state), `${prefix}.model for trace state ${index}`);
  }

  if (module.activity) {
    const activityState = module.activity.create(parsed);
    assert(
      activityState && typeof activityState === "object" && !Array.isArray(activityState),
      `${prefix}.activity.create must return a state object.`
    );
    assert(
      typeof activityState.message === "string" && activityState.message.trim(),
      `${prefix}.activity.create state needs message.`
    );
    const renderedActivity = module.activity.render(activityState);
    assert(typeof renderedActivity === "string" && renderedActivity.trim(), `${prefix}.activity.render must return HTML.`);

    const activityMetrics = module.activity.metrics(activityState);
    validateMetrics(activityMetrics, `${prefix}.activity.metrics`);
    validateDescription(module.activity.describe(activityState), `${prefix}.activity.describe`);
    validateModel(module.model(activityState), `${prefix}.model for activity state`);

    const activityControls = module.activity.controls(activityState);
    assert(Array.isArray(activityControls), `${prefix}.activity.controls must return an array.`);
    for (const [index, control] of activityControls.entries()) {
      assert(
        typeof control?.action === "string" && control.action.trim(),
        `${prefix}.activity.controls[${index}].action is required.`
      );
      assert(
        typeof control?.label === "string" && control.label.trim(),
        `${prefix}.activity.controls[${index}].label is required.`
      );
      if (control.disabled !== undefined) {
        assert(
          typeof control.disabled === "boolean",
          `${prefix}.activity.controls[${index}].disabled must be a boolean.`
        );
      }
      if (control.variant !== undefined) {
        assert(
          control.variant === "primary" || control.variant === "quiet",
          `${prefix}.activity.controls[${index}].variant must be "primary" or "quiet".`
        );
      }
    }
  }

  return true;
}

export function validateRegistry(lectures) {
  assert(Array.isArray(lectures) && lectures.length > 0, "The lecture registry is empty.");
  const lectureIds = new Set();
  const routeKeys = new Set();
  const moduleIds = new Set();

  for (const lecture of lectures) {
    assert(ID_PATTERN.test(lecture.id), `Lecture id "${lecture.id}" is invalid.`);
    assert(!lectureIds.has(lecture.id), `Duplicate lecture id "${lecture.id}".`);
    lectureIds.add(lecture.id);
    assert(typeof lecture.number === "string" && lecture.number.trim(), `Lecture ${lecture.id} needs a number.`);
    assert(typeof lecture.title === "string" && lecture.title.trim(), `Lecture ${lecture.id} needs a title.`);
    assert(typeof lecture.shortTitle === "string" && lecture.shortTitle.trim(), `Lecture ${lecture.id} needs a shortTitle.`);
    assert(typeof lecture.summary === "string" && lecture.summary.trim(), `Lecture ${lecture.id} needs a summary.`);
    assert(
      Array.isArray(lecture.workflow) && lecture.workflow.join("|") === "Trace|Count|Generalize",
      `Lecture ${lecture.id} must use the Trace → Count → Generalize workflow.`
    );
    assert(Array.isArray(lecture.modules) && lecture.modules.length > 0, `Lecture ${lecture.id} has no modules.`);

    for (const module of lecture.modules) {
      validateModule(module, lecture.id);
      const key = `${lecture.id}/${module.id}`;
      assert(!routeKeys.has(key), `Duplicate module route "${key}".`);
      assert(!moduleIds.has(module.id), `Duplicate module id "${module.id}" breaks legacy short routes.`);
      routeKeys.add(key);
      moduleIds.add(module.id);
    }
  }

  return true;
}
