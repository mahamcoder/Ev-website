import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_SztHo2jguAPeoD',
  key_secret: 'n9WH1lVRJPNzbD2SSVE9Pu1r',
});

const options = {
  amount: 750000,
  currency: 'INR',
  receipt: 'receipt_1',
};

razorpayInstance.orders.create(options).then((order) => {
  console.log('Success:', order);
}).catch((error) => {
  console.error('Error:', error);
});
