import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Load the root .env which has the client credentials
dotenv.config({ path: '../.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase Config loaded:', {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey
});

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('Fetching projects using Client SDK...');
  const q = query(collection(db, 'projects'), limit(1));
  const snapshot = await getDocs(q);
  console.log('Successfully fetched. Count:', snapshot.size);
  if (snapshot.size > 0) {
    console.log('First project name:', snapshot.docs[0].data().name);
  }
} catch (error) {
  console.error('Client SDK Test Failed:', error);
}
