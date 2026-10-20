const DAY_MS = 86400000;

export const MIN_REFILLS_FOR_HISTORY = 3;
export const URGENT_DAYS = 3;
export const DUE_SOON_DAYS = 7;

// PLACEHOLDER VALUES: replace with your researched numbers (Step 8 moves these to a sourced table)
export const CYLINDER_DEFAULTS = {
  domestic_14_2kg: 45,
  commercial_19kg: 14,
};

// midnight (UTC) of the given date, as a number, so we compare whole days
const startOfDay = (d) => {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
};

const refillTimes = (household) =>
  (household.refills || []).map((r) => startOfDay(r.date)).sort((a, b) => a - b);

export function getCycle(household) {
  const times = refillTimes(household);

  // tier 1: the household's own history
  if (times.length >= MIN_REFILLS_FOR_HISTORY) {
    const gaps = [];
    for (let i = 1; i < times.length; i++) {
      const gap = (times[i] - times[i - 1]) / DAY_MS;
      if (gap > 0) gaps.push(gap);
    }
    if (gaps.length > 0) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return { days: mean, source: "history" };
    }
  }

  // tier 2: the supplier's own estimate
  if (household.expectedCycleDays) {
    return { days: household.expectedCycleDays, source: "supplier" };
  }

  // tier 3: default for the cylinder type
  const fallback =
    CYLINDER_DEFAULTS[household.cylinderType] ?? CYLINDER_DEFAULTS.domestic_14_2kg;
  return { days: fallback, source: "default" };
}

export function getStatus(daysLeft) {
  if (daysLeft < 0) return "Overdue";
  if (daysLeft <= URGENT_DAYS) return "Urgent";
  if (daysLeft <= DUE_SOON_DAYS) return "Due Soon";
  return "Safe";
}

export function predictRunout(household, today = new Date()) {
  const times = refillTimes(household);

  if (times.length === 0) {
    return {
      status: "No data",
      cycleDays: null,
      source: null,
      refillCount: 0,
      lastRefill: null,
      runoutDate: null,
      daysLeft: null,
    };
  }

  const last = times[times.length - 1];
  const cycle = getCycle(household);
  const cycleDays = Math.round(cycle.days);
  const runout = last + cycleDays * DAY_MS;
  const daysLeft = Math.round((runout - startOfDay(today)) / DAY_MS);

  return {
    status: getStatus(daysLeft),
    cycleDays,
    source: cycle.source,
    refillCount: times.length,
    lastRefill: new Date(last),
    runoutDate: new Date(runout),
    daysLeft,
  };
}