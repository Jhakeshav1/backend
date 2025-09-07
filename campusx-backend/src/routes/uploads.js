import express from "express";
import multer from "multer";
import { authRequired } from "../middleware/auth.js";
import { uploadFile } from "../services/storageService.js";
 
const router = express.Router();
const upload = multer();

router.post("/", authRequired, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const { publicUrl, path } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, "uploads");
    res.json({ url: publicUrl, path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
