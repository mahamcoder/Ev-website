const keyId = 'rzp_test_SztHo2jguAPeoD';
const keySecret = 'n9WH1lVRJPNzbD2SSVE9Pu1r';

const createOrder = async () => {
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        amount: 750000,
        currency: 'INR',
        receipt: 'receipt_1'
      })
    });
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Body:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

createOrder();
