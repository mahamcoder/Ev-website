import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, limit, getDocs, writeBatch, serverTimestamp, increment } from 'firebase/firestore';

dotenv.config();
dotenv.config({ path: '../.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);
console.log('Firebase initialized successfully using Client SDK');

const app = express();
app.use(cors());
app.use(express.json());

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'YourSecretKey',
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt_1' } = req.body;
    const options = { amount, currency, receipt };
    const order = await razorpayInstance.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || error.error?.description || 'Failed to create order' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan, amount, projectId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || 'YourSecretKey')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      console.log('✅ Transaction Successful! Signature matched for Payment ID:', razorpay_payment_id);

      try {
        let activeProjectRef;
        let activeProjectId = projectId || '';

        if (activeProjectId) {
          activeProjectRef = doc(db, 'projects', activeProjectId);
        } else {
          const projectsRef = collection(db, 'projects');
          const allProjQ = query(projectsRef, limit(1));
          const allProjectsSnapshot = await getDocs(allProjQ);
          if (!allProjectsSnapshot.empty) {
            const docSnap = allProjectsSnapshot.docs[0];
            activeProjectId = docSnap.id;
            activeProjectRef = doc(db, 'projects', activeProjectId);
          } else {
            console.warn('⚠️ No projects found. Cannot associate payment.');
          }
        }

        const batch = writeBatch(db);

        const paymentRef = doc(collection(db, 'payments'));
        batch.set(paymentRef, {
          userId: userId || 'guest',
          plan: plan || 'Unknown',
          amount: amount || 0,
          transactionId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: 'Success',
          projectId: activeProjectId,
          createdAt: serverTimestamp()
        });

        if (userId && !userId.startsWith('guest')) {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            console.warn(`⚠️ Missing user doc for UID: ${userId}`);
          }
          batch.set(userRef, {
            membershipStatus: 'Active',
            paymentStatus: 'Paid',
            membershipType: plan,
            projectId: activeProjectId
          }, { merge: true });
        }

        if (activeProjectRef) {
          batch.set(activeProjectRef, {
            collectedAmount: increment(amount || 0),
            totalMembers: increment(1)
          }, { merge: true });
        }

        await batch.commit();
        console.log('✅ Firestore updated for payment:', razorpay_payment_id);
      } catch (dbError) {
        console.error('❌ Firestore update error:', dbError);
      }

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.log('❌ Invalid signature for Payment ID:', razorpay_payment_id);
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

// ── Vercel ke liye export — app.listen() nahi hoga ──
export default app;