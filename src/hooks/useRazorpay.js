import { useState, useEffect } from 'react';

const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      setIsLoaded(false);
      console.error('Razorpay SDK failed to load. Are you online?');
    };
    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup script if necessary. Usually keeping it is fine.
    };
  }, []);

  return isLoaded;
};

export default useRazorpay;
