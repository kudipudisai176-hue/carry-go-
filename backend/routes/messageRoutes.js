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
    const messages = await Message.find({ delivery_id: req.params.deliveryId })
      .populate('sender_id', 'name profile_photo')
      .sort({ created_at: 1 });
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

    const savedMessage = await Message.create({
      delivery_id: deliveryId,
      sender_id: req.user._id,
      message,
    });
    
    // 🔔 Create In-App Notification for recipient
    try {
      const p = await Parcel.findById(deliveryId);
      if (p) {
        const recipient = (p.sender_id && p.sender_id.toString() === req.user._id.toString()) ? p.traveller_id : p.sender_id;
        if (recipient) {
          await Notification.create({
            recipient_id: recipient,
            title: `New Message`,
            message: message.slice(0, 50),
            type: 'chat_message',
            reference_id: deliveryId
          });
        }
      }
    } catch (notifErr) { console.error("Chat notification failed:", notifErr); }

    const populatedMessage = await Message.findById(savedMessage._id).populate('sender_id', 'name profile_photo');
    
    // 🚀 EMIT REAL-TIME SOCKET EVENT
    if (req.io) {
      req.io.to(deliveryId).emit('new_message', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("DEBUG: Message POST error ->", error.message || error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
