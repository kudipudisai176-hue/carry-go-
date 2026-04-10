const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parcel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.virtual('reviewer').get(function() { return this.reviewer_id; }).set(function(v) { this.reviewer_id = v; });
reviewSchema.virtual('reviewee').get(function() { return this.reviewee_id; }).set(function(v) { this.reviewee_id = v; });
reviewSchema.virtual('parcel').get(function() { return this.parcel_id; }).set(function(v) { this.parcel_id = v; });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
