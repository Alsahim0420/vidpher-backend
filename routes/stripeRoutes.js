const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");
const check = require('../middlewares/auth');

router.post("/stripeWebhook",check.auth, stripeController.stripeWebhook);

module.exports = router;