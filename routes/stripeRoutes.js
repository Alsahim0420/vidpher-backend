const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");

// Usar express.raw() para manejar el cuerpo de la solicitud como un string sin procesar
router.post("/stripeWebhook", express.raw({ type: "application/json" }), stripeController.stripeWebhook);

module.exports = router;