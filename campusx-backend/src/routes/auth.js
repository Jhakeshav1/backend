import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, displayName, password: hashed });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Current user
router.get("/me", authRequired, async (req, res) => {
  res.json(req.user);
});

export default router;
