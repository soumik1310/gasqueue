import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Supplier from "../models/supplier.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,                    // JavaScript in the browser cannot read it (blocks token theft via XSS)
  secure: isProd,                    // in production, only sent over HTTPS
  sameSite: isProd ? "none" : "lax", // "none" is needed when the frontend and API are on different domains
  maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days, in milliseconds (matches the token's expiry)
};
//Locally I use lax. In production, where the frontend and API are on different domains, I use none with secure: true so the browser still sends the cookie.

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const setAuthCookie = (res, supplierId) => {
  res.cookie("token", createToken(supplierId), cookieOptions);
};

router.post("/register", async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const exists = await Supplier.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const supplier = await Supplier.create({ name, email, password: hashed });

    setAuthCookie(res, supplier._id);  
    res.status(201).json({
      supplier: { id: supplier._id, name: supplier.name, email: supplier.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const supplier = await Supplier.findOne({ email });
    const match = supplier && (await bcrypt.compare(password, supplier.password));

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    setAuthCookie(res, supplier._id);  
    res.json({
      supplier: { id: supplier._id, name: supplier.name, email: supplier.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
res.clearCookie('token', {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
});
  res.json({ message: "Logged out" });
});

router.get("/me", auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.supplierId).select("-password");
    if (!supplier) {
      return res.status(401).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;