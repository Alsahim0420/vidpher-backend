const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");

// ⚠ Asegurar que el webhook recibe el payload en formato raw
router.post("/stripeWebhook", express.raw({ type: "application/json" }), stripeController.stripeWebhook);

module.exports = router;