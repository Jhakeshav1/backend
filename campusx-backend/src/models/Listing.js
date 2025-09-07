// models/Listing.js
import mongoose, { Schema } from "mongoose";

const ListingSchema = new mongoose.Schema({
  title: { type: String, required: true, text: true },
  description: { type: String, text: true },
  category: { type: String, index: true },
  condition: { type: String, enum: ['new','like_new','used','for_parts'], default: 'used' },
  price: { type: Number, required: true, index: true },
  currency: { type: String, default: 'INR' },
  images: [{ url: String, path: String, thumbUrl: String }],
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', index: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['active','sold','hidden','removed'], default: 'active' },
  tags: [String],
  viewsCount: { type: Number, default: 0 },
  contactClicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
}, { timestamps: true });

ListingSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Listing = mongoose.model('Listing', ListingSchema);
export default Listing;