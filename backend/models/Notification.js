const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true, // Make optional to support phone-based notifications
    },
    phone: { type: String }, // For unlinked receivers (WhatsApp/SMS ready)
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['parcel_requested', 'parcel_accepted', 'transit_started', 'delivered', 'payment_released', 'chat_message', 'new_parcel', 'received'],
      required: true 
    },
    referenceId: { type: String },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
