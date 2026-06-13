import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in server/.env");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", error);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function createAdmin() {
  const email = 'admin@stoshi.com';
  const password = 'adminpassword';
  const name = 'Admin';
  const phone = '+919876543210';
  
  let userRecord;
  try {
    // Check if user already exists in Auth
    userRecord = await auth.getUserByEmail(email);
    console.log(`User ${email} already exists in Firebase Auth. UID: ${userRecord.uid}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Create user in Auth
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone
      });
      console.log(`Created new Firebase Auth user ${email} successfully. UID: ${userRecord.uid}`);
    } else {
      throw error;
    }
  }

  const uid = userRecord.uid;

  // Create or update Firestore user document
  const userDocRef = db.collection('users').doc(uid);
  const userDoc = {
    uid,
    name,
    email,
    phone,
    role: 'admin',
    membershipType: 'Platinum',
    membershipStatus: 'Active',
    paymentStatus: 'Paid',
    joinDate: FieldValue.serverTimestamp(),
    totalEarnings: 0
  };

  await userDocRef.set(userDoc, { merge: true });
  console.log(`Set Firestore user document for UID: ${uid} (role: admin) successfully.`);

  // Create or update Firestore userEarnings document
  const earningsDocRef = db.collection('userEarnings').doc(uid);
  const earningsDoc = {
    utilityPool: 0,
    greenImpactPool: 0,
    loyaltyPool: 0,
    totalEarnings: 0
  };

  await earningsDocRef.set(earningsDoc, { merge: true });
  console.log(`Set Firestore userEarnings document for UID: ${uid} successfully.`);

  console.log('\n--- SUCCESS: Admin user configuration complete! ---');
}

createAdmin().catch((err) => {
  console.error("Error creating admin user:", err);
  process.exit(1);
});
