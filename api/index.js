import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'YourSecretKey',
});

// Endpoint to create an order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt_1' } = req.body;

    const options = {
      amount: amount, // amount in the smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || error.error?.description || 'Failed to create order' });
  }
});

// Endpoint to verify payment signature
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // The signature verification logic
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || 'YourSecretKey')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid
      console.log('✅ Transaction Successful! Signature matched for Payment ID:', razorpay_payment_id);
      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      // Signature is invalid
      console.log('❌ Transaction Failed! Invalid signature for Payment ID:', razorpay_payment_id);
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

export default app;
