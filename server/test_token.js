import dotenv from 'dotenv';
import { JWT } from 'google-auth-library';

dotenv.config();

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  console.log('Requesting access token...');
  const token = await client.getAccessToken();
  console.log('Token successfully generated:', token.token ? 'YES' : 'NO');
} catch (error) {
  console.error('Token Generation Failed:', error);
}
