const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  from_location: { type: String },
  to_location: { type: String },
  village: { type: String },
  city: { type: String },
  weight: { type: Number },
  size: { type: String },
  item_count: { type: Number, default: 1 },
  vehicle_type: { type: String },
  parcel_photo: { type: String },
  receiver_name: { type: String },
  receiver_phone: { type: String },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender_name: { type: String },
  sender_phone: { type: String },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  traveller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  traveller_name: { type: String },
  traveller_phone: { type: String },
  parcel_charge: { type: Number },
  platform_fee: { type: Number },
  price: { type: Number },
  status: { type: String, default: 'open_for_travellers', enum: ['pending', 'pending_payment', 'open_for_travellers', 'requested', 'accepted', 'assigned', 'picked-up', 'in-transit', 'arrived', 'delivered', 'received', 'completed', 'cancelled'] },
  payment_method: { type: String },
  payment_status: { type: String, default: 'pending' },
  escrow_status: { type: String },
  pickup_otp: { type: String },
  delivery_otp: { type: String },
  delivery_otp_expiry: { type: Date },
  is_active: { type: Boolean, default: true },
  payment_released: { type: Boolean, default: false },
  pickup_photo: { type: String },
  delivery_photo: { type: String },
  received_photo: { type: String },
  receiver_rating: { type: Number },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for frontend camelCase compatibility
parcelSchema.virtual('fromLocation').get(function() { return this.from_location; }).set(function(v) { this.from_location = v; });
parcelSchema.virtual('toLocation').get(function() { return this.to_location; }).set(function(v) { this.to_location = v; });
parcelSchema.virtual('itemCount').get(function() { return this.item_count; }).set(function(v) { this.item_count = v; });
parcelSchema.virtual('vehicleType').get(function() { return this.vehicle_type; }).set(function(v) { this.vehicle_type = v; });
parcelSchema.virtual('parcelPhoto').get(function() { return this.parcel_photo; }).set(function(v) { this.parcel_photo = v; });
parcelSchema.virtual('receiverName').get(function() { return this.receiver_name; }).set(function(v) { this.receiver_name = v; });
parcelSchema.virtual('receiverPhone').get(function() { return this.receiver_phone; }).set(function(v) { this.receiver_phone = v; });
parcelSchema.virtual('senderId').get(function() { return this.sender_id; }).set(function(v) { this.sender_id = v; });
parcelSchema.virtual('senderName').get(function() { return this.sender_name; }).set(function(v) { this.sender_name = v; });
parcelSchema.virtual('senderPhone').get(function() { return this.sender_phone; }).set(function(v) { this.sender_phone = v; });
parcelSchema.virtual('receiverId').get(function() { return this.receiver_id; }).set(function(v) { this.receiver_id = v; });
parcelSchema.virtual('travellerId').get(function() { return this.traveller_id; }).set(function(v) { this.traveller_id = v; });
parcelSchema.virtual('travellerName').get(function() { return this.traveller_name; }).set(function(v) { this.traveller_name = v; });
parcelSchema.virtual('travellerPhone').get(function() { return this.traveller_phone; }).set(function(v) { this.traveller_phone = v; });
parcelSchema.virtual('parcelCharge').get(function() { return this.parcel_charge; }).set(function(v) { this.parcel_charge = v; });
parcelSchema.virtual('platformFee').get(function() { return this.platform_fee; }).set(function(v) { this.platform_fee = v; });
parcelSchema.virtual('paymentMethod').get(function() { return this.payment_method; }).set(function(v) { this.payment_method = v; });
parcelSchema.virtual('paymentStatus').get(function() { return this.payment_status; }).set(function(v) { this.payment_status = v; });
parcelSchema.virtual('escrowStatus').get(function() { return this.escrow_status; }).set(function(v) { this.escrow_status = v; });
parcelSchema.virtual('pickupOtp').get(function() { return this.pickup_otp; }).set(function(v) { this.pickup_otp = v; });
parcelSchema.virtual('deliveryOtp').get(function() { return this.delivery_otp; }).set(function(v) { this.delivery_otp = v; });
parcelSchema.virtual('paymentReleased').get(function() { return this.payment_released; }).set(function(v) { this.payment_released = v; });
parcelSchema.virtual('pickupPhoto').get(function() { return this.pickup_photo; }).set(function(v) { this.pickup_photo = v; });
parcelSchema.virtual('deliveryPhoto').get(function() { return this.delivery_photo; }).set(function(v) { this.delivery_photo = v; });
parcelSchema.virtual('receivedPhoto').get(function() { return this.received_photo; }).set(function(v) { this.received_photo = v; });
parcelSchema.virtual('receiverRating').get(function() { return this.receiver_rating; }).set(function(v) { this.receiver_rating = v; });

// Virtuals for populating sender and traveller
parcelSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true
});

parcelSchema.virtual('traveller', {
  ref: 'User',
  localField: 'traveller_id',
  foreignField: '_id',
  justOne: true
});

const Parcel = mongoose.model('Parcel', parcelSchema);
module.exports = Parcel;
