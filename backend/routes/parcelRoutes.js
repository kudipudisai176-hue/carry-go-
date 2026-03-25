const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');

// @desc    Create a new parcel
router.post('/', protect, async (req, res) => {
  try {
    const weightVal = req.body && req.body.weight ? parseFloat(req.body.weight) : 1;
    const parcelCharge = weightVal * 50;
    const platformFee = Math.round(parcelCharge * 0.10); // 10% fee rounded
    const totalPrice = parcelCharge + platformFee;

    // 🤝 Link receiver if they are ALREADY a registered user (Correct Architecture)
    const receiverPhone = req.body.receiverPhone;
    const cleanPhone = receiverPhone?.replace('+91', '');
    const phoneWithPrefix = `+91${cleanPhone}`;
    const receiverUser = await User.findOne({ 
      phone: { $in: [receiverPhone, cleanPhone, phoneWithPrefix] } 
    });

    // 🧊 Data Normalization (Point 2)
    const normalizedBody = {
       ...(req.body || {}),
       fromLocation: req.body.fromLocation?.toLowerCase().trim() || "",
       toLocation: req.body.toLocation?.toLowerCase().trim() || "",
       village: req.body.village?.toLowerCase().trim() || "",
       city: req.body.city?.toLowerCase().trim() || "",
    };

    const parcel = new Parcel({
      ...normalizedBody,
      parcelCharge: parcelCharge,
      platformFee: platformFee,
      price: totalPrice,
      sender: req.user._id,
      receiver: receiverUser ? receiverUser._id : undefined,
      senderName: req.user.name,
      senderPhone: req.user.phone,
      paymentMethod: 'pay-now', // Fixed for escrow
      paymentStatus: 'pending',
      status: 'pending_payment',
      escrow_status: 'held',
      pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(), // 4-digit pickup
      deliveryOtp: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit delivery (Point 2)
    });
    const createdParcel = await parcel.save();

    // 🔔 Notify Receiver (Point 7)
    try {
      await Notification.create({
        phone: createdParcel.receiverPhone, // Using phone for unlinked users
        title: "📦 New Parcel Assigned",
        message: `From: ${req.user.name}. Route: ${createdParcel.fromLocation} → ${createdParcel.toLocation}.`,
        type: 'new_parcel',
        referenceId: createdParcel._id
      });
      console.log(`Notification sent to receiver phone: ${createdParcel.receiverPhone}`);
    } catch (notifErr) { console.error("Receiver Notification failed:", notifErr.message); }

    res.status(201).json(createdParcel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Simulate Payment Gateway Success (Escrow)
router.post('/:id/simulate-payment', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    
    if (parcel.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Parcel is already paid' });
    }

    // Update Parcel
    parcel.paymentStatus = 'paid';
    parcel.status = 'open_for_travellers';
    await parcel.save();

    // Create Payment Record
    await Payment.create({
      parcel: parcel._id,
      sender: req.user._id,
      amount: parcel.price,
      payment_status: 'paid',
      escrow_status: 'held',
      paymentGatewayId: 'sim_' + Date.now(),
    });

    res.json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get parcels (Role-agnostic Sent vs Search)
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { mode, from, to, city, village, search } = req.query;

    // 1. If 'mode=sender' is passed (used by Sender Dashboard), always return OWN sent parcels
    if (mode === 'sender') {
      const parcels = await Parcel.find({ sender: userId })
        .populate('traveller', 'name profilePhoto rating totalTrips bio')
        .sort({ createdAt: -1 });
      return res.json(parcels);
    }

    // 1b. If 'mode=receiver' is passed, return parcels assigned to this user (Correct Architecture)
    if (mode === 'receiver') {
       // Case: Look for all parcels where current user is receiver (by ID or Phone)
       const userPhone = req.user.phone || "";
       const cleanUserPhone = userPhone.replace('+91', '');
       const prefixedUserPhone = `+91${cleanUserPhone}`;

       const parcels = await Parcel.find({ 
          $or: [
             { receiver: req.user._id },
             { receiverPhone: userPhone },
             { receiverPhone: cleanUserPhone },
             { receiverPhone: prefixedUserPhone }
          ]
       }).populate('sender', 'name profilePhoto rating totalTrips bio')
        .populate('traveller', 'name profilePhoto rating totalTrips bio')
        .sort({ createdAt: -1 });
      return res.json(parcels);
    }
    
    // 2. Otherwise: Traveller search logic (Finding parcels to carry) (Point 1 & 5)
    let query = { 
      status: 'open_for_travellers',
      sender: { $ne: req.user._id } // Don't show your own parcels to carry
    };
    
    // 🔍 Build Dynamic Query
    if (search) {
      const searchPattern = search.trim();
      query.$or = [
        { fromLocation: { $regex: searchPattern, $options: 'i' } },
        { toLocation: { $regex: searchPattern, $options: 'i' } },
        { description: { $regex: searchPattern, $options: 'i' } }
      ];
    }

    // Build Dynamic Query using destuctured variables from line 106

    if (from && from !== 'undefined') {
       query.fromLocation = { $regex: from.trim(), $options: 'i' };
    }
    if (to && to !== 'undefined') {
       query.toLocation = { $regex: to.trim(), $options: 'i' };
    }
    if (city && city !== 'undefined') {
      query.city = { $regex: city.trim(), $options: 'i' };
    }
    if (village && village !== 'undefined') {
      query.village = { $regex: village.trim(), $options: 'i' };
    }

    console.log("📍 [ParcelSearch] Filter applied:", JSON.stringify(query));

    const parcels = await Parcel.find(query)
      .populate('sender', 'name profilePhoto rating totalTrips bio')
      .populate('traveller', 'name profilePhoto rating totalTrips bio')
      .sort({ createdAt: -1 });
    
    console.log(`✅ [ParcelSearch] Found ${parcels.length} matching parcels.`);
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get parcel by ID
router.get('/id/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('sender', 'name profilePhoto rating totalTrips bio')
      .populate('traveller', 'name profilePhoto rating totalTrips bio');
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    res.json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Simulate Payment (Point 8)
router.post('/:id/simulate-payment', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    parcel.paymentStatus = 'paid';
    parcel.status = 'open_for_travellers';
    await parcel.save();

    res.json(parcel);
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
    
    // Security: Only allow user to fetch their OWN parcels (Point 8)
    if (req.user.phone !== phone) {
      console.warn(`Unauthorized access attempt by ${req.user.phone} for parcels of ${phone}`);
      return res.status(401).json({ message: 'Not authorized to view these parcels' });
    }

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

    // OTP Generation: Use Sender's Fixed Personal OTP
    if (newStatus === 'accepted' && !parcel.pickupOtp) {
      const sender = await User.findById(parcel.sender);
      parcel.pickupOtp = (sender && sender.personalOtp) ? sender.personalOtp : "1234";
    }
    
    // OTP Verifications
    if (newStatus === 'in-transit' || newStatus === 'picked-up') {
       const sender = await User.findById(parcel.sender);
       if (!sender) return res.status(404).json({ message: 'Sender not found' });
       
       if (!req.body.otp || req.body.otp !== sender.personalOtp) {
          return res.status(400).json({ message: 'Invalid OTP' });
       }
       
       // Removed personalOtpUsed check for Permanent OTP logic (Point 12)
       // Removed OTP expiry check for permanent OTP logic (Correct Architecture)


       // Mark as used immediately upon successful verification
       // sender.personalOtpUsed = true; // Removed as per instruction
       await sender.save();

       if (!parcel.deliveryOtp) {
          parcel.deliveryOtp = "5678";
       }
    }

    if (newStatus === 'delivered') {
       // Check if this is the assigned traveller
       if (parcel.traveller && parcel.traveller.toString() !== req.user._id.toString()) {
          return res.status(401).json({ message: 'Only assigned traveller can confirm delivery' });
       }

       if (!req.body.otp) {
          console.warn(`❌ [DeliveryConfirm] Missing OTP for parcel ${req.params.id}`);
          return res.status(400).json({ message: 'OTP is required for delivery' });
       }

       console.log(`🔑 [DeliveryConfirm] Provided OTP: ${req.body.otp} | Required DB OTP: ${parcel.deliveryOtp}`);

        if (req.body.otp !== parcel.deliveryOtp) {
           // Fallback: Check if receiver is a user and if their permanent OTP matches
           const receiver = await User.findOne({ phone: parcel.receiverPhone });
           const receiverPersonalOtp = receiver?.personalOtp;
           console.log(`🔑 [DeliveryConfirm] Fallback Check - Receiver Personal OTP: ${receiverPersonalOtp}`);

           if (!receiver || req.body.otp !== receiverPersonalOtp) {
              console.error(`❌ [DeliveryConfirm] Invalid OTP for parcel ${req.params.id}`);
              return res.status(400).json({ message: 'Invalid Delivery OTP' });
           }
        }
        console.log(`✅ [DeliveryConfirm] OTP Verified for parcel ${req.params.id}`);
        
        // Removed expiry check for Permanent OTP logic
       
       if (req.body.deliveryPhoto) {
          parcel.deliveryPhoto = req.body.deliveryPhoto;
       }

       // 💰 Payment Integration: Auto-release payment to traveller's Wallet (Escrow Release)
       if (parcel.paymentStatus === 'paid' && parcel.escrow_status === 'held') {
         try {
           const traveller = await User.findById(parcel.traveller);
           if (traveller) {
             const amount = parcel.parcelCharge; // Traveller gets the base charge, platform keeps fee
             
             // Update or Create Wallet
             let wallet = await Wallet.findOne({ user: traveller._id });
             if (!wallet) {
               wallet = new Wallet({ user: traveller._id, balance: 0 });
             }
             wallet.balance += amount;
             wallet.last_updated = Date.now();
             await wallet.save();

             // Update Payment Log
             await Payment.updateMany(
               { parcel: parcel._id, payment_status: 'paid' },
               { $set: { escrow_status: 'released' } }
             );

             parcel.escrow_status = 'released';
             parcel.paymentReleased = true;
             
             console.log(`Payment of ₹${amount} released to traveller ${traveller.name}'s wallet`);
           }
         } catch (payErr) {
           console.error("Payment release failed during delivery:", payErr.message);
         }
       }
    }

    if (newStatus === 'received') {
       if (req.body.receivedPhoto) {
          parcel.receivedPhoto = req.body.receivedPhoto;
       }
       if (req.body.receiverRating) {
          parcel.receiverRating = req.body.receiverRating;
       }
    }

    parcel.status = newStatus;
    const updatedParcel = await parcel.save();

    // 🔔 Create In-App Notification
    try {
      if (newStatus === 'requested') {
         await Notification.create({
           recipient: parcel.sender,
           title: "New Delivery Request!",
           message: `${req.user.name} wants to carry your parcel to ${parcel.toLocation}.`,
           type: 'parcel_requested',
           referenceId: parcel._id
         });
      } else if (newStatus === 'accepted') {
         await Notification.create({
           recipient: parcel.traveller,
           title: "Request Approved!",
           message: `Sender approved your request for parcel to ${parcel.toLocation}.`,
           type: 'parcel_accepted',
           referenceId: parcel._id
         });
      } else if (newStatus === 'in-transit') {
         await Notification.create({
           recipient: parcel.sender,
           title: "Parcel In Transit 🚚",
           message: `Your parcel to ${parcel.toLocation} has been picked up & is on the way.`,
           type: 'transit_started',
           referenceId: parcel._id
         });
      } else if (newStatus === 'delivered') {
         await Notification.create({
           recipient: parcel.sender,
           title: "Parcel Delivered! 🎉",
           message: `Your parcel has been successfully delivered to ${parcel.receiverName}.`,
           type: 'delivered',
           referenceId: parcel._id
         });
      } else if (newStatus === 'received') {
         // Notify sender that receiver has confirmed and rated (Point 11)
         await Notification.create({
           recipient: parcel.sender,
           title: "Confirmed & Received! ✅",
           message: `${parcel.receiverName} has confirmed the delivery and rated the service ${parcel.receiverRating}/5.`,
           type: 'received',
           referenceId: parcel._id
         });
      }
    } catch (notifErr) { console.error("Notification trigger failed:", notifErr); }

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
                traveller.walletBalance = (traveller.walletBalance || 0) + (amount / 2); 
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

// @desc    Generate a new 6-digit delivery OTP (Point 2)
router.post('/:id/generate-delivery-otp', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    
    // Only assigned traveller can generate the OTP at the handover
    if (parcel.traveller && parcel.traveller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    parcel.deliveryOtp = otp;
    parcel.deliveryOtpExpiry = new Date(Date.now() + 60 * 1000); // 60 seconds

    await parcel.save();
    
    // In a real app, this would be sent via SMS/Email to the receiver
    // For this prototype, we return it so it can be shown on the traveller's screen 
    // or simulate sending it.
    res.json({ otp, expiry: parcel.deliveryOtpExpiry });
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
    if (!parcel.sender || (parcel.sender.toString() !== req.user._id.toString())) {
      console.log('User not authorized to edit this parcel');
      return res.status(401).json({ message: 'Not authorized to edit this parcel' });
    }

    // Only allow editing if pending
    if (parcel.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot edit parcel after it has been requested or accepted' });
    }

    const { fromLocation, toLocation, city, village, weight, size, itemCount, vehicleType, description, parcelPhoto } = req.body;
    
    parcel.fromLocation = fromLocation || parcel.fromLocation;
    parcel.toLocation = toLocation || parcel.toLocation;
    parcel.city = city || parcel.city;
    parcel.village = village || parcel.village;
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
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    if (!parcel.sender || (parcel.sender.toString() !== req.user._id.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Parcel.deleteOne({ _id: req.params.id });
    res.json({ message: 'Parcel removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
