const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const check = require('../middlewares/auth');

router.post("/payment",check.auth, paymentController.createPayment);

module.exports = router;
