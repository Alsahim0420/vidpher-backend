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
        return res.status(400).json({ error: "Webhook Error: " + err.message });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);

    try {
        let paymentIntentId, userId, plan;

        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            paymentIntentId = paymentIntent.id;
            userId = paymentIntent.metadata.userId;
            plan = paymentIntent.metadata.plan;
        }

        if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object;
            paymentIntentId = invoice.payment_intent;
            userId = invoice.customer;
            plan = invoice.lines.data[0]?.plan?.id; // Si es una suscripción, extraemos el plan
        }

        if (!paymentIntentId) {
            console.warn("⚠ No se pudo extraer el PaymentIntent del evento.");
            return res.status(400).json({ error: "No se encontró PaymentIntent en el evento." });
        }

        console.log("🔍 PaymentIntent encontrado:", paymentIntentId);

        // ✅ Actualizar el pago en la base de datos sin depender de metadata
        const payment = await Payment.findOneAndUpdate(
            { paymentIntentId },
            { status: "succeeded", userId, plan },
            { new: true }
        );

        if (payment) {
            console.log("✅ Pago actualizado en MongoDB:", paymentIntentId);
        } else {
            console.warn("⚠ No se encontró el pago en la base de datos. Creando nuevo registro...");

            const newPayment = new Payment({
                paymentIntentId,
                userId,
                plan,
                status: "succeeded"
            });

            await newPayment.save();
            console.log("✅ Nuevo pago creado en MongoDB.");
        }

    } catch (error) {
        console.error("❌ Error al procesar el webhook:", error.message);
        return res.status(500).json({ error: "Error interno al procesar el evento." });
    }

    res.json({ received: true });
};

module.exports = { stripeWebhook };
