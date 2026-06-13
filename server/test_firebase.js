import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

try {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  console.log('Raw Env Value starts with:', jsonStr?.substring(0, 50));
  
  const serviceAccount = JSON.parse(jsonStr);
  console.log('Project ID:', serviceAccount.project_id);
  console.log('Client Email:', serviceAccount.client_email);
  console.log('Private Key length:', serviceAccount.private_key?.length);
  console.log('Private Key starts with:', serviceAccount.private_key?.substring(0, 30));
  console.log('Private Key contains \\\\n (literal):', serviceAccount.private_key?.includes('\\n'));
  console.log('Private Key contains \\n (newline):', serviceAccount.private_key?.includes('\n'));

  // Let's print out what the key looks like if we replace literal \\n
  const replacedKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  console.log('Replaced Key contains \\n (newline):', replacedKey.includes('\n'));

  // Initialize with replaced key
  serviceAccount.private_key = replacedKey;

  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
  
  const db = getFirestore();
  const snapshot = await db.collection('projects').limit(1).get();
  console.log('Successfully fetched projects. Count:', snapshot.size);
} catch (error) {
  console.error('Firebase Admin Test Failed:', error);
}
