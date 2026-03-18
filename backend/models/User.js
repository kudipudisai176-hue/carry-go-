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
      enum: ['sender', 'traveller', 'receiver'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    adharNumber: {
      type: String,
    },
    adharPhoto: {
      type: String,
    },
    profilePhoto: {
      type: String,
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
