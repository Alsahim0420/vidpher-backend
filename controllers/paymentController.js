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

        // URLs de pago según el plan
        let paymentUrl;
        if (planNumber === 1) {
            paymentUrl = "https://buy.stripe.com/test_9AQ6oY9Ao3xDcyA6oo";
        } else if (planNumber === 2) {
            paymentUrl = "https://buy.stripe.com/test_dR6aFe13S6JP8ik8wx";
        } else {
            return res.status(400).json({ error: "Plan no válido" });
        }

        // ✅ Verificar si ya existe un PaymentIntent para este usuario y plan
        let existingPayment = await Payment.findOne({ userId, plan: planNumber, status: "pending" });

        if (existingPayment) {
            console.log("📌 Se encontró un PaymentIntent existente:", existingPayment.paymentIntentId);
            return res.status(200).json({
                message: "Ya tienes un pago pendiente",
                paymentIntentId: existingPayment.paymentIntentId,
                paymentUrl: existingPayment.paymentUrl
            });
        }

        // ✅ Crear un nuevo PaymentIntent en Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            }
        });

        console.log("✅ PaymentIntent creado en Stripe:", paymentIntent.id);

        // ✅ Guardar el nuevo pago en MongoDB
        const payment = new Payment({
            _id: paymentIntent.id, // Usamos el ID de Stripe como _id en MongoDB
            userId,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status, // Guardamos el estado real de Stripe
            plan: planNumber,
            paymentUrl: paymentUrl
        });

        await payment.save();
        console.log("✅ Pago almacenado en MongoDB con el mismo ID:", payment._id);

        res.status(201).json({
            message: "Pago iniciado",
            paymentIntentId: paymentIntent.id,
            paymentUrl
        });

    } catch (error) {
        console.error("❌ Error al crear el pago:", error.message);
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


        console.log("Estado real en Stripe:", payment.status);


        res.json({ status: payment.status });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const changePaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.query;
        if (!paymentIntentId) {
            return res.status(400).json({ error: "paymentIntentId es requerido" });
        }

        const payment = await Payment.findById(paymentIntentId); // 🔹 Buscar por `_id`
        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        payment.status = "completed"; // O el estado que desees
        await payment.save();

        res.json({ message: "Estado de pago actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar el estado del pago:", error.message);
        res.status(500).json({ error: error.message });
    }

}

module.exports = {
    createPayment,
    myPayments,
    allPayments,
    getPaymentStatus,
    changePaymentStatus,
};
