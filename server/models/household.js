import mongoose from "mongoose";

const refillSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  proofUrl: { type: String }, // Cloudinary photo, added in a later step
});

const householdSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    people: { type: Number, required: true, min: 1 },
    cylinderType: {
      type: String,
      enum: ["domestic_14_2kg", "commercial_19kg"],
      default: "domestic_14_2kg",
    },
    location: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
    expectedCycleDays: { type: Number, min: 1 }, // supplier's own estimate
    alertLeadDays: { type: Number, min: 0 },     // per-household override
    refills: [refillSchema],
    alertedForCycle: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Household", householdSchema);