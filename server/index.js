import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";   // NEW: reads cookies from requests
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import householdRoutes from "./routes/households.js";
import auth from "./middleware/auth.js";

dotenv.config();

const app = express();

// CHANGED: with cookies, "allow everyone" no longer works.
// origin = the one website allowed to call this API
// credentials = allow the browser to send/receive cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());   // NEW: must come before any route that reads req.cookies

app.use("/api/auth", authRoutes);
app.use("/api/households", auth, householdRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });