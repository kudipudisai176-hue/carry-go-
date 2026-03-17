const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, vehicleType, adharNumber, adharPhoto, livePhoto } = req.body;
        console.log('Signup params:', { name, email, role });
        let user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');
        if (user) return res.status(400).json({ message: 'User already exists' });

        console.log('Creating new user...');
        user = new User({ name, email, password, role, phone, vehicleType, adharNumber, adharPhoto, livePhoto });
        console.log('Saving user...');
        await user.save();
        console.log('User saved successfully');

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name,
                email,
                role,
                phone,
                vehicleType: vehicleType || undefined
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email,
                role: user.role,
                phone: user.phone,
                vehicleType: user.vehicleType || undefined
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
