const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Parcel',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
