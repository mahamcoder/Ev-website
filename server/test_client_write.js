import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('Attempting unauthenticated write to payments...');
  const docRef = await addDoc(collection(db, 'payments'), {
    userId: 'backend_test',
    userName: 'Backend Test',
    userEmail: 'backend@test.com',
    plan: 'Gold',
    amount: 15000,
    transactionId: 'test_tx_' + Date.now(),
    status: 'Success',
    createdAt: serverTimestamp()
  });
  console.log('Write successful! Doc ID:', docRef.id);
} catch (error) {
  console.error('Unauthenticated Write Failed:', error);
}
