const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    parcel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Parcel',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    escrow_status: {
      type: String,
      enum: ['held', 'released'],
      default: 'held',
    },
    paymentGatewayId: { type: String },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
