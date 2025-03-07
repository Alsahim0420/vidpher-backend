const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
        console.error("❌ No se encontró el encabezado stripe-signature.");
        return res.status(400).json({ error: "Webhook Error: No stripe-signature header found." });
    }

    let event;
    try {
        // ✅ Asegurar que Stripe recibe el cuerpo en formato Buffer
        const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(req.body);
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook Error: " + err.message });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);

    res.json({ received: true });
};

module.exports = {
    stripeWebhook,
};
