import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    // NEW: the supplier's own settings
    settings: {
      alertLeadDays: { type: Number, default: 5, min: 0 }, // alert this many days before runout
      vehicleCapacity: { type: Number, default: 40, min: 1 }, // cylinders per trip
      depot: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
      }, // starts empty until the supplier sets it
    },
  },
  { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);