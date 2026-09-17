function normalizedLabel(label) {
  return String(label).trim().toLowerCase();
}

function snapshotKey(row) {
  return normalizedLabel(row.key ?? row.label);
}

function indexSnapshot(snapshot, name) {
  const rows = new Map();
  for (const row of snapshot ?? []) {
    const key = snapshotKey(row);
    if (rows.has(key)) throw new Error(`${name} contains duplicate label "${row.label}".`);
    rows.set(key, { label: String(row.label), value: String(row.value) });
  }
  return rows;
}

export function deriveTraceChanges(previousSnapshot, currentSnapshot) {
  if (!previousSnapshot) return [];

  const previous = indexSnapshot(previousSnapshot, "Previous trace snapshot");
  const current = indexSnapshot(currentSnapshot, "Current trace snapshot");
  const changes = [];

  for (const row of currentSnapshot) {
    const key = snapshotKey(row);
    const before = previous.get(key);
    const after = String(row.value);
    if (!before || before.value !== after) {
      changes.push({
        label: String(row.label),
        from: before?.value ?? null,
        to: after
      });
    }
  }

  for (const row of previousSnapshot) {
    if (!current.has(snapshotKey(row))) {
      changes.push({
        label: String(row.label),
        from: String(row.value),
        to: null
      });
    }
  }

  return changes;
}

export function formatTraceChanges(changes) {
  if (!changes.length) return "No state changes.";
  return changes.map(({ label, from, to }) => {
    if (from === null) return `${label}: added as ${to}`;
    if (to === null) return `${label}: removed; previously ${from}`;
    return `${label}: ${from} to ${to}`;
  }).join("; ") + ".";
}
