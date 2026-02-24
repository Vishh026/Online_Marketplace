const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware')
const { createPayment, verifyPayment } = require("../controllers/payment.controller");

router.post("/create/:orderId",authMiddleware(["user"]), createPayment);
router.post("/verify",authMiddleware(["user"]), verifyPayment);

module.exports = router;