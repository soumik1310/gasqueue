import express from "express";
import { CYLINDER_DEFAULTS } from "../data/cylinderDefaults.js";

const router = express.Router();

// GET /api/defaults  -> the researched defaults, as a list
router.get("/", (req, res) => {
  const list = Object.entries(CYLINDER_DEFAULTS).map(([type, info]) => ({
    type, // e.g. "domestic_14_2kg"
    ...info, // label, days, range, isEstimate, note, sources
  }));
  res.json(list);
});

export default router;