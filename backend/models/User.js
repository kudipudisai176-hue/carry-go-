const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['sender_receiver', 'traveller', 'both', 'sender', 'receiver'], default: 'sender_receiver' },
  sub_role: { type: String, enum: ['sender', 'receiver'], default: 'sender' },
  bio: { type: String },
  profile_photo: { type: String },
  wallet_balance: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  total_trips: { type: Number, default: 0 },
  personal_otp: { type: String },
  personal_otp_expires_at: { type: Date },
  personal_otp_used: { type: Boolean, default: false },
  vehicle_type: { type: String },
  aadhar_number: { type: String },
  aadhar_photo: { type: String },
  id_photo: { type: String },
  live_photo: { type: String },
  id_proof_type: { type: String },
  id_number: { type: String },
  dob: { type: String },
  gender: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for frontend camelCase compatibility
userSchema.virtual('profilePhoto').get(function() { return this.profile_photo; }).set(function(v) { this.profile_photo = v; });
userSchema.virtual('walletBalance').get(function() { return this.wallet_balance; }).set(function(v) { this.wallet_balance = v; });
userSchema.virtual('totalTrips').get(function() { return this.total_trips; }).set(function(v) { this.total_trips = v; });
userSchema.virtual('personalOtp').get(function() { return this.personal_otp; }).set(function(v) { this.personal_otp = v; });
userSchema.virtual('personalOtpExpiresAt').get(function() { return this.personal_otp_expires_at; }).set(function(v) { this.personal_otp_expires_at = v; });
userSchema.virtual('vehicleType').get(function() { return this.vehicle_type; }).set(function(v) { this.vehicle_type = v; });
userSchema.virtual('aadharNumber').get(function() { return this.aadhar_number; }).set(function(v) { this.aadhar_number = v; });
userSchema.virtual('aadharPhoto').get(function() { return this.aadhar_photo; }).set(function(v) { this.aadhar_photo = v; });
userSchema.virtual('idPhoto').get(function() { return this.id_photo; }).set(function(v) { this.id_photo = v; });
userSchema.virtual('livePhoto').get(function() { return this.live_photo; }).set(function(v) { this.live_photo = v; });
userSchema.virtual('idProofType').get(function() { return this.id_proof_type; }).set(function(v) { this.id_proof_type = v; });
userSchema.virtual('idNumber').get(function() { return this.id_number; }).set(function(v) { this.id_number = v; });
userSchema.virtual('personalOtpUsed').get(function() { return this.personal_otp_used; }).set(function(v) { this.personal_otp_used = v; });

// Password hashing middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
