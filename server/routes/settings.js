import express from "express";
import Supplier from "../models/supplier.js";

const router = express.Router();

// GET /api/settings  -> returns the supplier's settings
router.get("/", async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier.settings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/settings  -> changes only the fields that are sent
router.put("/", async (req, res) => {
  try {
    const { alertLeadDays, vehicleCapacity, depot } = req.body;
    const updates = {};

    if (alertLeadDays !== undefined) {
      updates["settings.alertLeadDays"] = alertLeadDays;
    }
    if (vehicleCapacity !== undefined) {
      updates["settings.vehicleCapacity"] = vehicleCapacity;
    }
    if (depot !== undefined) {
      // the depot needs both numbers, or the route can't start
      if (typeof depot.lat !== "number" || typeof depot.lng !== "number") {
        return res.status(400).json({ message: "Depot needs lat and lng as numbers" });
      }
      updates["settings.depot"] = { lat: depot.lat, lng: depot.lng };
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.supplierId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json(supplier.settings);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
});

export default router;