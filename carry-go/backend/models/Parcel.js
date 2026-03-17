const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    travellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String },
    receiverName: { type: String },
    receiverPhone: { type: String },
    travellerName: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    weight: { type: Number, required: true }, // in kg
    size: {
        type: String,
        enum: ['small', 'medium', 'large', 'very-large'],
        required: true
    },
    itemCount: { type: Number, default: 1 },
    vehicleType: { type: String },
    pickupLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    deliveryLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['pending', 'requested', 'accepted', 'picked-up', 'in-transit', 'delivered', 'received', 'completed', 'cancelled'],
        default: 'pending'
    },
    pickupOTP: { type: String },
    deliveryOTP: { type: String },
    pickupPhoto: { type: String },
    deliveryPhoto: { type: String },
    price: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['pay-now', 'pay-on-delivery'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
    },
    paymentReleased: { type: Boolean, default: false },
    receiverConfirm: { type: Boolean, default: false },
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Parcel', parcelSchema);
