const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        // ⚠️ Convertir el body a Buffer si no lo es
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

        // Verificar la firma del webhook
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);

    res.json({ received: true });
};

module.exports = {
    stripeWebhook,
};
