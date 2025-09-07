// models/Report.js
import mongoose, { Schema } from "mongoose";

const ReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, enum: ['listing','user'] },
  targetId: mongoose.Schema.Types.ObjectId,
  reason: String,
  status: { type: String, enum: ['open','resolved','dismissed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', ReportSchema);
export default Report;
