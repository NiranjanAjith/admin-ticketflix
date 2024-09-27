const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();

const app = express();
app.use(express.json());

const PHONEPE_API_URL = process.env.PHONEPE_API_URL;
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX;

const generateChecksum = (base64Payload) => {
  const string = `${base64Payload}/pg/v1/pay${SALT_KEY}`;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  return `${sha256}###${SALT_INDEX}`;
};

app.post('/api/initiate-payment', async (req, res) => {
  try {
    const {
      amount,
      mobileNumber,
      email,
      name,
      prebookingId,
      movieName,
      numberOfSeats,
      class: seatClass,
      firstPreference,
      secondPreference,
      thirdPreference,
      location,
      executiveCode,
      movieId
    } = req.body;

    if (!amount || !mobileNumber || !email || !name || !prebookingId || !movieName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transactionId = `Tr-${uuidv4().toString(36).slice(-6)}`;
    const merchantUserId = `MUID-${uuidv4().toString(36).slice(-6)}`;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: merchantUserId,
      amount: Math.round(amount * 100),
      redirectUrl: `${process.env.BASE_URL}/api/payment-status/${transactionId}`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.BASE_URL}/api/payment-callback`,
      mobileNumber,
      paymentInstrument: { type: 'PAY_PAGE' },
      email,
      deviceContext: {
        deviceOS: 'WEB'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = generateChecksum(base64Payload);

    const response = await axios.post(
      PHONEPE_API_URL,
      { request: base64Payload },
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum
        }
      }
    );

    // Store prebooking data in Firestore
    const prebookData = {
      name,
      phone: mobileNumber,
      email,
      location,
      firstPreference,
      secondPreference,
      thirdPreference,
      class: seatClass,
      executiveCode,
      numberOfSeats,
      movieId,
      amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      transactionId,
      paymentStatus: 'INITIATED'
    };

    await db.collection('prebook').doc(prebookingId).set(prebookData);

    res.json({ redirectUrl: response.data.data.instrumentResponse.redirectInfo.url });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'An error occurred while initiating the payment' });
  }
});

app.post('/api/payment-status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  const paymentStatus = req.body;
  console.log(`Payment status for ${transactionId}:`, paymentStatus);

  try {
    // Update payment status in Firestore
    const prebookQuery = await db.collection('prebook').where('transactionId', '==', transactionId).get();
    
    if (!prebookQuery.empty) {
      const prebookDoc = prebookQuery.docs[0];
      await prebookDoc.ref.update({
        paymentStatus: paymentStatus.code === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILURE',
        paymentDetails: paymentStatus
      });

      // Determine redirect URL based on payment status
      const redirectUrl = paymentStatus.code === 'PAYMENT_SUCCESS'
        ? `${process.env.FRONTEND_URL}/success`
        : `${process.env.FRONTEND_URL}/failure`;

      res.redirect(redirectUrl);
    } else {
      console.error(`No prebooking found for transactionId: ${transactionId}`);
      res.redirect(`${process.env.FRONTEND_URL}/failure`);
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.redirect(`${process.env.FRONTEND_URL}/failure`);
  }
});

app.post('/api/payment-callback', async (req, res) => {
  const callbackData = req.body;
  console.log('Payment callback received:', callbackData);
  
  // Process callback data if needed
  // This endpoint can be used for additional server-side logic
  
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});