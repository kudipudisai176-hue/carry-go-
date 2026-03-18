const mongoose = require('mongoose');

const parcelSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    senderName: { type: String, required: true },
    senderPhone: { type: String },
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    weight: { type: Number, required: true },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'very-large'],
      required: true,
    },
    itemCount: { type: Number, required: true },
    vehicleType: { type: String },
    price: { type: Number }, // Added price field
    paymentMethod: {
      type: String,
      enum: ['pay-now', 'pay-on-delivery'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'requested', 'accepted', 'picked-up', 'in-transit', 'delivered', 'received', 'completed', 'cancelled'],
      default: 'pending',
    },
    traveller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    travellerName: { type: String },
    travellerPhone: { type: String },
    pickupOtp: { type: String },
    deliveryOtp: { type: String },
    paymentReleased: { type: Boolean, default: false },
    parcelPhoto: { type: String }, // Base64 or URL
  },
  {
    timestamps: true,
  }
);

const Parcel = mongoose.model('Parcel', parcelSchema);

module.exports = Parcel;
