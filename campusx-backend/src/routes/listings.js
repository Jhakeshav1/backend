import express from "express";
import multer from "multer";
import Listing from "../models/Listing.js";
import { authRequired } from "../middleware/auth.js";
import { uploadFile } from "../services/storageService.js";

const router = express.Router();
const upload = multer(); // memory

// Create listing
router.post("/", authRequired, upload.array("images", 6), async (req, res) => {
  try {
    const { title, description, category, condition='used', price, campusId, tags } = req.body;
    const files = req.files || [];
    const uploaded = [];
    for (const f of files) {
      const { publicUrl, path } = await uploadFile(f.buffer, f.originalname, f.mimetype, "listings");
      uploaded.push({ url: publicUrl, path });
    }
    const listing = await Listing.create({
      title, description, category, condition, price: Number(price || 0),
      campusId, tags: tags ? tags.split(",").map(s=>s.trim()) : [],
      images: uploaded, sellerId: req.user._id
    });
    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// Query listings
router.get("/", async (req, res) => {
  try {
    const { campus, q, category, minPrice, maxPrice, condition, sort='newest', page=1, limit=20 } = req.query;
    const filter = { status: 'active' };
    if (campus) filter.campusId = campus;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (q) filter.$text = { $search: q };

    const sortOpt = sort === 'price_asc' ? { price: 1 } : sort === 'price_desc' ? { price: -1 } : { createdAt: -1 };

    const listings = await Listing.find(filter).sort(sortOpt).skip((page-1)*limit).limit(Number(limit));
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query listings" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('sellerId', 'displayName rating verified');
    if (!listing) return res.status(404).json({ error: "Not found" });
    listing.viewsCount = (listing.viewsCount || 0) + 1;
    await listing.save();
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listing" });
  }
});

router.put("/:id", authRequired, upload.array("images", 6), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    if (listing.sellerId.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Not owner" });

    const updates = {};
    ['title','description','category','condition','price','status','tags','campusId'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const files = req.files || [];
    if (files.length) {
      const uploaded = [];
      for (const f of files) {
        const { publicUrl, path } = await uploadFile(f.buffer, f.originalname, f.mimetype, "listings");
        uploaded.push({ url: publicUrl, path });
      }
      updates.images = (listing.images || []).concat(uploaded);
    }

    const updated = await Listing.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Not found" });
    if (listing.sellerId.toString() !== req.user._id.toString() && !(req.user.roles||[]).includes('admin')) return res.status(403).json({ error: "Not allowed" });
    listing.status = 'removed';
    await listing.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

router.post("/:id/report", authRequired, async (req, res) => {
  const Report = (await import("../models/Report.js")).default;
  try {
    const r = await Report.create({
      reporterId: req.user._id,
      targetType: 'listing',
      targetId: req.params.id,
      reason: req.body.reason || ''
    });
    res.json({ ok: true, report: r });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to report" });
  }
});

export default router;
