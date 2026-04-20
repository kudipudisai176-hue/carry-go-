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

// @desc    Get current logged-in user's profile (used by AuthProvider on load)
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      sub_role: user.sub_role,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      walletBalance: user.walletBalance,
      rating: user.rating,
      totalTrips: user.totalTrips,
      bio: user.bio,
      aadharNumber: user.idNumber,
      idNumber: user.idNumber,
      personalOtp: user.personalOtp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const generateOtpData = () => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  return { otp, expiresAt };
};

// @desc    Register a new user
// @route   POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, dob, gender, address, city, state, pincode, idProofType, idNumber, idPhoto, livePhoto, profilePhoto } = req.body;
    
    console.log(`[Registration] Starting process for: ${email}`);
    
    // Check for required environment variables
    if (!process.env.JWT_SECRET) {
      console.error("[Registration] CRITICAL: JWT_SECRET is missing from environment variables");
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is missing' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`[Registration] User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log(`[Registration] Creating user object...`);
    const otpData = generateOtpData();
    const userData = {
      name,
      email,
      password,
      role: role || 'sender_receiver',
      sub_role: req.body.sub_role || 'sender',
      phone,
      dob,
      gender: gender || 'other',
      address,
      city,
      state,
      pincode,
      id_proof_type: idProofType,
      id_number: idNumber,
      id_photo: idPhoto,
      live_photo: livePhoto,
      profile_photo: profilePhoto || livePhoto,
      bio: req.body.bio,
      personal_otp: otpData.otp,
      personal_otp_expires_at: otpData.expiresAt,
      personal_otp_used: false
    };

    console.log(`[Registration] Attempting database save for: ${email}`);
    let user;
    try {
      user = await User.create(userData);
    } catch (dbErr) {
      console.error(`[Registration] DB Save Failed: ${dbErr.message}`);
      if (dbErr.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', errors: dbErr.errors });
      }
      if (dbErr.code === 11000) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      throw dbErr; // Let the outer catch handle other DB errors
    }

    if (user) {
      console.log(`[Registration] User saved successfully. Generating token...`);
      let token;
      try {
        token = generateToken(user._id);
      } catch (tokenErr) {
        console.error(`[Registration] Token generation failed: ${tokenErr.message}`);
        return res.status(500).json({ message: 'User created but token generation failed', error: tokenErr.message });
      }

      console.log(`[Registration] Registration complete for: ${email}`);
      // Return user data without the heavy photos to avoid hitting Vercel's response size limit
      res.status(201).json({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sub_role: user.sub_role,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        walletBalance: user.walletBalance,
        rating: user.rating,
        totalTrips: user.totalTrips,
        bio: user.bio,
        personalOtp: user.personalOtp || user.personal_otp,
        token: token,
      });
    } else {
      console.error('[Registration] User creation returned null result');
      res.status(400).json({ message: 'User registration failed: No user object created' });
    }
  } catch (error) {
    console.error(`[Registration] CRITICAL ERROR: ${error.stack || error.message}`);
    res.status(500).json({ 
      message: 'Internal Server Error during registration', 
      error: error.message,
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.personalOtp) {
        const otpData = generateOtpData();
        user.personalOtp = otpData.otp;
        user.personalOtpExpiresAt = otpData.expiresAt;
        user.personalOtpUsed = false;
        await user.save();
      }

      res.json({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sub_role: user.sub_role,
        phone: user.phone,
        walletBalance: user.walletBalance,
        aadharNumber: user.idNumber,
        profilePhoto: user.profilePhoto,
        vehicleType: user.vehicleType,
        bio: user.bio,
        rating: user.rating,
        totalTrips: user.totalTrips,
        personalOtp: user.personalOtp,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user with phone (OTP-based)
// @route   POST /api/users/login-otp
router.post('/login-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    let user = await User.findOne({ phone });

    if (!user) {
      console.log(`Auto-creating user for phone: ${phone}`);
      const otpData = generateOtpData();
      user = await User.create({
        name: phone,
        email: `${phone.replace('+', '')}@carrygo.com`,
        password: 'otp_verified_user',
        role: 'receiver',
        phone: phone,
        personalOtp: otpData.otp,
        personalOtpExpiresAt: otpData.expiresAt
      });
    }

    res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      walletBalance: user.walletBalance,
      rating: user.rating,
      totalTrips: user.totalTrips,
      personalOtp: user.personalOtp,
      token: generateToken(user._id),
    });
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
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.profilePhoto = req.body.profilePhoto || user.profilePhoto;
      user.sub_role = req.body.sub_role || user.sub_role;
      user.bio = req.body.bio || user.bio;
      user.dob = req.body.dob || user.dob;
      user.gender = req.body.gender || user.gender;
      user.address = req.body.address || user.address;
      user.city = req.body.city || user.city;
      user.state = req.body.state || user.state;
      user.pincode = req.body.pincode || user.pincode;
      user.idProofType = req.body.idProofType || user.idProofType;
      user.idNumber = req.body.idNumber || user.idNumber;
      user.idPhoto = req.body.idPhoto || user.idPhoto;
      user.livePhoto = req.body.livePhoto || user.livePhoto;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        sub_role: updatedUser.sub_role,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        gender: updatedUser.gender,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        idProofType: updatedUser.idProofType,
        idNumber: updatedUser.idNumber,
        idPhoto: updatedUser.idPhoto,
        livePhoto: updatedUser.livePhoto,
        profilePhoto: updatedUser.profilePhoto,
        walletBalance: updatedUser.walletBalance,
        rating: updatedUser.rating,
        totalTrips: updatedUser.totalTrips,
        bio: updatedUser.bio,
        personalOtp: updatedUser.personalOtp,
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

// @desc    Delete user profile
// @route   DELETE /api/users/profile
router.delete('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      await User.deleteOne({ _id: req.user._id });
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Generate a fresh personal OTP
// @route   POST /api/users/generate-otp
router.post('/generate-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpData = generateOtpData();
    user.personalOtp = otpData.otp;
    user.personalOtpExpiresAt = otpData.expiresAt;
    user.personalOtpUsed = false;
    await user.save();

    res.json({
      personalOtp: user.personalOtp,
      expiresAt: user.personalOtpExpiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
