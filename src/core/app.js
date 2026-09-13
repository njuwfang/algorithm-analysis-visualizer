import { lectures, routes, resolveRoute, routeHash } from "../lectures/registry.js?v=20260913-9";
import { bounded, escapeHtml } from "./utils.js?v=20260913-2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const dom = {
  body: document.body,
  lessonMain: $("#lessonMain"),
  navToggle: $("#navToggle"),
  navClose: $("#navClose"),
  navBackdrop: $("#navBackdrop"),
  courseNav: $("#courseNav"),
  lectureNavigation: $("#lectureNavigation"),
  topLectureLabel: $("#topLectureLabel"),
  topModuleLabel: $("#topModuleLabel"),
  lessonTitle: $("#lessonTitle"),
  inputForm: $("#inputForm"),
  inputLabel: $("#inputLabel"),
  input: $("#algorithmInput"),
  inputHint: $("#inputHint"),
  inputError: $("#inputError"),
  scenarioSelect: $("#scenarioSelect"),
  modeBlock: $("#modeBlock"),
  modeButtons: $("#modeButtons"),
  visualization: $("#visualization"),
  pseudocode: $("#pseudocode"),
  activeLineBadge: $("#activeLineBadge"),
  stepCounter: $("#stepCounter"),
  traceControls: $("#traceControls"),
  activityControls: $("#activityControls"),
  previousButton: $("#previousButton"),
  playButton: $("#playButton"),
  playIcon: $("#playIcon"),
  playLabel: $("#playLabel"),
  nextButton: $("#nextButton"),
  resetButton: $("#resetButton"),
  stepRange: $("#stepRange"),
  metrics: $("#metrics"),
  stepMessage: $("#stepMessage"),
  formulaPanel: $("#formulaPanel"),
  analysisChecklist: $("#analysisChecklist"),
  previousModuleButton: $("#previousModuleButton"),
  nextModuleButton: $("#nextModuleButton"),
  liveStatus: $("#liveStatus")
};

const TRACE_DELAY = 850;

const state = {
  route: null,
  parsedInput: null,
  trace: [],
  stepIndex: 0,
  mode: "trace",
  activityState: null,
  playing: false,
  timer: null
};

function currentModule() {
  return state.route.module;
}

function currentLecture() {
  return state.route.lecture;
}

function currentStep() {
  return state.trace[state.stepIndex];
}

function announce(message) {
  dom.liveStatus.textContent = "";
  window.requestAnimationFrame(() => {
    dom.liveStatus.textContent = message;
  });
}

function renderCourseNavigation() {
  dom.lectureNavigation.innerHTML = lectures.map((lecture) => {
    const moduleLinks = lecture.modules.map((module) => {
      const key = `${lecture.id}/${module.id}`;
      const selected = state.route?.key === key;
      return `
        <a class="course-module-link ${selected ? "is-active" : ""}" href="${escapeHtml(routeHash({ lecture, module }))}" data-route="${escapeHtml(key)}" ${selected ? 'aria-current="page"' : ""}>
          <span>${escapeHtml(module.shortTitle)}</span>
        </a>`;
    }).join("");

    return `
      <section class="lecture-group ${state.route?.lecture.id === lecture.id ? "is-current" : ""}">
        <div class="lecture-group-heading">
          <span class="lecture-number">${escapeHtml(lecture.number)}</span>
          <div>
            <strong>${escapeHtml(lecture.title)}</strong>
            <small>${lecture.modules.length} algorithm${lecture.modules.length === 1 ? "" : "s"}</small>
          </div>
        </div>
        <div class="course-module-list">${moduleLinks}</div>
      </section>`;
  }).join("");
}

function renderLessonMetadata() {
  const module = currentModule();
  const lecture = currentLecture();
  const routeIndex = routes.findIndex((route) => route.key === state.route.key);

  document.title = `${module.title} · Analysis of Algorithms`;
  dom.topLectureLabel.textContent = `Lecture ${lecture.number}`;
  dom.topModuleLabel.textContent = lecture.title;
  dom.lessonTitle.textContent = module.title;

  const previous = routes[routeIndex - 1] ?? null;
  const next = routes[routeIndex + 1] ?? null;
  renderPagerButton(dom.previousModuleButton, previous, "Previous");
  renderPagerButton(dom.nextModuleButton, next, "Next");
}

function renderPagerButton(button, route, direction) {
  const pointsBackward = direction === "Previous";
  const arrow = pointsBackward ? "←" : "→";
  const destination = route?.module.shortTitle ?? (pointsBackward ? "Start" : "End");
  const copy = `
    <span class="top-pager-copy">
      <small class="top-pager-direction">${direction}</small>
      <strong class="top-pager-name">${escapeHtml(destination)}</strong>
    </span>`;
  const content = `
    ${pointsBackward ? `<span aria-hidden="true">${arrow}</span>` : ""}
    ${copy}
    ${pointsBackward ? "" : `<span aria-hidden="true">${arrow}</span>`}`;

  if (!route) {
    button.disabled = true;
    button.dataset.route = "";
    button.setAttribute("aria-label", `No ${direction.toLowerCase()} algorithm`);
    button.title = `No ${direction.toLowerCase()} algorithm`;
    button.innerHTML = content;
    return;
  }

  button.disabled = false;
  button.dataset.route = route.key;
  const label = `${direction}: ${route.module.title}`;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = content;
}

function renderInputArea() {
  const module = currentModule();
  dom.inputLabel.textContent = module.input.label;
  dom.inputHint.textContent = module.input.hint;
  dom.input.value = module.input.default;
  dom.scenarioSelect.innerHTML = `
    <option value="">Custom input</option>
    ${module.input.presets.map((preset) => `
      <option value="${escapeHtml(preset.value)}">${escapeHtml(preset.label)}</option>`).join("")}`;
  dom.scenarioSelect.value = module.input.default;

  dom.modeBlock.hidden = !module.activity;
  if (module.activity) {
    dom.modeButtons.innerHTML = [
      { id: "trace", label: "Trace" },
      { id: module.activity.id, label: module.activity.label }
    ].map((mode) => `
      <button class="segment ${state.mode === mode.id ? "is-active" : ""}" type="button" data-mode="${escapeHtml(mode.id)}" aria-pressed="${state.mode === mode.id}">${escapeHtml(mode.label)}</button>`).join("");
  } else {
    dom.modeButtons.innerHTML = "";
  }
}

function renderPseudocode() {
  const module = currentModule();
  dom.pseudocode.innerHTML = module.pseudocode.map((line) => `
    <li class="code-line ${line.indent ? `code-indent-${line.indent}` : ""} ${line.basic ? "is-basic" : ""}" data-code-line="${line.line}" data-line-number="${line.line}">
      <span class="code-text">${escapeHtml(line.text)}</span>
      ${line.basic ? '<span class="basic-operation-label">basic operation</span>' : ""}
    </li>`).join("");
}

function renderAnalysisChecklist() {
  dom.analysisChecklist.innerHTML = currentModule().analysis.map(({ term, value }) => `
    <dt>${escapeHtml(term)}</dt>
    <dd>${escapeHtml(value)}</dd>`).join("");
}

function renderFormula(model) {
  dom.formulaPanel.innerHTML = `
    <div class="formula-main"></div>
    <div class="formula-notes">
      ${model.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
    </div>`;

  const formula = $(".formula-main", dom.formulaPanel);
  if (!window.katex?.render) {
    formula.textContent = model.latex;
    return;
  }

  window.katex.render(model.latex, formula, {
    displayMode: true,
    output: "htmlAndMathml",
    strict: "warn",
    throwOnError: false,
    trust: false
  });
}

function renderMetrics(metrics) {
  dom.metrics.innerHTML = metrics.map((metric) => `
    <div class="metric ${metric.emphasis ? "is-emphasis" : ""}">
      <dt>${escapeHtml(metric.label)}</dt>
      <dd>${escapeHtml(metric.value)}</dd>
    </div>`).join("");
}

function renderActiveLine(activeLine, activeLabel = null) {
  let activeElement = null;
  $$(".code-line", dom.pseudocode).forEach((line) => {
    const active = Number(line.dataset.codeLine) === activeLine;
    line.classList.toggle("is-active", active);
    if (active) activeElement = line;
  });

  if (state.mode !== "trace") {
    dom.activeLineBadge.textContent = "Practice";
  } else if (activeLabel) {
    dom.activeLineBadge.textContent = activeLabel;
  } else if (activeLine) {
    dom.activeLineBadge.textContent = `Line ${activeLine}`;
  } else {
    dom.activeLineBadge.textContent = "Complete";
  }

  if (activeElement) {
    window.requestAnimationFrame(() => {
      const container = dom.pseudocode.getBoundingClientRect();
      const target = activeElement.getBoundingClientRect();
      const gap = 12;
      if (target.top < container.top + gap) {
        dom.pseudocode.scrollTop += target.top - container.top - gap;
      } else if (target.bottom > container.bottom - gap) {
        dom.pseudocode.scrollTop += target.bottom - container.bottom + gap;
      }
    });
  }
}

function renderActivityControls() {
  const activity = currentModule().activity;
  const controls = activity?.controls?.(state.activityState) ?? [];
  dom.activityControls.innerHTML = controls.map((control) => `
    <button class="button ${control.variant === "primary" ? "button-primary" : "button-quiet"}" type="button" data-activity-action="${escapeHtml(control.action)}" ${control.disabled ? "disabled" : ""}>${escapeHtml(control.label)}</button>`).join("");
}

function revealActiveVisualization() {
  const active = $(
    ".array-item.is-current, .matrix-cell.is-current, .ladder-row.is-active, .recursion-frame.is-active, .recurrence-step.is-active, .hanoi-call-frame.is-active",
    dom.visualization
  );
  if (!active) return;

  window.requestAnimationFrame(() => {
    const nestedScroller = active.closest(".hanoi-call-list");
    if (nestedScroller) {
      const nestedBounds = nestedScroller.getBoundingClientRect();
      const activeBounds = active.getBoundingClientRect();
      const nestedGap = 6;

      if (activeBounds.left < nestedBounds.left + nestedGap) {
        nestedScroller.scrollLeft += activeBounds.left - nestedBounds.left - nestedGap;
      } else if (activeBounds.right > nestedBounds.right - nestedGap) {
        nestedScroller.scrollLeft += activeBounds.right - nestedBounds.right + nestedGap;
      }
    }

    const container = dom.visualization.getBoundingClientRect();
    const target = active.getBoundingClientRect();
    const verticalGap = 18;
    const horizontalGap = 12;

    if (target.top < container.top + verticalGap) {
      dom.visualization.scrollTop += target.top - container.top - verticalGap;
    } else if (target.bottom > container.bottom - verticalGap) {
      dom.visualization.scrollTop += target.bottom - container.bottom + verticalGap;
    }

    if (target.left < container.left + horizontalGap) {
      dom.visualization.scrollLeft += target.left - container.left - horizontalGap;
    } else if (target.right > container.right - horizontalGap) {
      dom.visualization.scrollLeft += target.right - container.right + horizontalGap;
    }
  });
}

function renderCurrent({ shouldAnnounce = false } = {}) {
  const module = currentModule();
  const activityMode = state.mode !== "trace" && module.activity;
  const focusedActivityValue = document.activeElement?.closest?.("[data-activity-value]")?.dataset.activityValue;

  dom.traceControls.hidden = Boolean(activityMode);
  dom.activityControls.hidden = !activityMode;

  if (activityMode) {
    const activity = module.activity;
    dom.visualization.innerHTML = activity.render(state.activityState);
    renderMetrics(activity.metrics(state.activityState));
    renderFormula(module.model(state.activityState));
    renderActiveLine(null);
    renderActivityControls();
    dom.stepCounter.textContent = "Practice mode";
    dom.stepMessage.textContent = state.activityState.message;
    if (focusedActivityValue !== undefined) {
      window.requestAnimationFrame(() => {
        $$('[data-activity-value]', dom.visualization)
          .find((target) => target.dataset.activityValue === focusedActivityValue)
          ?.focus();
      });
    }
    if (shouldAnnounce) announce(state.activityState.message);
    return;
  }

  const step = currentStep();
  dom.visualization.innerHTML = module.render(step);
  renderMetrics(module.metrics(step));
  renderFormula(module.model(step));
  renderActiveLine(step.activeLine, step.activeLabel);
  dom.stepCounter.textContent = `Step ${state.stepIndex + 1} / ${state.trace.length}`;
  dom.stepMessage.textContent = step.message;
  dom.stepRange.max = Math.max(0, state.trace.length - 1);
  dom.stepRange.value = state.stepIndex;
  dom.stepRange.setAttribute("aria-valuetext", `Step ${state.stepIndex + 1} of ${state.trace.length}`);
  dom.previousButton.disabled = state.stepIndex === 0;
  dom.nextButton.disabled = state.stepIndex >= state.trace.length - 1;
  revealActiveVisualization();
  if (shouldAnnounce) announce(step.message);
}

function clearInputError() {
  dom.inputError.hidden = true;
  dom.inputError.textContent = "";
  dom.input.removeAttribute("aria-invalid");
}

function showInputError(message) {
  dom.inputError.hidden = false;
  dom.inputError.textContent = message;
  dom.input.setAttribute("aria-invalid", "true");
}

function applyInput(raw = dom.input.value) {
  stopPlayback();
  const module = currentModule();

  try {
    const parsed = module.input.parse(raw);
    state.parsedInput = parsed;
    state.trace = module.buildTrace(parsed);
    state.stepIndex = 0;
    state.activityState = module.activity ? module.activity.create(parsed) : null;
    clearInputError();
    renderCurrent({ shouldAnnounce: true });
  } catch (error) {
    showInputError(error instanceof Error ? error.message : "The input could not be read.");
  }
}

function setMode(mode) {
  const module = currentModule();
  const allowed = mode === "trace" || (module.activity && mode === module.activity.id);
  if (!allowed) return;

  stopPlayback();
  state.mode = mode;
  if (mode !== "trace") state.activityState = module.activity.create(state.parsedInput);
  renderInputModeButtons();
  renderCurrent({ shouldAnnounce: true });
}

function renderInputModeButtons() {
  $$("[data-mode]", dom.modeButtons).forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function goToStep(index, { shouldAnnounce = true } = {}) {
  state.stepIndex = bounded(index, 0, state.trace.length - 1);
  renderCurrent({ shouldAnnounce });
}

function stopPlayback() {
  state.playing = false;
  if (state.timer) {
    window.clearTimeout(state.timer);
    state.timer = null;
  }
  dom.playIcon.textContent = "▶";
  dom.playLabel.textContent = "Play";
  dom.playButton.setAttribute("aria-label", "Play trace");
}

function scheduleNextStep() {
  if (!state.playing) return;
  state.timer = window.setTimeout(() => {
    if (state.stepIndex >= state.trace.length - 1) {
      stopPlayback();
      return;
    }
    goToStep(state.stepIndex + 1, { shouldAnnounce: false });
    scheduleNextStep();
  }, TRACE_DELAY);
}

function togglePlayback() {
  if (state.mode !== "trace") return;
  if (state.playing) {
    stopPlayback();
    return;
  }

  if (state.stepIndex >= state.trace.length - 1) goToStep(0, { shouldAnnounce: false });
  state.playing = true;
  dom.playIcon.textContent = "❚❚";
  dom.playLabel.textContent = "Pause";
  dom.playButton.setAttribute("aria-label", "Pause trace");
  scheduleNextStep();
}

function dispatchActivity(action) {
  const activity = currentModule().activity;
  if (!activity || state.mode === "trace") return;
  state.activityState = activity.reduce(state.activityState, action);
  renderCurrent({ shouldAnnounce: true });
}

function setRoute(route, { updateUrl = true } = {}) {
  if (!route) return;
  stopPlayback();
  state.route = route;
  state.mode = "trace";
  state.activityState = null;

  renderCourseNavigation();
  renderLessonMetadata();
  renderInputArea();
  renderPseudocode();
  renderAnalysisChecklist();
  clearInputError();
  applyInput(route.module.input.default);

  if (updateUrl) {
    const hash = routeHash(route);
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
  }

  setNavigationOpen(false);
}

function openRouteKey(key) {
  const route = routes.find((candidate) => candidate.key === key);
  if (route) setRoute(route);
}

function setNavigationOpen(open, { restoreFocus = false } = {}) {
  dom.body.classList.toggle("nav-open", open);
  dom.navToggle.setAttribute("aria-expanded", String(open));
  dom.navToggle.setAttribute("aria-label", open ? "Close lecture navigation" : "Open lecture navigation");
  dom.courseNav.setAttribute("aria-hidden", String(!open));
  dom.courseNav.inert = !open;
  if (open) dom.navClose.focus();
  if (!open && restoreFocus) dom.navToggle.focus();
}

function bindEvents() {
  dom.lectureNavigation.addEventListener("click", (event) => {
    const link = event.target.closest("[data-route]");
    if (link) {
      setNavigationOpen(false);
      dom.lessonMain.focus({ preventScroll: true });
    }
  });

  [dom.previousModuleButton, dom.nextModuleButton].forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled && button.dataset.route) openRouteKey(button.dataset.route);
    });
  });

  dom.inputForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyInput();
  });

  dom.input.addEventListener("input", () => {
    if (dom.input.value !== dom.scenarioSelect.value) dom.scenarioSelect.value = "";
  });

  dom.scenarioSelect.addEventListener("change", () => {
    if (!dom.scenarioSelect.value) return;
    dom.input.value = dom.scenarioSelect.value;
    applyInput(dom.scenarioSelect.value);
  });

  dom.modeButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (button) setMode(button.dataset.mode);
  });

  dom.previousButton.addEventListener("click", () => {
    stopPlayback();
    goToStep(state.stepIndex - 1);
  });
  dom.nextButton.addEventListener("click", () => {
    stopPlayback();
    goToStep(state.stepIndex + 1);
  });
  dom.resetButton.addEventListener("click", () => {
    stopPlayback();
    goToStep(0);
  });
  dom.playButton.addEventListener("click", togglePlayback);
  dom.stepRange.addEventListener("input", () => {
    stopPlayback();
    goToStep(Number(dom.stepRange.value), { shouldAnnounce: false });
  });
  [dom.visualization, dom.activityControls].forEach((container) => {
    container.addEventListener("click", (event) => {
      const target = event.target.closest("[data-activity-action]");
      if (!target) return;
      dispatchActivity({ type: target.dataset.activityAction, value: target.dataset.activityValue });
    });
  });

  dom.visualization.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const target = event.target.closest("[data-activity-action]");
    if (!target) return;
    event.preventDefault();
    dispatchActivity({ type: target.dataset.activityAction, value: target.dataset.activityValue });
  });

  dom.navToggle.addEventListener("click", () => {
    const open = !dom.body.classList.contains("nav-open");
    setNavigationOpen(open, { restoreFocus: !open });
  });
  dom.navClose.addEventListener("click", () => setNavigationOpen(false, { restoreFocus: true }));
  dom.navBackdrop.addEventListener("click", () => setNavigationOpen(false, { restoreFocus: true }));

  window.addEventListener("hashchange", () => {
    const route = resolveRoute({ hash: window.location.hash, search: window.location.search });
    if (route.key !== state.route.key) setRoute(route, { updateUrl: false });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dom.body.classList.contains("nav-open")) {
      setNavigationOpen(false, { restoreFocus: true });
      return;
    }

    if (event.key === "Tab" && dom.body.classList.contains("nav-open")) {
      const focusable = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', dom.courseNav);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.target.closest("input, button, textarea, select, summary, a, [role='button']")) return;

    if (state.mode !== "trace") return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stopPlayback();
      goToStep(state.stepIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      stopPlayback();
      goToStep(state.stepIndex - 1);
    } else if (event.key === " ") {
      event.preventDefault();
      togglePlayback();
    }
  });
}

export function startApp() {
  bindEvents();
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") dom.body.classList.add("embed-mode");

  const initialRoute = resolveRoute({ hash: window.location.hash, search: window.location.search });
  setRoute(initialRoute, { updateUrl: false });
  document.documentElement.dataset.appReady = "true";

  window.AlgorithmLab = Object.freeze({
    routes: routes.map((route) => route.key),
    open: openRouteKey,
    getState: () => ({
      route: state.route.key,
      mode: state.mode,
      stepIndex: state.stepIndex,
      traceLength: state.trace.length
    })
  });
}
