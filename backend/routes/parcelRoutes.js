const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create a new parcel
router.post('/', protect, async (req, res) => {
  try {
    const price = (req.body.weight || 1) * 50;
    const parcel = new Parcel({
      ...req.body,
      price: price,
      sender: req.user._id,
      senderName: req.user.name,
      senderPhone: req.user.phone,
      paymentStatus: req.body.paymentMethod === 'pay-now' ? 'paid' : 'unpaid'
    });
    const createdParcel = await parcel.save();
    res.status(201).json(createdParcel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get parcels
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'sender') {
      const parcels = await Parcel.find({ sender: req.user._id })
        .populate('traveller', 'name profilePhoto rating totalTrips bio')
        .sort({ createdAt: -1 });
      return res.json(parcels);
    }
    const { from, to } = req.query;
    let query = { status: 'pending' };
    if (from) query.fromLocation = { $regex: from, $options: 'i' };
    if (to) query.toLocation = { $regex: to, $options: 'i' };
    const parcels = await Parcel.find(query)
      .populate('sender', 'name profilePhoto rating totalTrips bio')
      .sort({ createdAt: -1 });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mydeliveries', protect, async (req, res) => {
  try {
    const parcels = await Parcel.find({ traveller: req.user._id })
      .populate('sender', 'name profilePhoto rating totalTrips bio')
      .sort({ createdAt: -1 });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/byphone/:phone', protect, async (req, res) => {
  try {
    const phone = req.params.phone;
    const cleanPhone = phone.replace('+91', '');
    const phoneWithPrefix = `+91${cleanPhone}`;
    const parcels = await Parcel.find({ 
      receiverPhone: { $in: [phone, cleanPhone, phoneWithPrefix] } 
    }).populate('sender', 'name profilePhoto rating totalTrips bio')
      .populate('traveller', 'name profilePhoto rating totalTrips bio')
      .sort({ createdAt: -1 });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update parcel status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    const newStatus = req.body.status || parcel.status;
    
    // Assignment logic
    if (req.body.travellerName && !parcel.travellerName) {
      parcel.travellerName = req.body.travellerName;
      parcel.traveller = req.user._id;
      parcel.travellerPhone = req.user.phone;
    }

    // OTP Generation
    if (newStatus === 'accepted' && !parcel.pickupOtp) {
      parcel.pickupOtp = "1234";
    }
    
    // OTP Verifications
    if (newStatus === 'in-transit' || newStatus === 'picked-up') {
       if (req.body.otp && req.body.otp !== parcel.pickupOtp) {
          return res.status(400).json({ message: 'Invalid Pickup OTP' });
       }
       if (!parcel.deliveryOtp) {
          parcel.deliveryOtp = "5678";
       }
    }

    if (newStatus === 'delivered' && (parcel.status === 'in-transit' || parcel.status === 'picked-up')) {
       if (req.body.otp && req.body.otp !== parcel.deliveryOtp) {
          return res.status(400).json({ message: 'Invalid Delivery OTP' });
       }
    }

    parcel.status = newStatus;
    const updatedParcel = await parcel.save();
    res.json(updatedParcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/payment', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    parcel.paymentStatus = req.body.status || parcel.paymentStatus;
    const updated = await parcel.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/release-payment', protect, async (req, res) => {
    try {
        const parcel = await Parcel.findById(req.params.id);
        if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
        if (parcel.paymentReleased) return res.status(400).json({ message: 'Already released' });
        
        if (parcel.traveller) {
            const traveller = await User.findById(parcel.traveller);
            if (traveller) {
                const amount = parcel.price || (parcel.weight * 50);
                traveller.walletBalance = (traveller.walletBalance || 0) + amount;
                await traveller.save();
            }
        }
        parcel.paymentReleased = true;
        parcel.status = 'completed';
        const updated = await parcel.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a parcel
router.put('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    
    // Check ownership
    if (parcel.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this parcel' });
    }

    // Only allow editing if pending
    if (parcel.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot edit parcel after it has been requested or accepted' });
    }

    const { fromLocation, toLocation, weight, size, itemCount, vehicleType, description, parcelPhoto } = req.body;
    
    parcel.fromLocation = fromLocation || parcel.fromLocation;
    parcel.toLocation = toLocation || parcel.toLocation;
    parcel.weight = weight || parcel.weight;
    parcel.size = size || parcel.size;
    parcel.itemCount = itemCount || parcel.itemCount;
    parcel.vehicleType = vehicleType || parcel.vehicleType;
    parcel.description = description || parcel.description;
    parcel.parcelPhoto = parcelPhoto || parcel.parcelPhoto;

    // Recalculate price if weight changed
    if (weight) {
      parcel.price = weight * 50;
    }

    const updatedParcel = await parcel.save();
    res.json(updatedParcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    if (parcel.sender.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });
    await Parcel.deleteOne({ _id: req.params.id });
    res.json({ message: 'Parcel removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
