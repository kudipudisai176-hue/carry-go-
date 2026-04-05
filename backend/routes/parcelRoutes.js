const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const { sendSMS } = require('../services/smsService');

// @desc    Create a new parcel
router.post('/', protect, async (req, res) => {
  try {
    let weightVal = 1;
    try {
      weightVal = parseFloat(req.body.weight || req.body.weightVal || 1);
      if (isNaN(weightVal)) weightVal = 1;
    } catch (e) {
      weightVal = 1;
    }
    
    const parcel_charge = Math.max(0, weightVal * 50);
    const platform_fee = Math.round(parcel_charge * 0.10); // 10% fee rounded
    const totalPrice = parcel_charge + platform_fee;

    // 🤝 Link receiver if they are ALREADY a registered user (Correct Architecture)
    const receiver_phone = req.body.receiver_phone || req.body.receiverPhone;
    const cleanPhone = receiver_phone?.replace('+91', '');
    const phoneWithPrefix = `+91${cleanPhone}`;
    const receiverUser = await User.findOne({ 
      phone: { $in: [receiver_phone, cleanPhone, phoneWithPrefix] } 
    });

    // 🧊 Data Normalization (Point 2)
    const createdParcel = await Parcel.create({
      from_location: (req.body.from_location || req.body.fromLocation)?.toLowerCase().trim() || "",
      to_location: (req.body.to_location || req.body.toLocation)?.toLowerCase().trim() || "",
      village: req.body.village?.toLowerCase().trim() || "",
      city: req.body.city?.toLowerCase().trim() || "",
      description: req.body.description || "",
      weight: parseFloat(req.body.weight) || 1,
      size: req.body.size || "",
      item_count: req.body.item_count || req.body.itemCount || 1,
      vehicle_type: req.body.vehicle_type || req.body.vehicleType || "",
      parcel_photo: req.body.parcel_photo || req.body.parcelPhoto || "",
      receiver_name: req.body.receiver_name || req.body.receiverName || "",
      receiver_phone: receiver_phone || "",
      parcel_charge: parcel_charge,
      platform_fee: platform_fee,
      price: totalPrice,
      sender_id: req.user._id,
      receiver_id: receiverUser ? receiverUser._id : null,
      sender_name: (req.user && (req.user.name || req.user.full_name)) || "Sender",
      sender_phone: (req.user && req.user.phone) || "9999999999",
      payment_method: req.body.payment_method || req.body.paymentMethod || 'pay-now',
      payment_status: 'paid', // 💸 Payment handled outside or skipped (User request)
      status: 'open_for_travellers', // 🚀 Go live immediately
      escrow_status: 'none',
      pickup_otp: Math.floor(1000 + Math.random() * 9000).toString(),
      delivery_otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    // 📱 Send SMS in background (don't wait)
    const smsMessage = `Your CarryGo OTP is ${createdParcel.delivery_otp} for parcel delivery from ${req.user.name}. Track: ${process.env.FRONTEND_URL}/sender`;
    sendSMS(createdParcel.receiver_phone, smsMessage).catch(err => console.error("Initial Receiver SMS failed:", err.message));

    res.status(201).json(createdParcel);
  } catch (error) {
    console.error("[Parcel Route] Creation Error Detail:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      body: req.body
    });
    res.status(400).json({ 
      message: error.message, 
      details: error.details,
      code: error.code 
    });
  }
});

// @desc    Simulate Payment Success
router.post('/:id/simulate-payment', protect, async (req, res) => {
  try {
    console.log(`[Parcel Route] Simulating payment for ID: ${req.params.id}`);
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
       console.error(`[Parcel Route] Payment Simulation Failed: Parcel not found (ID: ${req.params.id})`);
       return res.status(404).json({ message: 'Parcel not found' });
    }
    
    if (parcel.payment_status === 'paid') {
      return res.status(400).json({ message: 'Parcel is already paid' });
    }

    console.log(`[Parcel Route] Setting parcel ${parcel.id} to PAID`);
    parcel.payment_status = 'paid';
    parcel.status = 'open_for_travellers';
    await parcel.save();

    console.log(`[Parcel Route] Creating payment record for parcel: ${parcel.id}`);
    await Payment.create({
      parcel_id: parcel._id,
      sender_id: req.user._id,
      amount: parcel.price,
      payment_status: 'paid',
      escrow_status: 'held',
      paymentGatewayId: 'sim_' + Date.now(),
    });

    res.json(parcel);
  } catch (error) {
    console.error(`[Parcel Route] Simulation Error:`, error.message);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get parcels
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { mode, from, to, city, village, search } = req.query;

    if (mode === 'sender') {
      const parcels = await Parcel.find({ sender_id: userId });

      console.log(`[Parcel API] Found ${parcels.length} parcels for sender ${userId}`);
      return res.json(parcels);
    }

    if (mode === 'receiver') {
       const userPhone = req.user.phone || "";
       const cleanUserPhone = userPhone.replace('+91', '');
       const prefixedUserPhone = `+91${cleanUserPhone}`;

       const parcels = await Parcel.find({ 
          $or: [
             { receiver_id: req.user._id },
             { receiver_phone: userPhone },
             { receiver_phone: cleanUserPhone },
             { receiver_phone: prefixedUserPhone }
          ]
       });
      return res.json(parcels);
    }
    
    let query = { 
      status: 'open_for_travellers',
      sender_id: { $ne: req.user._id }
    };
    
    if (search) {
      const searchPattern = search.trim();
      query.$or = [
        { from_location: { $regex: searchPattern, $options: 'i' } },
        { to_location: { $regex: searchPattern, $options: 'i' } },
        { description: { $regex: searchPattern, $options: 'i' } }
      ];
    }

    if (from && from !== 'undefined') {
       query.from_location = { $regex: from.trim(), $options: 'i' };
    }
    if (to && to !== 'undefined') {
       query.to_location = { $regex: to.trim(), $options: 'i' };
    }
    if (city && city !== 'undefined') {
      query.city = { $regex: city.trim(), $options: 'i' };
    }
    if (village && village !== 'undefined') {
      query.village = { $regex: village.trim(), $options: 'i' };
    }

    const parcels = await Parcel.find(query);
    
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get parcel by ID
router.get('/id/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    res.json(parcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/mydeliveries', protect, async (req, res) => {
  try {
    const parcels = await Parcel.find({ traveller_id: req.user._id });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/byphone/:phone', protect, async (req, res) => {
  try {
    const phone = req.params.phone;
    if (req.user.phone !== phone) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const cleanPhone = phone.replace('+91', '');
    const phoneWithPrefix = `+91${cleanPhone}`;
    const parcels = await Parcel.find({ 
      receiver_phone: { $in: [phone, cleanPhone, phoneWithPrefix] } 
    });
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
    
    if (req.body.traveller_name && !parcel.traveller_name) {
      parcel.traveller_name = req.body.traveller_name;
      parcel.traveller_id = req.user._id;
      parcel.traveller_phone = req.user.phone;
    }

    if (newStatus === 'accepted' && !parcel.pickup_otp) {
      // 🛡️ [Security] Fallback to a random 4-digit code if somehow missing
      parcel.pickup_otp = Math.floor(1000 + Math.random() * 9000).toString();
    }
    
    if (newStatus === 'in-transit' || newStatus === 'picked-up') {
       // [Removed OTP check as requested by User]
       
       if (req.body.pickup_photo || req.body.pickupPhoto || req.body.photoBase64) {
          parcel.pickup_photo = req.body.pickup_photo || req.body.pickupPhoto || req.body.photoBase64;
       }

       if (!parcel.delivery_otp) {
          parcel.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
       }
       // 📱 SMS Trigger on Pickup
       const pickupMsg = `🚚 Your parcel is on the way! From: ${parcel.sender_name}. Route: ${parcel.from_location} → ${parcel.to_location}. Delivery OTP: ${parcel.delivery_otp}`;
       try { await sendSMS(parcel.receiver_phone, pickupMsg); } catch (e) { console.error("Pickup SMS failed", e.message); }
    }

    if (newStatus === 'delivered') {
       if (parcel.traveller_id && parcel.traveller_id.toString() !== req.user._id.toString()) {
          return res.status(401).json({ message: 'Only assigned traveller can confirm delivery' });
       }

        if (!req.body.otp) {
           return res.status(400).json({ message: '4-digit Handover OTP is required' });
        }

        // Standard Delivery OTP check (4-digit)
        const isStandardOtpMatch = req.body.otp === parcel.delivery_otp;
        
        // Receiver Personal OTP fallback check (for those who miss SMS)
        let isPersonalOtpMatch = false;
        try {
           const receiver = await User.findOne({ phone: parcel.receiver_phone });
           if (receiver && receiver.personalOtp && req.body.otp === receiver.personalOtp) {
              isPersonalOtpMatch = true;
           }
        } catch (e) {
           console.warn("Receiver fallback check skipped:", e.message);
        }

        if (!isStandardOtpMatch && !isPersonalOtpMatch) {
            return res.status(400).json({ message: 'Invalid Handover OTP. Please ask the receiver for the 4-digit code.' });
        }
        
        // 📸 REQUIRE PHOTO PROOF
        if (!req.body.delivery_photo && !req.body.deliveryPhoto) {
           return res.status(400).json({ message: 'Photo proof of delivery is mandatory for secure handover.' });
        }
        
       if (req.body.delivery_photo || req.body.deliveryPhoto || req.body.photoBase64) {
          parcel.delivery_photo = req.body.delivery_photo || req.body.deliveryPhoto || req.body.photoBase64;
       }

       if (parcel.payment_status === 'paid' && parcel.escrow_status === 'held') {
         try {
           const traveller = await User.findById(parcel.traveller_id);
           if (traveller) {
             const amount = parcel.parcel_charge;
             let wallet = await Wallet.findOne({ user_id: traveller._id });
             if (!wallet) {
               wallet = await Wallet.create({ user_id: traveller._id, balance: 0 });
             }
             wallet.balance += amount;
             wallet.last_updated = Date.now();
             await wallet.save();

             await Payment.updateMany(
               { parcel_id: parcel._id, payment_status: 'paid' },
               { $set: { escrow_status: 'released' } }
             );

             parcel.escrow_status = 'released';
             parcel.payment_released = true;
           }
         } catch (payErr) {
           console.error("Payment release failed during delivery:", payErr.message);
         }
       }
    }

    if (newStatus === 'arrived') {
       // Optional: Add logging or specific logic for arrival
       console.log(`[Parcel Status] Parcel ${parcel._id} marked as ARRIVED at destination.`);
    }

    if (newStatus === 'received') {
       if (req.body.received_photo || req.body.receivedPhoto || req.body.photoBase64) {
          parcel.received_photo = req.body.received_photo || req.body.receivedPhoto || req.body.photoBase64;
       }
       if (req.body.receiver_rating || req.body.receiverRating) {
          parcel.receiver_rating = req.body.receiver_rating || req.body.receiverRating;
       }
    }

    parcel.status = newStatus;
    const updatedParcel = await parcel.save();

    // 🔔 Fire notifications in background (don't wait)
    (async () => {
      try {
        if (newStatus === 'requested') {
          await Notification.create({
            recipient_id: parcel.sender_id,
            title: "New Delivery Request!",
            message: `${req.user.name} wants to carry your parcel reaching ${parcel.to_location}.`,
            type: 'parcel_requested',
            reference_id: parcel._id
          });
        } else if (newStatus === 'accepted') {
          await Notification.create({
            recipient_id: parcel.traveller_id,
            title: "Request Approved!",
            message: `Sender approved your request for parcel to ${parcel.to_location}.`,
            type: 'parcel_accepted',
            reference_id: parcel._id
          });
        } else if (newStatus === 'in-transit') {
          await Notification.create({
            recipient_id: parcel.sender_id,
            title: "Parcel In Transit 🚚",
            message: `Your parcel to ${parcel.to_location} has been picked up & is on the way.`,
            type: 'transit_started',
            reference_id: parcel._id
          });
        } else if (newStatus === 'delivered') {
          await Notification.create({
            recipient_id: parcel.sender_id,
            title: "Parcel Delivered! 🎉",
            message: `Your parcel has been successfully delivered to ${parcel.receiver_name}.`,
            type: 'delivered',
            reference_id: parcel._id
          });
        } else if (newStatus === 'arrived') {
          await Notification.create({
            recipient_id: parcel.sender_id,
            title: "Almost There! 📍",
            message: `Your traveller has arrived at the destination for your parcel to ${parcel.to_location}.`,
            type: 'parcel_arrived',
            reference_id: parcel._id
          });
          
          if (parcel.receiver_id) {
            await Notification.create({
              recipient_id: parcel.receiver_id,
              title: "Arrived! 📦",
              message: `The traveller has arrived with your parcel from ${parcel.sender_name}. Please provide the Delivery OTP to complete the handover.`,
              type: 'parcel_arrived',
              reference_id: parcel._id
            });
          }
        } else if (newStatus === 'received') {
          await Notification.create({
            recipient_id: parcel.sender_id,
            title: "Confirmed & Received! ✅",
            message: `${parcel.receiver_name} has confirmed the delivery and rated the service ${parcel.receiver_rating}/5.`,
            type: 'received',
            reference_id: parcel._id
          });
        }
      } catch (notifErr) { 
        console.error("Non-blocking notification trigger failed:", notifErr.message); 
      }
    })();

    res.json(updatedParcel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/payment', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    parcel.payment_status = req.body.status || req.body.payment_status || parcel.payment_status;
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
        if (parcel.payment_released) return res.status(400).json({ message: 'Already released' });
        
        if (parcel.traveller_id) {
            const traveller = await User.findById(parcel.traveller_id);
            if (traveller) {
                const amount = parcel.price || (parcel.weight * 50);
                traveller.walletBalance = (traveller.walletBalance || 0) + (amount / 2); 
                await traveller.save();
            }
        }
        parcel.payment_released = true;
        parcel.status = 'completed';
        const updated = await parcel.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:id/generate-delivery-otp', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    
    if (parcel.traveller_id && parcel.traveller_id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    parcel.delivery_otp = otp;
    parcel.delivery_otp_expiry = new Date(Date.now() + 60 * 1000);

    await parcel.save();
    res.json({ otp, expiry: parcel.delivery_otp_expiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });
    
    if (!parcel.sender_id || (parcel.sender_id.toString() !== req.user._id.toString())) {
      return res.status(401).json({ message: 'Not authorized to edit this parcel' });
    }

    if (parcel.status !== 'pending' && parcel.status !== 'pending_payment' && parcel.status !== 'open_for_travellers') {
      return res.status(400).json({ message: 'Cannot edit parcel after it has been requested' });
    }

    const { 
      from_location, to_location, city, village, weight, size, 
      item_count, vehicle_type, description, parcel_photo,
      receiver_name, receiver_phone
    } = req.body;
    
    parcel.from_location = from_location || req.body.fromLocation || parcel.from_location;
    parcel.to_location = to_location || req.body.toLocation || parcel.to_location;
    parcel.city = city || parcel.city;
    parcel.village = village || parcel.village;
    parcel.weight = weight || parcel.weight;
    parcel.size = size || parcel.size;
    parcel.item_count = item_count || req.body.itemCount || parcel.item_count;
    parcel.vehicle_type = vehicle_type || req.body.vehicleType || parcel.vehicle_type;
    parcel.description = description || parcel.description;
    parcel.parcel_photo = parcel_photo || req.body.parcelPhoto || parcel.parcel_photo;
    parcel.receiver_name = receiver_name || req.body.receiverName || parcel.receiver_name;
    parcel.receiver_phone = receiver_phone || req.body.receiverPhone || parcel.receiver_phone;

    if (weight) {
      const p_charge = weight * 50;
      const p_fee = Math.round(p_charge * 0.10);
      parcel.parcel_charge = p_charge;
      parcel.platform_fee = p_fee;
      parcel.price = p_charge + p_fee;
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
    
    if (!parcel.sender_id || (parcel.sender_id.toString() !== req.user._id.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Parcel.deleteOne({ id: req.params.id });
    res.json({ message: 'Parcel removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
