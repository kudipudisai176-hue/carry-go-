const mongoose = require('mongoose');

const travelPlanSchema = new mongoose.Schema({
    travellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    toLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    travelDate: { type: Date, required: true },
    modeOfTransport: { type: String, enum: ['car', 'bus', 'train', 'flight', 'bike'], required: true },
    availableWeight: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TravelPlan', travelPlanSchema);
