// models/Rating.js
const RatingSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // seller
  rating: { type: Number, min: 1, max: 5 },
  text: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rating', RatingSchema);
