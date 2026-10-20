import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Supplier from "../models/supplier.js";

const router = express.Router();

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
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

    res.status(201).json({
      token: createToken(supplier._id),
      supplier: { id: supplier._id, name: supplier.name, email: supplier.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
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

    res.json({
      token: createToken(supplier._id),
      supplier: { id: supplier._id, name: supplier.name, email: supplier.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;