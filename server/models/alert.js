import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    household: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    message: { type: String, required: true },
    daysLeft: { type: Number, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);