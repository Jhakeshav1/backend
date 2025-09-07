import express from "express";
import { authRequired } from "../middleware/auth.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Offer from "../models/Offer.js";

const router = express.Router();

// list user chats
router.get("/", authRequired, async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id }).sort({ lastMessageAt: -1 }).limit(50);
  res.json(chats);
});

// create or get chat for listing between users
router.post("/", authRequired, async (req, res) => {
  try {
    const { listingId, participantId } = req.body;
    // check existing chat
    let chat = await Chat.findOne({ listingId, participants: { $all: [req.user._id, participantId] } });
    if (!chat) {
      chat = await Chat.create({ listingId, participants: [req.user._id, participantId] });
    }
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// get messages
router.get("/:chatId", authRequired, async (req, res) => {
  const { chatId } = req.params;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const messages = await Message.find({ chatId }).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit);
  res.json(messages.reverse());
});

// send message (rest fallback for clients without sockets)
router.post("/:chatId/message", authRequired, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { body, attachments, type } = req.body;
    const msg = await Message.create({ chatId, senderId: req.user._id, body, attachments: attachments || [], type: type || 'text' });
    await Chat.findByIdAndUpdate(chatId, { lastMessageAt: new Date() });
    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// offer endpoints
router.post("/:chatId/offer", authRequired, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { amount, currency='INR', action } = req.body;
    if (!amount && action !== 'accept' && action !== 'decline') return res.status(400).json({ error: "amount required" });
    if (action === 'create' || !action) {
      const chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ error: "Chat not found" });
      const listingId = chat.listingId;
      const offer = await Offer.create({ listingId, chatId, proposerId: req.user._id, amount: Number(amount), currency });
      return res.json(offer);
    } else {
      // action on offer
      const { offerId } = req.body;
      const offer = await Offer.findById(offerId);
      if (!offer) return res.status(404).json({ error: "Offer not found" });
      if (action === 'accept') {
        offer.status = 'accepted';
        offer.respondedAt = new Date();
        await offer.save();
        // mark listing sold
        const Listing = (await import("../models/Listing.js")).default;
        await Listing.findByIdAndUpdate(offer.listingId, { status: 'sold' });
      } else if (action === 'decline') {
        offer.status = 'declined';
        offer.respondedAt = new Date();
        await offer.save();
      } else if (action === 'cancel') {
        if (offer.proposerId.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Not proposer" });
        offer.status = 'cancelled';
        offer.respondedAt = new Date();
        await offer.save();
      }
      res.json(offer);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Offer action failed" });
  }
});

export default router;
