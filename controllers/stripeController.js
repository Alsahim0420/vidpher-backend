const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        // Usar req.body directamente (Stripe CLI ya lo envía en raw)
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            // Buscar el pago en la base de datos y actualizar estado
            const payment = await Payment.findOneAndUpdate(
                { paymentIntentId: session.payment_intent },
                { status: "succeeded" }
            );

            if (payment) {
                console.log("✅ Pago actualizado a 'succeeded' en MongoDB.");
            } else {
                console.warn("⚠️ No se encontró el pago en MongoDB.");
            }
        }

        if (event.type === "payment_intent.payment_failed") {
            const paymentIntent = event.data.object;

            const failedPayment = await Payment.findOneAndUpdate(
                { paymentIntentId: paymentIntent.id },
                { status: "failed" }
            );

            if (failedPayment) {
                console.warn("❌ Pago fallido registrado en MongoDB.");
            } else {
                console.warn("⚠️ No se encontró el pago fallido en MongoDB.");
            }
        }
    } catch (dbError) {
        console.error("❌ Error al actualizar la base de datos:", dbError.message);
        return res.status(500).json({ error: "Error interno al procesar el evento." });
    }

    res.json({ received: true });
};

module.exports = {
    stripeWebhook,
};