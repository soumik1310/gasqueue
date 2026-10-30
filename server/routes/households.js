import express from "express";
import mongoose from "mongoose";
import Household from "../models/household.js";
import { predictRunout } from "../services/prediction.js";

const router = express.Router();

const STATUS_FILTERS = {
  overdue: "Overdue",
  urgent: "Urgent",
  "due-soon": "Due Soon",
  safe: "Safe",
  "no-data": "No data",
};

const EDITABLE = [
  "name",
  "area",
  "people",
  "cylinderType",
  "location",
  "expectedCycleDays",
  "alertLeadDays",
];

const withPrediction = (household) => ({
  ...household.toObject(),
  prediction: predictRunout(household),
});

const sortKey = (h) => h.prediction.daysLeft ?? Number.MAX_SAFE_INTEGER;

const pick = (obj, keys) => {//choose whats there in the url from the list of editables only
  const result = {};
  for (const k of keys) {
    if (obj[k] !== undefined) {
      result[k] = obj[k];
    }
  }
  return result;
};
const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid household id" });
  }
  next();
};

const handleError = (err, res) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Server error" });
};

// GET /api/households?status=urgent
router.get("/", async (req, res) => {
  try {
    let wanted;
    if (req.query.status) {
      wanted = STATUS_FILTERS[req.query.status];
      if (!wanted) {
        return res.status(400).json({
          message: `Invalid status. Use one of: ${Object.keys(STATUS_FILTERS).join(", ")}`,
        });
      }
    }

    const households = await Household.find({ supplier: req.supplierId });
    let result = households.map(withPrediction);

    if (wanted) {
      result = result.filter((h) => h.prediction.status === wanted);
    }
    result.sort((a, b) => {
      const aDays = a.prediction.daysLeft ?? Number.MAX_SAFE_INTEGER;
      const bDays = b.prediction.daysLeft ?? Number.MAX_SAFE_INTEGER;
      return aDays - bDays;
    });
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
});

// GET /api/households/summary  (must stay above /:id)
router.get("/summary", async (req, res) => {
  try {
    const households = await Household.find({ supplier: req.supplierId });

    const keys = {
      Overdue: "overdue",
      Urgent: "urgent",
      "Due Soon": "dueSoon",
      Safe: "safe",
      "No data": "noData",
    };
    const counts = { overdue: 0, urgent: 0, dueSoon: 0, safe: 0, noData: 0 };

    for (const h of households) {
      counts[keys[predictRunout(h).status]]++;
    }

    res.json({
      total: households.length,
      ...counts,
      actionNeeded: counts.overdue + counts.urgent + counts.dueSoon,
    });
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/households
router.post("/", async (req, res) => {
  try {
    const data = pick(req.body, EDITABLE);

    // optional: past refill dates, e.g. ["2026-08-18", "2026-10-01"]
    const refills = (req.body.refills || []).map((d) => ({ date: new Date(d) }));
    if (refills.some((r) => isNaN(r.date))) {
      return res.status(400).json({ message: "Invalid refill date" });
    }

    const household = await Household.create({
      ...data,
      refills,
      supplier: req.supplierId,
    });
    res.status(201).json(household);
  } catch (err) {
    handleError(err, res);
  }
});

// GET /api/households/:id
router.get("/:id", checkId, async (req, res) => {
  try {
    const household = await Household.findOne({
      _id: req.params.id,
      supplier: req.supplierId,
    });
    if (!household) {
      return res.status(404).json({ message: "Household not found" });
    }
    res.json(withPrediction(household));
  } catch (err) {
    handleError(err, res);
  }
});

// PUT /api/households/:id
router.put("/:id", checkId, async (req, res) => {
  try {
    const household = await Household.findOneAndUpdate(
      { _id: req.params.id, supplier: req.supplierId },
      { $set: pick(req.body, EDITABLE) },
      { new: true, runValidators: true }
    );
    if (!household) {
      return res.status(404).json({ message: "Household not found" });
    }
    res.json(household);
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/households/:id
router.delete("/:id", checkId, async (req, res) => {
  try {
    const household = await Household.findOneAndDelete({
      _id: req.params.id,
      supplier: req.supplierId,
    });
    if (!household) {
      return res.status(404).json({ message: "Household not found" });
    }
    res.json({ message: "Household deleted" });
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/households/:id/refills
router.post("/:id/refills", checkId, async (req, res) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();

    if (isNaN(date)) {
      return res.status(400).json({ message: "Invalid date" });
    }
    if (date > new Date()) {
      return res.status(400).json({ message: "Refill date can't be in the future" });
    }

    const household = await Household.findOne({
      _id: req.params.id,
      supplier: req.supplierId,
    });
    if (!household) {
      return res.status(404).json({ message: "Household not found" });
    }

    const day = date.toISOString().slice(0, 10);
    const duplicate = household.refills.some(
      (r) => r.date.toISOString().slice(0, 10) === day
    );
    if (duplicate) {
      return res.status(409).json({ message: "A refill is already logged for that date" });
    }

    household.refills.push({ date });
    household.alertedForCycle = false; // a new cycle starts, so alerts can fire again
    await household.save();

    res.status(201).json(household);
  } catch (err) {
    handleError(err, res);
  }
});

export default router;