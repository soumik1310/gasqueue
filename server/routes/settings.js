import express from "express";
import Supplier from "../models/supplier.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.supplierId);
    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }
    res.json(supplier.settings);
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

router.put("/", async (req, res) => {
  try {
    const { alertLeadDays, vehicleCapacity, depot } = req.body;

    if (depot !== undefined) {
      if (typeof depot.lat !== "number" || typeof depot.lng !== "number") {
        return res.status(400).json({
          message: "Depot needs lat and lng as numbers",
        });
      }
    }

    const supplier = await Supplier.findById(req.supplierId);
    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    if (alertLeadDays !== undefined) {
      supplier.settings.alertLeadDays = alertLeadDays;
    }
    if (vehicleCapacity !== undefined) {
      supplier.settings.vehicleCapacity = vehicleCapacity;
    }
    if (depot !== undefined) {
      supplier.settings.depot = {
        lat: depot.lat,
        lng: depot.lng,
      };
    }

    await supplier.save();
    res.json(supplier.settings);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: err.message,
      });
    }
    console.error("Update settings error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;