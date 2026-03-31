const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Parcel = require('../models/Parcel');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get messages for a delivery
// @route   GET /api/messages/:deliveryId
router.get('/:deliveryId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ delivery: req.params.deliveryId })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send a message
// @route   POST /api/messages
router.post('/', protect, async (req, res) => {
  try {
    const { deliveryId, message } = req.body;
    
    if (!deliveryId || !message) {
      return res.status(400).json({ message: 'Delivery ID and message are required' });
    }

    // Since Message is an adapter object now, not a Mongoose class constructor
    const savedMessage = await Message.create({
      delivery: deliveryId,
      sender: req.user._id,
      message,
    });
    
    // 🔔 Create In-App Notification for recipient
    try {
      const p = await Parcel.findById(deliveryId);
      if (p) {
        const recipient = (p.sender && p.sender.toString() === req.user._id.toString()) ? p.traveller : p.sender;
        if (recipient) {
          await Notification.create({
            recipient,
            title: `New Message from ${req.user.name}`,
            message: message.slice(0, 50),
            type: 'chat_message',
            referenceId: deliveryId
          });
        }
      }
    } catch (notifErr) { console.error("Chat notification failed:", notifErr); }

    // Use our new findById helper to get a populated result for the frontend
    const populatedMessage = await Message.findById(savedMessage._id).populate('sender', 'name profilePhoto');
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("DEBUG: Message POST error ->", error.message || error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
