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
            let paymentIntent = event.data.object;
            let metadata = paymentIntent.metadata;

            console.log("🔄 Verificando PaymentIntent en Stripe...");

            // 🚨 **Si la metadata está vacía, intentamos recuperarla manualmente**
            if (!metadata.userId || !metadata.plan) {
                console.warn("⚠ Metadata ausente, intentando recuperar...");

                try {
                    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
                    metadata = paymentIntent.metadata;
                    console.log("✅ Metadata recuperada:", metadata);
                } catch (error) {
                    console.error(`❌ No se pudo recuperar la metadata: ${error.message}`);
                    return res.status(400).json({ error: "Metadata no encontrada." });
                }

                // 🔹 **Si sigue sin metadata, agregamos una temporalmente (Ghost)**
                if (!metadata.userId || !metadata.plan) {
                    console.warn("⚠ Metadata sigue vacía, creando metadata ghost...");

                    const ghostMetadata = {
                        userId: "ghost_user",
                        plan: "ghost_plan"
                    };

                    await stripe.paymentIntents.update(paymentIntent.id, { metadata: ghostMetadata });
                    console.log("👻 Metadata ghost agregada:", ghostMetadata);

                    // **Recuperar nuevamente el PaymentIntent con la metadata ghost**
                    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
                    metadata = paymentIntent.metadata;
                }
            }

            console.log("✅ Metadata final:", metadata);

            // 🔹 Buscar el pago en MongoDB
            const payment = await Payment.findOneAndUpdate(
                { paymentIntentId: paymentIntent.id },
                { status: "succeeded", userId: metadata.userId, plan: metadata.plan },
                { new: true }
            );

            if (payment) {
                console.log("✅ Pago actualizado en MongoDB:", paymentIntent.id);
            } else {
                console.warn("⚠ No se encontró el pago en la base de datos. Creando nuevo registro...");

                const newPayment = new Payment({
                    paymentIntentId: paymentIntent.id,
                    userId: metadata.userId,
                    plan: metadata.plan,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: "succeeded"
                });

                await newPayment.save();
                console.log("✅ Nuevo pago creado en MongoDB.");
            }

            // 🚀 **Eliminar metadata ghost después de procesarlo**
            if (metadata.userId === "ghost_user" || metadata.plan === "ghost_plan") {
                console.log("👻 Eliminando metadata ghost...");
                await stripe.paymentIntents.update(paymentIntent.id, { metadata: {} });
                console.log("✅ Metadata ghost eliminada.");
            }
        }
    } catch (error) {
        console.error("❌ Error al procesar el webhook:", error.message);
        return res.status(500).json({ error: "Error interno al procesar el evento." });
    }

    res.json({ received: true });
};

module.exports = { stripeWebhook };
