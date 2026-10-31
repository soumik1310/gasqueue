import express from "express";
import Supplier from "../models/supplier.js";
import Household from "../models/household.js";
import { predictRunout } from "../services/prediction.js";
import { osrmTrip } from "../services/osrm.js";

const router = express.Router();

const NEEDS_DELIVERY = ["Overdue", "Urgent", "Due Soon"];

router.get("/today", async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.supplierId);
    const d = supplier?.settings?.depot;
    if (!d || d.lat == null || d.lng == null) {
      return res.status(400).json({
        message: "Set your depot location in settings first",
      });
    }
    const depot = {
      lat: d.lat,
      lng: d.lng,
    };

    const households = await Household.find({ supplier: req.supplierId });
    const stops = [];
    for (const h of households) {
      const prediction = predictRunout(h);
      if (NEEDS_DELIVERY.includes(prediction.status)) {
        stops.push({
          id: String(h._id),
          name: h.name,
          area: h.area,
          lat: h.location.lat,
          lng: h.location.lng,
          status: prediction.status,
          daysLeft: prediction.daysLeft,
        });
      }
    }

    if (stops.length === 0) {
      return res.json({
        depot,
        stops: [],
        roadDistanceKm: 0,
        roadDurationMin: 0,
      });
    }

    const trip = await osrmTrip(depot, stops);

    res.json({
      depot,
      stops: trip.order.map((stop, i) => ({
        ...stop,
        sequence: i + 1,
      })),
      roadDistanceKm: trip.roadDistanceKm,
      roadDurationMin: trip.roadDurationMin,
    });
  } catch (err) {
    console.error("Route error:", err.message);
    if (err.message.startsWith("OSRM") || err.name === "TimeoutError") {
      return res.status(502).json({
        message: "Route service is unavailable. Try again shortly.",
      });
    }
    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;