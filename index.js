require("dotenv").config();

const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const stripe = require('stripe')(process.env.STRIPE_KEY);
const YOUR_DOMAIN = 'https://payment.ugcmixtape.com';

// Middleware to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Endpoint to serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
};

app.post('/webhook', async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBodyBuffer = await getRawBody(req);

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBodyBuffer, signature, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const email = paymentIntent.metadata.email;
      const amount = paymentIntent.amount * 1000;

      try {
        // Send an email using the Stripe email service
        await stripe.emails.send({
          email_address: email,
          statement_descriptor: 'Example Payment',
          template: {
            name: 'payment-confirmation',
            data: {
              amount,
              currency: paymentIntent.currency,
            },
          },
        });
        console.log(`Email sent to ${email}`);
      } catch (err) {
        console.error(`Error sending email: ${err.message}`);
      }

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});