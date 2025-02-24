const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment"); 

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;

        // Buscar el pago en la base de datos y actualizarlo a "succeeded"
        await Payment.findOneAndUpdate(
            { paymentIntentId: paymentIntent.id },
            { status: "succeeded" }
        );
    }

    res.json({ received: true });
};

module.exports = {
    stripeWebhook,
};
