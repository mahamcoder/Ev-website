import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

async function runCleanup() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log(`Starting payment cleanup & project totals reconciliation.`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (No changes will be saved)' : 'REAL-RUN (Changes will be written)'}\n`);

  // 1. Fetch all docs
  const paymentsSnap = await db.collection('payments').get();
  const projectsSnap = await db.collection('projects').get();
  const usersSnap = await db.collection('users').get();

  console.log(`Fetched:`);
  console.log(`  - ${paymentsSnap.size} payment documents`);
  console.log(`  - ${projectsSnap.size} project documents`);
  console.log(`  - ${usersSnap.size} user documents\n`);

  const payments = [];
  paymentsSnap.forEach(doc => {
    payments.push({ id: doc.id, ref: doc.ref, ...doc.data() });
  });

  const projects = [];
  projectsSnap.forEach(doc => {
    projects.push({ id: doc.id, ref: doc.ref, ...doc.data() });
  });

  const users = [];
  usersSnap.forEach(doc => {
    users.push({ id: doc.id, ref: doc.ref, ...doc.data() });
  });

  // 2. Group payments by transactionId to find duplicates
  const groups = {};
  payments.forEach(p => {
    const txId = p.transactionId;
    if (!txId) return;
    if (!groups[txId]) {
      groups[txId] = [];
    }
    groups[txId].push(p);
  });

  let duplicateGroupsCount = 0;
  const docsToDelete = [];

  for (const [txId, groupDocs] of Object.entries(groups)) {
    const successfulDocs = groupDocs.filter(d => d.status === 'Success' || d.status === 'Paid');

    if (successfulDocs.length > 1) {
      duplicateGroupsCount++;
      console.log(`Duplicate group found for Tx ID [${txId}] containing ${successfulDocs.length} success docs:`);

      // Sort: keep the one with createdAt timestamp first, then others
      successfulDocs.sort((a, b) => {
        const aHasTs = a.createdAt ? 1 : 0;
        const bHasTs = b.createdAt ? 1 : 0;
        if (aHasTs !== bHasTs) {
          return bHasTs - aHasTs;
        }
        return a.id.localeCompare(b.id);
      });

      const keepDoc = successfulDocs[0];
      const dupDocs = successfulDocs.slice(1);

      console.log(`  -> KEEPING document: ID=${keepDoc.id}, Amount=${keepDoc.amount}, Project=${keepDoc.projectId}, CreatedAt=${keepDoc.createdAt ? 'Yes' : 'No'}`);
      
      dupDocs.forEach(dup => {
        console.log(`  -> DELETING document: ID=${dup.id}, Amount=${dup.amount}, Project=${dup.projectId}, CreatedAt=${dup.createdAt ? 'Yes' : 'No'}`);
        docsToDelete.push(dup);
      });
    }
  }

  console.log(`\nFound ${duplicateGroupsCount} duplicate groups. Total duplicates to delete: ${docsToDelete.length}\n`);

  // 3. Recalculate project totals based on active (non-deleted) success/paid payments
  const projectSuccessSums = {};
  const projectActiveMembers = {};

  projects.forEach(p => {
    projectSuccessSums[p.id] = 0;
    projectActiveMembers[p.id] = 0;
  });

  // Sum active successful payments
  const activePayments = payments.filter(p => !docsToDelete.some(dup => dup.id === p.id));
  activePayments.forEach(p => {
    if ((p.status === 'Success' || p.status === 'Paid') && p.projectId && projectSuccessSums[p.projectId] !== undefined) {
      projectSuccessSums[p.projectId] += (p.amount || 0);
    }
  });

  // Count active members per project (non-admin, active membership status)
  users.forEach(u => {
    if (u.role !== 'admin' && u.membershipStatus === 'Active' && u.projectId && projectActiveMembers[u.projectId] !== undefined) {
      projectActiveMembers[u.projectId] += 1;
    }
  });

  // 4. Summarize changes and write to DB
  console.log("--- RECONCILIATION SUMMARY ---");
  for (const p of projects) {
    const newCollected = projectSuccessSums[p.id];
    const newMembers = projectActiveMembers[p.id];
    const oldCollected = p.collectedAmount || 0;
    const oldMembers = p.totalMembers || 0;

    const collectedChanged = newCollected !== oldCollected;
    const membersChanged = newMembers !== oldMembers;

    if (collectedChanged || membersChanged) {
      console.log(`Project: ${p.name} (${p.id})`);
      if (collectedChanged) {
        console.log(`  - collectedAmount: ${oldCollected} -> ${newCollected}`);
      }
      if (membersChanged) {
        console.log(`  - totalMembers:    ${oldMembers} -> ${newMembers}`);
      }
    }
  }

  if (isDryRun) {
    console.log("\nDry-run complete. No changes were saved to Firestore.");
  } else {
    console.log("\nWriting changes to Firestore...");
    const batch = db.batch();

    // Delete duplicate payments
    docsToDelete.forEach(dup => {
      batch.delete(dup.ref);
    });

    // Update project documents with reconciled amounts and member counts
    for (const p of projects) {
      const newCollected = projectSuccessSums[p.id];
      const newMembers = projectActiveMembers[p.id];
      const projRef = db.collection('projects').doc(p.id);
      batch.set(projRef, {
        collectedAmount: newCollected,
        totalMembers: newMembers
      }, { merge: true });
    }

    await batch.commit();
    console.log("✅ Firestore updated successfully!\n");

    // Print final verification
    console.log("--- POST-CLEANUP VERIFICATION ---");
    for (const p of projects) {
      const projDoc = await db.collection('projects').doc(p.id).get();
      console.log(`Project: ${p.name}`);
      console.log(`  - Pool Collected (collectedAmount): ${projDoc.data().collectedAmount}`);
      const projectPayments = activePayments.filter(pay => pay.projectId === p.id && (pay.status === 'Success' || pay.status === 'Paid'));
      const totalRevenue = projectPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      console.log(`  - Total Revenue (payments sum):     ${totalRevenue}`);
      console.log(`  - Status: ${projDoc.data().collectedAmount === totalRevenue ? 'MATCHED ✅' : 'MISMATCH ❌'}`);
    }
  }
}

runCleanup().catch(err => {
  console.error("Error running cleanup script:", err);
  process.exit(1);
});
