const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook Error: " + err.message });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);
    
    // 📌 Log para ver si la metadata está llegando correctamente
    console.log("🔍 Metadata recibida en el webhook:", event.data.object.metadata);

    try {
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata;

            if (!metadata.userId || !metadata.plan) {
                console.error("❌ Faltan `userId` o `plan` en metadata del PaymentIntent.");
                return res.status(400).json({ error: "Faltan `userId` o `plan` en metadata." });
            }

            console.log("✅ Metadata correcta:", metadata);

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
