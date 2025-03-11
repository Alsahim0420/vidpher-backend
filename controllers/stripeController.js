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
        // ✅ Verificar la firma del webhook
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook Error: " + err.message });
    }

    console.log(`🔔 Evento recibido: ${event.type}`);

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            console.log("🔍 PaymentIntent recibido:", session.payment_intent);
            console.log("🔍 Session ID recibido:", session.id);

            const payment = await Payment.findOneAndUpdate(
                { sessionId: session.id },
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

            console.log("🔍 Buscando en la base de datos el pago con paymentIntentId:", paymentIntent.id);

            // ✅ Función para reintentar la búsqueda del pago en la base de datos
            const retryFindPayment = async (paymentIntentId, retries = 5) => {
                for (let i = 0; i < retries; i++) {
                    const payment = await Payment.findOne({ _id: paymentIntentId }) || 
                                    await Payment.findOne({ paymentIntentId });

                    if (payment) return payment;

                    console.warn(`⚠ Intento ${i + 1}: No se encontró el pago, reintentando en 1s...`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
                return null;
            };

            // 🔹 Intentar encontrar el pago antes de actualizarlo
            const payment = await retryFindPayment(paymentIntent.id);

            if (payment) {
                payment.status = "succeeded";
                await payment.save();
                console.log("✅ Pago exitoso actualizado en la base de datos:", paymentIntent.id);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos después de varios intentos.");
            }
        }

        if (event.type === "payment_intent.payment_failed") {
            const paymentIntent = event.data.object;

            console.warn("❌ Pago fallido:", paymentIntent.id, " Razón:", paymentIntent.last_payment_error?.message);

            // 🔹 Intentar encontrar el pago antes de actualizarlo
            const payment = await Payment.findOne({ _id: paymentIntent.id }) || 
                            await Payment.findOne({ paymentIntentId });

            if (payment) {
                payment.status = "failed";
                await payment.save();
                console.log("❌ Pago fallido registrado en la base de datos:", paymentIntent.id);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos.");
            }
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
