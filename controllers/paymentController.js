const { createPaymentIntent } = require("../services/stripeService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { amount, currency, paymentMethodId, plan } = req.body;
        const userId = req.user.id;

        if (!plan || isNaN(Number(plan))) {
            return res.status(400).json({ error: "El plan debe ser un número válido" });
        }

        const planNumber = Number(plan);

        let paymentUrl;
        if (planNumber === 1) {
            paymentUrl = "https://buy.stripe.com/test_9AQ6oY9Ao3xDcyA6oo";
        } else if (planNumber === 2) {
            paymentUrl = "https://buy.stripe.com/test_dR6aFe13S6JP8ik8wx";
        } else {
            return res.status(400).json({ error: "Plan no válido" });
        }

        // Crear un PaymentIntent en Stripe
        const paymentIntent = await createPaymentIntent(amount, currency, paymentMethodId);

        if (!paymentIntent) {
            return res.status(400).json({ error: "No se pudo crear el pago en Stripe" });
        }

        // Guardar el pago con estado "pendiente"
        const payment = new Payment({
            userId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: "pending",
            plan: planNumber,
            paymentUrl: paymentUrl // Agregar paymentUrl al objeto antes de guardar
        });        

        await payment.save();

        res.status(201).json({ 
            message: "Pago iniciado", 
            paymentUrl, 
            paymentIntentId: paymentIntent.id
        });

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

const getPaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.query;

        // Buscar el pago en la base de datos
        const payment = await Payment.findOne({ paymentIntentId });

        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        // Consultar el estado real del pago en Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log("Estado en Stripe:", paymentIntent.status); // 🔍 Verifica qué estado devuelve Stripe

        // Si el pago en Stripe es "succeeded", actualizar en la base de datos
        if (paymentIntent.status === "succeeded" && payment.status !== "success") {
            payment.status = "success";
            await payment.save();
            console.log("Estado actualizado en la base de datos"); // ✅ Verifica si se actualiza
        }

        // Responder con el estado actualizado
        res.json({ status: payment.status });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};



module.exports = { 
    createPayment,
    myPayments,
    allPayments,
    getPaymentStatus
};
