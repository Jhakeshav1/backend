import express from "express";
import { authRequired, requireAdmin } from "../middleware/auth.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Listing from "../models/Listing.js";

const router = express.Router();

router.get("/reports", authRequired, requireAdmin, async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 }).limit(200);
  res.json(reports);
});

router.post("/reports/:id/action", authRequired, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'resolve','dismiss','removeListing','suspendUser'
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: "Not found" });
    if (action === 'resolve') {
      report.status = 'resolved';
      await report.save();
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
      await report.save();
    } else if (action === 'removeListing') {
      await Listing.findByIdAndUpdate(report.targetId, { status: 'removed' });
      report.status = 'resolved';
      await report.save();
    } else if (action === 'suspendUser') {
      await User.findByIdAndUpdate(report.targetId, { $addToSet: { roles: 'suspended' } });
      report.status = 'resolved';
      await report.save();
    }
    res.json({ ok: true, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Action failed" });
  }
});

// list verification requests
router.get("/verify/requests", authRequired, requireAdmin, async (req, res) => {
  const users = await User.find({ "verificationRequest.status": 'pending' }).limit(200);
  res.json(users);
});

router.post("/verify/:userId", async (req, res) => {
  try {
    // very basic admin check (replace with session-based auth later)
    if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: "Admin key required" });
    }

    const { userId } = req.params;
    const { approve, note } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.verificationRequest.status = approve ? 'approved' : 'rejected';
    user.verified = !!approve;
    user.verificationRequest.reviewedAt = new Date();
    user.verificationRequest.note = note || '';
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification action failed" });
  }
});


export default router;
