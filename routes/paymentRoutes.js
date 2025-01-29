const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const check = require('../middlewares/auth');

router.post("/create-payment",check.auth, paymentController.createPayment);

module.exports = router;
