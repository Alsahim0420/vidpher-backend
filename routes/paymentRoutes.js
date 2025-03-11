const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const check = require('../middlewares/auth');

router.post("/payment",check.auth, paymentController.createPayment);
router.get('/myPayments', check.auth, paymentController.myPayments);
router.get('/admin/payments',  check.auth, paymentController.allPayments);
router.get("/status/payment", check.auth, paymentController.getPaymentStatus);
router.get('/change/status/payment', check.auth, paymentController.changePaymentStatus);


module.exports = router;
