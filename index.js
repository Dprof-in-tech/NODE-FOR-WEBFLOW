const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc');
const YOUR_DOMAIN = 'https://payment.ugcmixtape.com';

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Endpoint to serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'index.html'));
});

// Endpoint to create a payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { name, email, amount } = req.body;

    if (!name || !email || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: { name, email },
    });

    
    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: "pk_test_TYooMQauvdEDq54NiTphI7jx",
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to handle successful payment
app.get('/success', (req, res) => {
  res.send('Payment successful!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


