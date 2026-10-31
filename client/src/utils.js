const DAY_MS = 86400000;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// the text inside the colored badge
export function statusLabel(p) {
  if (p.status === "No data") return "No data";
  if (p.status === "Overdue") return `Overdue (${-p.daysLeft}d)`;
  if (p.daysLeft === 0) return `${p.status} (today)`;
  return `${p.status} (${p.daysLeft}d left)`;
}

// which of the 3 prediction tiers produced the cycle
export function cycleLabel(p) {
  if (p.cycleDays == null) return "-";
  if (p.source === "history") return `${p.cycleDays} days (avg of ${p.refillCount} refills)`;
  if (p.source === "supplier") return `${p.cycleDays} days (your estimate)`;
  return `${p.cycleDays} days (default)`;
}

// days between consecutive refills, e.g. "48d, 47d, 44d"
export function gapsLabel(refills) {
  const times = refills.map((r) => new Date(r.date).getTime()).sort((a, b) => a - b);
  if (times.length < 2) return "-";
  const gaps = [];
  for (let i = 1; i < times.length; i++) {
    gaps.push(`${Math.round((times[i] - times[i - 1]) / DAY_MS)}d`);
  }
  return gaps.slice(-4).join(", ");
}

// "Due Soon" -> "due-soon", used as a CSS class name
export const statusClass = (status) => status.toLowerCase().replace(" ", "-");