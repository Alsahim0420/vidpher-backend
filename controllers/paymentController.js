const { createPaymentIntent } = require("../services/stripeService");
const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        const userId = req.user.id; // Extraído desde el token (Asegúrate de tener middleware)

        // 1️⃣ Crear un PaymentIntent en Stripe
        const paymentIntent = await createPaymentIntent(amount, currency, paymentMethodId);

        if (!paymentIntent) {
            return res.status(400).json({ error: "No se pudo crear el pago en Stripe" });
        }

        // 2️⃣ Guardar el pago en MongoDB
        const payment = new Payment({
            userId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        });

        await payment.save();

        res.status(201).json({ message: "Pago exitoso", payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createPayment };
