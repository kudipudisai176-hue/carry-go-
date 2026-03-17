const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['sender', 'traveller', 'receiver'], required: true },
    phone: { type: String, required: true },
    vehicleType: { type: String }, // For travellers
    adharNumber: { type: String }, // For traveller verification
    adharPhoto: { type: String }, // Base64 or file path
    livePhoto: { type: String },  // Base64 or file path
    profilePhoto: { type: String },
    rating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
