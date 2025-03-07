const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");

router.post("/stripeWebhook", express.raw({ type: "application/json" }), stripeController.stripeWebhook);

module.exports = router;
