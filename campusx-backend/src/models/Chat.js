// models/Chat.js
import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessageAt: Date,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;

