const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create a new review
// @route   POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { reviewee, parcel, rating, comment } = req.body;
    
    const review = await Review.create({
      reviewer_id: req.user._id,
      reviewee_id: reviewee,
      parcel_id: parcel,
      rating,
      comment
    });

    // Recalculate reviewee's average rating in MongoDB
    const reviews = await Review.find({ reviewee_id: reviewee });
    const avgRating = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
    
    const revieweeUser = await User.findById(reviewee);
    if (revieweeUser) {
      revieweeUser.rating = avgRating;
      await revieweeUser.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:id
router.get('/user/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee_id: req.params.id })
      .populate('reviewer', 'name profilePhoto')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
