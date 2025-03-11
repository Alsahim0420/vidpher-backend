const { createPaymentIntent } = require("../services/stripeService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");

const createPayment = async (req, res) => {
    try {
        const { amount, currency, plan } = req.body;
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
        } else if (planNumber === 3) {
            paymentUrl = "https://buy.stripe.com/test_eVa14EbIwd8d424aEG";
        } else {
            return res.status(400).json({ error: "Plan no válido" });
        }

        console.log("📌 Datos antes de crear PaymentIntent:", { userId, plan: planNumber });

        // ✅ Crear PaymentIntent con metadata
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: { userId, plan: planNumber }
        });

        console.log("🔹 Nuevo PaymentIntent creado en Stripe:", paymentIntent.id);
        console.log("🔍 Metadata enviada en el PaymentIntent:", paymentIntent.metadata);

        // 🔄 **Actualizar el PaymentIntent** para asegurarse de que la metadata se mantenga
        console.log("🔄 Actualizando PaymentIntent con metadata...");
        await stripe.paymentIntents.update(paymentIntent.id, {
            metadata: { userId, plan: planNumber }
        });
        console.log("✅ PaymentIntent actualizado correctamente.");

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

        // 🔹 Validar que el paymentIntentId está presente
        if (!paymentIntentId) {
            return res.status(400).json({ error: "Se requiere el paymentIntentId" });
        }

        // 🔹 Buscar el pago en la base de datos
        const payment = await Payment.findOne({ paymentIntentId });

        if (!payment) {
            console.warn("⚠ Pago no encontrado en la base de datos:", paymentIntentId);
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        console.log("✅ Estado del pago en la base de datos:", payment.status);

        // 🔹 Responder con el estado del pago
        res.json({ status: payment.status });

    } catch (error) {
        console.error("❌ Error al obtener el estado del pago:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const changePaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId } = req.query;
        if (!paymentIntentId) {
            return res.status(400).json({ error: "paymentIntentId es requerido" });
        }

        const payment = await Payment.findOne({ paymentIntentId }); // 🔹 Buscar por paymentIntentId
        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        payment.status = "completed"; // O el estado correcto
        await payment.save();

        res.json({ message: "Estado de pago actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar el estado del pago:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPayment,
    myPayments,
    allPayments,
    getPaymentStatus,
    changePaymentStatus,
};
