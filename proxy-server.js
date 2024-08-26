const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3002;

app.get('/bnb-price', async (req, res) => {
  try {
    console.log('Attempting to fetch BNB price...');
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
    console.log('BNB price fetched successfully:', response.data);
    res.json({ symbol: 'BNBUSDT', price: response.data.binancecoin.usd });
  } catch (error) {
    console.error('Error fetching BNB price:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    res.status(500).json({ error: 'Failed to fetch BNB price' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
