require("dotenv").config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const stripe = require('stripe')(process.env.STRIPE_KEY);
const YOUR_DOMAIN = 'https://payment.ugcmixtape.com';

const app = express();

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
    const { email, amount, name } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: { email, name },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUB_KEY,
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

const webhook = require('./webhook'); // Import the webhook logic

// Attach the webhook route to the app
app.post('/webhook', webhook);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
