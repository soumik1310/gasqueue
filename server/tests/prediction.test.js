import test from "node:test";
import assert from "node:assert/strict";
import { predictRunout, getStatus } from "../services/prediction.js";
import { getDefaultDays } from "../data/cylinderDefaults.js"; // CHANGED

const TODAY = new Date("2026-10-20");

const hh = (dates, extra = {}) => ({
  cylinderType: "domestic_14_2kg",
  refills: dates.map((d) => ({ date: new Date(d) })),
  ...extra,
});

test("history: averages the gaps (48, 47, 44 days)", () => {
  const r = predictRunout(
    hh(["2026-05-15", "2026-07-02", "2026-08-18", "2026-10-01"]),
    TODAY
  );
  assert.equal(r.source, "history");
  assert.equal(r.cycleDays, 46);
  assert.equal(r.runoutDate.toISOString().slice(0, 10), "2026-11-16");
  assert.equal(r.daysLeft, 27);
  assert.equal(r.status, "Safe");
});

test("unsorted refills give the same answer", () => {
  const r = predictRunout(
    hh(["2026-10-01", "2026-05-15", "2026-08-18", "2026-07-02"]),
    TODAY
  );
  assert.equal(r.cycleDays, 46);
});

test("history beats the supplier's estimate", () => {
  const r = predictRunout(
    hh(["2026-07-02", "2026-08-18", "2026-10-01"], { expectedCycleDays: 10 }),
    TODAY
  );
  assert.equal(r.source, "history");
});

test("supplier estimate is used when history is too short", () => {
  const r = predictRunout(
    hh(["2026-09-01", "2026-09-20"], { expectedCycleDays: 30 }),
    TODAY
  );
  assert.equal(r.source, "supplier");
  assert.equal(r.runoutDate.toISOString().slice(0, 10), "2026-10-20");
  assert.equal(r.daysLeft, 0);
  assert.equal(r.status, "Urgent");
});

test("default is used when there is no history and no supplier estimate", () => {
  const r = predictRunout(hh(["2026-10-01"]), TODAY);
  assert.equal(r.source, "default");
  assert.equal(r.cycleDays, getDefaultDays("domestic_14_2kg")); // CHANGED
});

test("no refills means no prediction", () => {
  const r = predictRunout(hh([]), TODAY);
  assert.equal(r.status, "No data");
  assert.equal(r.runoutDate, null);
});

test("overdue household", () => {
  const r = predictRunout(hh(["2026-08-01"], { expectedCycleDays: 30 }), TODAY);
  assert.equal(r.daysLeft, -50);
  assert.equal(r.status, "Overdue");
});

test("status boundaries", () => {
  assert.equal(getStatus(-1), "Overdue");
  assert.equal(getStatus(0), "Urgent");
  assert.equal(getStatus(3), "Urgent");
  assert.equal(getStatus(4), "Due Soon");
  assert.equal(getStatus(7), "Due Soon");
  assert.equal(getStatus(8), "Safe");
});