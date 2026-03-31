const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const Parcel = require('../models/Parcel'); // Corrected path

// ✅ Initiate PhonePe Payment (MOCKED FOR DEMO)
router.post('/initiate', async (req, res) => {
  try {
    const { amount, userId, parcelId } = req.body;
    const transactionId = uuidv4();

    console.log('--- MOCK Payment Initiation ---');
    console.log('Amount:', amount);
    console.log('Parcel ID:', parcelId);

    // Bypass real PhonePe API and return a local redirect
    const redirectUrl = `${process.env.FRONTEND_URL}/payment/status?txnId=DEMO_${transactionId}&parcelId=${parcelId}`;
    
    console.log('Mock Redirect URL:', redirectUrl);

    res.json({ 
      success: true, 
      redirectUrl, 
      transactionId: `DEMO_${transactionId}` 
    });

  } catch (error) {
    console.error('Payment Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Payment initiation failed',
      details: error.message
    });
  }
});

// ✅ Check Payment Status (HANDLES MOCK TRANSACTIONS)
router.get('/status/:txnId', async (req, res) => {
  try {
    const { txnId } = req.params;
    const { parcelId } = req.query;

    console.log(`Checking status for ${txnId} (Parcel: ${parcelId})`);

    // Handle Mock Success for demo
    if (txnId.startsWith('DEMO_')) {
      console.log('✅ DEMO MODE: Mocking successful payment update');
      
      // Update parcel status in DB (move from pending_payment → pending)
      await Parcel.updateMany(
        { id: parcelId },
        { status: 'pending', payment_status: 'paid' }
      );

      return res.json({ 
        success: true,
        code: 'PAYMENT_SUCCESS', 
        message: 'DEMO MODE: Payment simulation successful',
        data: {
          merchantTransactionId: txnId,
          amount: 0, // Not relevant for demo
          state: 'COMPLETED'
        }
      });
    }

    // Real Status Check Logic (Bypassed if DEMO_)
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;
    const path = `/pg/v1/status/${merchantId}/${txnId}`;
    const checksum = crypto
      .createHash('sha256')
      .update(path + saltKey)
      .digest('hex') + '###' + saltIndex;

    const response = await axios.get(
      `${process.env.PHONEPE_BASE_URL}${path}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': merchantId
        }
      }
    );

    const paymentData = response.data;

    if (paymentData.code === 'PAYMENT_SUCCESS') {
      await Parcel.updateMany(
        { id: parcelId },
        { status: 'pending', payment_status: 'paid' }
      );
    }

    res.json(paymentData);

  } catch (error) {
    console.error('Status Check Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Status check failed' });
  }
});

// ✅ Callback (Webhook from PhonePe)
router.post('/callback', async (req, res) => {
  try {
    const { response } = req.body;
    const decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));

    console.log('PhonePe Callback:', decoded);

    if (decoded.code === 'PAYMENT_SUCCESS') {
      // Update DB here if needed (status check is also doing this)
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
