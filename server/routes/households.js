import express from "express";
import mongoose from "mongoose";
import Household from "../models/household.js";

const router = express.Router();

const EDITABLE = [
  "name",
  "area",
  "people",
  "cylinderType",
  "location",
  "expectedCycleDays",
  "alertLeadDays",
];

// copy only the allowed fields from the request body
const pick = (obj, keys) =>
  Object.fromEntries(
    keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]])
  );

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

// GET /api/households
router.get("/", async (req, res) => {
  try {
    const households = await Household.find({ supplier: req.supplierId }).sort({
      createdAt: -1,
    });
    res.json(households);
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
    res.json(household);
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