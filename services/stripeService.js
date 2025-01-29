const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

const createPaymentIntent = async (amount, currency = "usd") => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe trabaja en centavos
      currency,
      payment_method_types: ["card"], // Acepta pagos con tarjeta
    });
    return paymentIntent;
  } catch (error) {
    console.error("Error al crear PaymentIntent:", error);
    throw new Error(error.message);
  }
};

module.exports = { createPaymentIntent };
