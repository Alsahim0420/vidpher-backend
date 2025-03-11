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
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;

            console.log("🔄 Verificando PaymentIntent en Stripe...");
            const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
            console.log("🔍 Metadata recibida desde Stripe:", fullPaymentIntent.metadata);

            if (!fullPaymentIntent.metadata.userId || !fullPaymentIntent.metadata.plan) {
                console.error("❌ Faltan `userId` o `plan` en metadata.");
                return res.status(400).json({ error: "Faltan `userId` o `plan` en metadata." });
            }

            console.log("✅ Metadata correcta:", fullPaymentIntent.metadata);

            // 🔹 Buscar el pago en MongoDB
            const payment = await Payment.findOneAndUpdate(
                { paymentIntentId: paymentIntent.id },
                { status: "succeeded" },
                { new: true }
            );

            if (payment) {
                console.log("✅ Pago actualizado en MongoDB:", paymentIntent.id);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos.");
            }
        }
    } catch (error) {
        console.error("❌ Error al procesar el webhook:", error.message);
        return res.status(500).json({ error: "Error interno al procesar el evento." });
    }

    res.json({ received: true });
};

module.exports = { stripeWebhook };




module.exports = {
    stripeWebhook,
};



//❌ Desactivamos la validación de firma SOLO para pruebas
//let event;
//try {
// // 🔹 Convertir `req.body` a JSON si es un Buffer o String
//    const rawBody = req.body instanceof Buffer ? req.body.toString() : req.body;
//    event = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody; // ✅ Corrige error de sintaxis
//
//    console.log(`🔔 Evento recibido sin verificar firma: ${event.type}`);
//} catch (err) {
//    console.error("❌ Error procesando el webhook:", err.message);
//    return res.status(400).json({ error: "Error procesando el webhook." });
//}
