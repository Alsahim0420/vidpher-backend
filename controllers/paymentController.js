const { createPaymentIntent } = require("../payments/stripeService");

const createPayment = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "El monto es obligatorio" });
    }

    const paymentIntent = await createPaymentIntent(amount, currency);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPayment };
