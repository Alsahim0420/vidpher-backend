const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"]
    if (!sig) {
        console.error("❌ No se encontró el encabezado stripe-signature.");
        return res.status(400).json({ error: "Webhook Error: No stripe-signature header found." });
    }
    let event;
    try {
        // ✅ Asegurar que req.body es un Buffer antes de verificar la firma
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook Error: " + err.message });
    }

    // ❌ Desactivamos la validación de firma SOLO para pruebas
    // let event;
    // try {
    //     // 🔹 Convertir `req.body` a JSON si es un Buffer o String
    //     const rawBody = req.body instanceof Buffer ? req.body.toString() : req.body;
    //     event = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

    //     console.log(`🔔 Evento recibido sin verificar firma: ${event.type}`);
    // } catch (err) {
    //     console.error("❌ Error procesando el webhook:", err.message);
    //     return res.status(400).json({ error: "Error procesando el webhook." });
    // }



    console.log(`🔔 Evento recibido: ${event.type}`);

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            console.log("🔍 PaymentIntent recibido:", session.payment_intent);
            console.log("🔍 Session ID recibido:", session.id);

            const payment = await Payment.findOneAndUpdate(
                { sessionId: session.id }, // Buscar por sessionId en lugar de paymentIntentId
                { status: "succeeded", paymentIntentId: session.payment_intent },
                { new: true }
            );

            if (payment) {
                console.log("✅ Pago actualizado en la base de datos con PaymentIntent:", payment.paymentIntentId);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos con sessionId:", session.id);
            }
        }


        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;

            const payment = await Payment.findOneAndUpdate(
                { paymentIntentId: paymentIntent.id },
                { status: "succeeded" },
                { new: true }
            );

            if (payment) {
                console.log("✅ Pago exitoso actualizado:", paymentIntent.id);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos.");
            }
        }

        if (event.type === "payment_intent.payment_failed") {
            const paymentIntent = event.data.object;

            const failedPayment = await Payment.findOneAndUpdate(
                { paymentIntentId: paymentIntent.id },
                { status: "failed" },
                { new: true }
            );

            if (failedPayment) {
                console.warn("❌ Pago fallido registrado:", paymentIntent.id);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos.");
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
