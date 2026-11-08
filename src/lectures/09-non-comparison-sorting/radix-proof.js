// Explanatory projection only: these checks and retained groups do not move keys.
const ordered = values => values.every((value, index) => index === 0 || values[index - 1] <= value);

export function projectRadixProof(step) {
  const active = step.pass > 0;
  const checkpoint = ["pass-complete", "complete"].includes(step.phase);
  const priorDigits = Math.max(0, step.pass - 1);
  const groups = Array.from({ length: 10 }, (_, digit) => ({ digit, items: [] }));
  if (active) for (const item of step.passInput.slice(0, step.inspected)) {
    groups[Math.floor(item.value / step.place) % 10].items.push(item);
  }
  // Prefer the active group when it demonstrates a relationship; otherwise use
  // the largest observed group. Never expose a key before it has been enqueued.
  const current = step.bin === null ? null : groups[step.bin];
  const largest = groups.reduce((best, group) => group.items.length > best.items.length ? group : best, groups[0]);
  const witness = current?.items.length > 1 ? current : largest.items.length ? largest : null;
  const lower = witness ? witness.items.map(item => item.value % step.place) : [];
  const suffixes = active ? step.gathered.map(item => item.value % (step.place * 10)) : [];
  const premise = active && ordered(step.passInput.map(item => item.value % step.place));
  const fullOutput = checkpoint && step.gathered.length === step.original.length;
  const gatheredIds = step.gathered.map(item => item.origin);
  const sameItems = fullOutput && new Set(gatheredIds).size === step.original.length
    && step.original.every(item => step.gathered.some(actual => actual.origin === item.origin && actual.value === item.value));
  const adopted = fullOutput && step.order.length === step.gathered.length
    && step.order.every((item, index) => item.origin === step.gathered[index].origin && item.value === step.gathered[index].value);
  const stableGroups = groups.every(group => {
    const actual = step.gathered.filter(item => Math.floor(item.value / step.place) % 10 === group.digit);
    return actual.every((item, index) => item.origin === group.items[index]?.origin);
  });
  const verified = fullOutput && sameItems && adopted && premise && stableGroups && ordered(suffixes);
  return { active, checkpoint, priorDigits, groups, witness, lower, suffixes, premise, stableGroups, verified };
}
