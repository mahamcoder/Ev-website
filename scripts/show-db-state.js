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
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found");
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(serviceAccountJson))
});

const db = getFirestore();

async function showDb() {
  console.log("=== PROJECTS ===");
  const projSnap = await db.collection('projects').get();
  projSnap.forEach(d => {
    console.log(`ID: ${d.id}, Name: ${d.data().name}, Collected: ${d.data().collectedAmount}, Members: ${d.data().totalMembers}`);
  });

  console.log("\n=== PAYMENTS ===");
  const paySnap = await db.collection('payments').get();
  paySnap.forEach(d => {
    console.log(`ID: ${d.id}, User: ${d.data().userName}, Email: ${d.data().userEmail}, Amount: ${d.data().amount}, Plan: ${d.data().plan}, Status: ${d.data().status}, TxId: ${d.data().transactionId}, ProjectId: ${d.data().projectId}, CreatedAt: ${d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : 'N/A'}`);
  });

  console.log("\n=== USERS ===");
  const userSnap = await db.collection('users').get();
  userSnap.forEach(d => {
    console.log(`ID: ${d.id}, Name: ${d.data().name}, Email: ${d.data().email}, MembershipStatus: ${d.data().membershipStatus}, PaymentStatus: ${d.data().paymentStatus}, Plan: ${d.data().membershipType}, ProjectId: ${d.data().projectId}`);
  });
}

showDb().catch(console.error);
