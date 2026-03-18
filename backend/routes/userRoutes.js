const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleType, adharNumber, adharPhoto, profilePhoto } = req.body;
    console.log(`Registration attempt for: ${email}`);

    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log(`User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      vehicleType,
      adharNumber,
      adharPhoto,
      profilePhoto,
      bio: req.body.bio
    });

    if (user) {
      console.log(`User created successfully: ${email}`);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        walletBalance: user.walletBalance,
        rating: user.rating,
        totalTrips: user.totalTrips,
        adharNumber: user.adharNumber,
        adharPhoto: user.adharPhoto,
        profilePhoto: user.profilePhoto,
        vehicleType: user.vehicleType,
        bio: user.bio,
        token: generateToken(user._id),
      });
    } else {
      console.log('Invalid user data provided');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        walletBalance: user.walletBalance,
        adharNumber: user.adharNumber,
        adharPhoto: user.adharPhoto,
        profilePhoto: user.profilePhoto,
        vehicleType: user.vehicleType,
        bio: user.bio,
        rating: user.rating,
        totalTrips: user.totalTrips,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    console.log(`Updating profile for user: ${req.user._id}`);
    const user = await User.findById(req.user._id);

    if (user) {
      console.log(`Existing user found, updating fields:`, Object.keys(req.body));
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.profilePhoto = req.body.profilePhoto || user.profilePhoto;
      user.bio = req.body.bio || user.bio;
      user.vehicleType = req.body.vehicleType || user.vehicleType;
      user.adharNumber = req.body.adharNumber || user.adharNumber;
      user.adharPhoto = req.body.adharPhoto || user.adharPhoto;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      console.log('Attempting to save updated user...');
      const updatedUser = await user.save();
      console.log('User profile saved successfully');

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        profilePhoto: updatedUser.profilePhoto,
        walletBalance: updatedUser.walletBalance,
        rating: updatedUser.rating,
        totalTrips: updatedUser.totalTrips,
        bio: updatedUser.bio,
        vehicleType: updatedUser.vehicleType,
        adharNumber: updatedUser.adharNumber,
        adharPhoto: updatedUser.adharPhoto,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(`Profile update error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user profile by ID
// @route   GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
