import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import householdRoutes from "./routes/households.js";
import settingsRoutes from "./routes/settings.js";
import defaultsRoutes from "./routes/defaults.js";
import routeRoutes from "./routes/route.js";
import alertsRoutes from "./routes/alert.js";
import { startAlertJob } from "./jobs/alertJob.js";
import auth from "./middleware/auth.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/defaults", defaultsRoutes);
app.use("/api/households", auth, householdRoutes);
app.use("/api/settings", auth, settingsRoutes);
app.use("/api/route", auth, routeRoutes);
app.use("/api/alerts", auth, alertsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    startAlertJob();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });