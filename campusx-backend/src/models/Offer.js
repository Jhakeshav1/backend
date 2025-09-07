// models/Offer.js
import mongoose, { Schema } from "mongoose";

const OfferSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  proposerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending','accepted','declined','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  respondedAt: Date,
}, { timestamps: true });

const Offer = mongoose.model('Offer', OfferSchema);
export default Offer;
