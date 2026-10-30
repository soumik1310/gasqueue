import express from "express";
import mongoose from "mongoose";
import Alert from "../models/alert.js";
import { runAlertCheck } from "../jobs/alertJob.js";

const router = express.Router();

// GET /api/alerts  -> latest 50 alerts, newest first
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find({ supplier: req.supplierId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = alerts.filter((a) => !a.read).length;
    res.json({ unread, alerts });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/alerts/run-now  -> run the check now for this supplier
router.post("/run-now", async (req, res) => {
  try {
    const created = await runAlertCheck(req.supplierId);
    res.json({ created });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/alerts/:id/read  -> mark one alert as read
router.patch("/:id/read", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid alert id" });
    }
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, supplier: req.supplierId },
      { read: true },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;