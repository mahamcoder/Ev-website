import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function seed() {
  const docRef = db.collection('projects').doc('sonbhadra-ev1');
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    await docRef.set({
      totalCapacity: 1500000,
      collectedAmount: 975000,
      totalMembers: 127,
      status: 'Operational',
      location: 'Sonbhadra, Uttar Pradesh'
    });
    console.log("Seeded projects/sonbhadra-ev1 successfully.");
  } else {
    console.log("projects/sonbhadra-ev1 already exists, skipping seed.");
  }
}

seed().catch(console.error);
