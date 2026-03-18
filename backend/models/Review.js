const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    parcel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Parcel',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
