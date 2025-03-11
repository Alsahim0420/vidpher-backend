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
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook Error: " + err.message });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);

    try {
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;

            console.log("✅ Pago confirmado en Stripe:", paymentIntent.id);

            // ✅ Extraer `userId` y `plan` de `metadata`
            const userId = paymentIntent.metadata.userId || null;
            const plan = Number(paymentIntent.metadata.plan) || null;

            if (!userId || !plan) {
                console.error("❌ Faltan `userId` o `plan` en metadata del PaymentIntent.");
                return res.status(400).json({ error: "Faltan datos en metadata." });
            }

            // ✅ Guardar el pago en MongoDB solo si tiene los datos completos
            const payment = new Payment({
                _id: paymentIntent.id, // Usamos el ID de Stripe como _id
                userId, // Ahora es un ObjectId válido
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: "succeeded",
                plan,
                paymentUrl: "" // No se necesita, ya que el pago está completo
            });

            await payment.save();
            console.log("✅ Pago guardado en MongoDB con ID:", payment._id);
        }

    } catch (dbError) {
        console.error("❌ Error al procesar el webhook:", dbError.message);
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
