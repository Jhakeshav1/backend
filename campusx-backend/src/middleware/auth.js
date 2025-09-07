import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No auth header" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.roles.includes("admin")) {
    return res.status(403).json({ error: "Admin required" });
  }
  next();
}
