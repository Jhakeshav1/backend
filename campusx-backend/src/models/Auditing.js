// models/AuditLog.js
const AuditSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AuditLog', AuditSchema);

