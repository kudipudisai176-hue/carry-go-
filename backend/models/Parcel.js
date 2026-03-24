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
    city: { type: String }, // Granular location searching
    village: { type: String }, // Granular location searching
    weight: { type: Number, required: true },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'very-large'],
      required: true,
    },
    itemCount: { type: Number, required: true },
    vehicleType: { type: String },
    distance: { type: Number, required: true }, // Added distance field
    price: { type: Number }, // Added total amount (Total Payable)
    parcelCharge: { type: Number }, // Internal base tracking
    platformFee: { type: Number }, // Internal commission tracking
    paymentMethod: {
      type: String,
      enum: ['pay-now', 'pay-on-delivery'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'unpaid'],
      default: 'pending',
    },
    escrow_status: {
      type: String,
      enum: ['held', 'released', 'none'],
      default: 'held',
    },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending_payment', 'open_for_travellers', 'pending', 'requested', 'accepted', 'picked-up', 'in-transit', 'delivered', 'received', 'completed', 'cancelled'],
      default: 'pending_payment',
    },
    traveller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    travellerName: { type: String },
    travellerPhone: { type: String },
    pickupOtp: { type: String },
    deliveryOtp: { type: String },
    deliveryOtpExpiry: { type: Date },
    paymentReleased: { type: Boolean, default: false },
    parcelPhoto: { type: String }, // Base64 or URL
    deliveryPhoto: { type: String }, // Confirmation proof from traveller
    delivery_proof: { type: String }, // Supabase Storage URL
    receivedPhoto: { type: String }, // Confirmation proof from receiver
    receiverRating: { type: Number }, // Rating for the service/website
    deliveredAt: { type: Date },
    delivery_location: { type: String },
  },
  {
    timestamps: true,
  }
);

const Parcel = mongoose.model('Parcel', parcelSchema);

module.exports = Parcel;
