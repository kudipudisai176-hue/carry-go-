const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
