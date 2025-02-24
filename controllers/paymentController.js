const { createPaymentIntent } = require("../services/stripeService");
const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { amount, currency, paymentMethodId, plan } = req.body;
        const userId = req.user.id; // Extraído desde el token

        // Validar que el plan sea un número
        if (typeof plan !== 'number') {
            return res.status(400).json({ error: "El plan debe ser un número" });
        }

        // Seleccionar la URL de Stripe según el plan
        let paymentUrl;
        if (plan === 1) {
            paymentUrl = "https://buy.stripe.com/test_9AQ6oY9Ao3xDcyA6oo";
        } else if (plan === 2) {
            paymentUrl = "https://buy.stripe.com/test_dR6aFe13S6JP8ik8wx";
        } else {
            return res.status(400).json({ error: "Plan no válido" });
        }

        // Crear un PaymentIntent en Stripe
        const paymentIntent = await createPaymentIntent(amount, currency, paymentMethodId);

        if (!paymentIntent) {
            return res.status(400).json({ error: "Payment couldn't be created in Stripe" });
        }

        // Guardar el pago en MongoDB
        const payment = new Payment({
            userId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            plan, // Guardamos el plan como número
            paymentUrl
        });

        await payment.save();

        res.status(201).json({ message: "Successful payment", paymentUrl, payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



const myPayments = async (req, res) => {
    try {
        const userId = req.user.id; // Extraído desde el token

        // Buscar todos los pagos del usuario logueado
        const payments = await Payment.find({ userId });

        if (!payments || payments.length === 0) {
            return res.status(404).json({ message: "No payments found for this user" });
        }

        res.status(200).json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const allPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Parámetros de paginación

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 } // Ordenar por fecha de creación (más reciente primero)
        };

        // Buscar todos los pagos con paginación
        const payments = await Payment.paginate({}, options);

        if (!payments || payments.docs.length === 0) {
            return res.status(404).json({ message: "No payments found" });
        }

        res.status(200).json({ payments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    createPayment,
    myPayments,
    allPayments
};
