const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

messageSchema.virtual('delivery').get(function() { return this.delivery_id; }).set(function(v) { this.delivery_id = v; });
messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
