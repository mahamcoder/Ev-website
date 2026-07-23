import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

dotenv.config();

// --- Firebase Admin SDK init (bypasses Firestore Security Rules) ---
let db;
try {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!jsonStr) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env variable is missing');
  }

  const serviceAccount = JSON.parse(jsonStr);
  // Vercel env vars sometimes store the private key with literal \n instead of real newlines
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }

  db = getFirestore();
  console.log('✅ Firebase Admin initialized successfully (project:', serviceAccount.project_id, ')');
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
}

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

// Endpoint to verify payment signature and atomically update Firestore
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, amount, projectId } = req.body;

    // The signature verification logic
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || 'YourSecretKey')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      console.log('✅ Transaction Successful! Signature matched for Payment ID:', razorpay_payment_id);

      try {
        if (!db) {
          throw new Error('Firestore Admin DB was not initialized (check FIREBASE_SERVICE_ACCOUNT_JSON)');
        }

        let activeProjectRef;
        let activeProjectId = projectId || '';

        if (activeProjectId) {
          activeProjectRef = db.collection('projects').doc(activeProjectId);
        } else {
          // Fallback: use the first project if no active project is passed
          const allProjectsSnapshot = await db.collection('projects').limit(1).get();
          if (!allProjectsSnapshot.empty) {
            const docSnap = allProjectsSnapshot.docs[0];
            activeProjectId = docSnap.id;
            activeProjectRef = db.collection('projects').doc(activeProjectId);
          } else {
            console.warn('⚠️ No projects found at all. Cannot associate payment.');
          }
        }

        const batch = db.batch();

        // 1. Write to payments collection
        const paymentRef = db.collection('payments').doc();
        batch.set(paymentRef, {
          userId: userId || 'guest',
          plan: plan || 'Unknown',
          amount: amount || 0,
          transactionId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: 'Success',
          projectId: activeProjectId,
          createdAt: FieldValue.serverTimestamp()
        });

        // 2. Update users/{userId}
        if (userId && !userId.startsWith('guest')) {
          const userRef = db.collection('users').doc(userId);

          const userSnap = await userRef.get();
          if (!userSnap.exists) {
            console.warn(`⚠️ [MISSING USER DOC] UID: ${userId} has no Firestore document during payment verification. Payment ID: ${razorpay_payment_id}, Plan: ${plan}. Creating via set+merge.`);
          }

          batch.set(userRef, {
            membershipStatus: 'Active',
            paymentStatus: 'Paid',
            membershipType: plan,
            projectId: activeProjectId
          }, { merge: true });
        }

        // 3. Increment the ACTIVE project's collected amount and total members
        if (activeProjectRef) {
          batch.set(activeProjectRef, {
            collectedAmount: FieldValue.increment(amount || 0),
            totalMembers: FieldValue.increment(1)
          }, { merge: true });
        }

        await batch.commit();
        console.log('✅ Firestore updated successfully for payment:', razorpay_payment_id);

        res.status(200).json({ success: true, message: 'Payment verified successfully' });
      } catch (dbError) {
        // Surface the failure so the frontend shows the error instead of false success
        console.error('❌ Error updating Firestore post-payment:', dbError);
        res.status(500).json({
          success: false,
          message: 'Payment was verified with Razorpay, but saving to the database failed. Please contact support with this Payment ID: ' + razorpay_payment_id,
          error: dbError.message
        });
      }
    } else {
      console.log('❌ Transaction Failed! Invalid signature for Payment ID:', razorpay_payment_id);
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

export default app;
