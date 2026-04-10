const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  last_updated: { type: Date, default: Date.now }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

walletSchema.virtual('user').get(function() { return this.user_id; }).set(function(v) { this.user_id = v; });

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
