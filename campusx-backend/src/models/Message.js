// models/Message.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: String,
  attachments: [{ url: String, type: String }],
  type: { type: String, enum: ['text','image','offer','system'], default: 'text' },
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);
export default Message;
