const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const rawBodyParser = bodyParser.raw({ type: 'application/json' });

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event = req.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const email = paymentIntent.metadata.email;
      const amount = paymentIntent.amount;

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
};
