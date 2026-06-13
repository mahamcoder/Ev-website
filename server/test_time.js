const testTime = async () => {
  try {
    const start = Date.now();
    const response = await fetch('https://www.google.com');
    const dateHeader = response.headers.get('date');
    const end = Date.now();
    const localTime = new Date((start + end) / 2);
    const serverTime = new Date(dateHeader);
    
    console.log('Local Time:', localTime.toISOString());
    console.log('Server Time:', serverTime.toISOString());
    console.log('Difference (seconds):', (localTime - serverTime) / 1000);
  } catch (error) {
    console.error('Time fetch failed:', error);
  }
};

testTime();
