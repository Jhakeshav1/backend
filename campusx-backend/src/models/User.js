// models/User.js
import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // hashed password
  displayName: String,
  phone: String,
  campusId: { type: Schema.Types.ObjectId, ref: 'Campus' },
  roles: { type: [String], default: ['user'] },
  verified: { type: Boolean, default: false },
  verificationRequest: {
    status: { type: String, enum: ['pending','approved','rejected'], default: null },
    idImageUrl: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  avatarUrl: String,
  rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  createdAt: { type: Date, default: Date.now },
  lastSeenAt: Date,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;