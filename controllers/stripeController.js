const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook Error" });
    }

    try {
        let paymentIntentId, userId, plan;

        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            paymentIntentId = paymentIntent.id;
            userId = paymentIntent.metadata.userId;
            plan = paymentIntent.metadata.plan;
        } else {
            console.log("⚠ Evento no manejado:", event.type);
            return res.status(400).json({ error: "Evento no manejado" });
        }

        if (!paymentIntentId || !userId || !plan) {
            return res.status(400).json({ error: "Faltan datos en el evento recibido" });
        }

        const payment = await Payment.findOneAndUpdate(
            { paymentIntentId },
            { status: "succeeded", userId, plan },
            { new: true }
        );

        if (!payment) {
            await Payment.create({
                paymentIntentId,
                userId,
                plan,
                amount: event.data.object.amount,
                currency: event.data.object.currency,
                status: "succeeded",
                paymentUrl: "N/A"
            });
        }

        res.json({ received: true });
    } catch (error) {
        console.error("❌ Error al procesar el webhook:", error.message);
        res.status(500).json({ error: "Error interno al procesar el evento" });
    }
};

module.exports = { stripeWebhook };
