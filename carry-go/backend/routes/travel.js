const express = require('express');
const router = express.Router();
const TravelPlan = require('../models/TravelPlan');
const auth = require('../middleware/authMiddleware');

// POST /api/travel/add-travel-plan
router.post('/add-travel-plan', auth, async (req, res) => {
    try {
        const { fromLocation, toLocation, travelDate, modeOfTransport, availableWeight } = req.body;
        const travelPlan = new TravelPlan({
            travellerId: req.user.id,
            fromLocation,
            toLocation,
            travelDate,
            modeOfTransport,
            availableWeight
        });
        await travelPlan.save();
        res.status(201).json(travelPlan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/travel/active
router.get('/active', async (req, res) => {
    try {
        const plans = await TravelPlan.find({ status: 'active' }).populate('travellerId', 'name rating');
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
