const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get current user's notifications
// @route   GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    
    notification.is_read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark all as read
// @route   PUT /api/notifications/markallread
router.put('/markallread', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient_id: req.user._id, is_read: false },
      { $set: { is_read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
