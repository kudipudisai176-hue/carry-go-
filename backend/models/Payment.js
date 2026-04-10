const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  parcel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, default: 'online' },
  payment_status: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed', 'refunded'] },
  escrow_status: { type: String, default: 'none', enum: ['none', 'held', 'released'] },
  payment_gateway_id: { type: String },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

paymentSchema.virtual('parcel').get(function() { return this.parcel_id; }).set(function(v) { this.parcel_id = v; });
paymentSchema.virtual('sender').get(function() { return this.sender_id; }).set(function(v) { this.sender_id = v; });
paymentSchema.virtual('paymentGatewayId').get(function() { return this.payment_gateway_id; }).set(function(v) { this.payment_gateway_id = v; });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
