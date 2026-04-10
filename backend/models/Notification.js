const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  link: { type: String },
  is_read: { type: Boolean, default: false },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.virtual('recipient').get(function() { return this.recipient_id; }).set(function(v) { this.recipient_id = v; });
notificationSchema.virtual('referenceId').get(function() { return this.reference_id; }).set(function(v) { this.reference_id = v; });
notificationSchema.virtual('isRead').get(function() { return this.is_read; }).set(function(v) { this.is_read = v; });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
