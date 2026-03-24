const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['sender', 'traveller', 'receiver', 'sender_receiver'],
      required: true,
    },
    sub_role: {
      type: String,
      enum: ['sender', 'receiver'],
      default: 'sender',
    },
    phone: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    idProofType: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'Passport'],
    },
    idNumber: {
      type: String,
    },
    idPhoto: {
      type: String,
    },
    livePhoto: {
      type: String,
    },
    profilePhoto: {
      type: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    personalOtp: {
      type: String,
    },
    personalOtpExpiresAt: {
      type: Date,
    },
    personalOtpUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
