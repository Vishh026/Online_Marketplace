const paymentModel = require("../model/payment.model");
const axios = require("axios");
const { publishToQueue } = require("../broker/broker");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const QUEUES = require("../constants/queues");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing verification fields",
      });
    }

    // 🔹 Find pending payment
    const payment = await paymentModel.findOne({
      razorpayOrderId: razorpay_order_id,
      status: "PENDING",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or already processed",
      });
    }

    if (String(payment.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized verification attempt",
      });
    }

    // 🔐 Signature Validation
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await paymentModel.findOneAndUpdate(
        { _id: payment._id, status: "PENDING" },
        { $set: { status: "FAILED", failureReason: "INVALID_SIGNATURE" } },
      );

      await publishToQueue(QUEUES.PAYMENT_FAILED, {
        eventType: "PAYMENT_FAILED",
        timestamp: new Date().toISOString(),
        data: {
          userId: payment.user,
          orderId: payment.order,
          reason: "INVALID_SIGNATURE",
        },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // 🔹 Fetch payment from Razorpay
    const rpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!rpPayment || rpPayment.status !== "captured") {
      await paymentModel.findOneAndUpdate(
        { _id: payment._id, status: "PENDING" },
        { $set: { status: "FAILED", failureReason: "NOT_CAPTURED" } },
      );

      return res.status(400).json({
        success: false,
        message: "Payment not captured",
      });
    }

    // 🔐 Amount validation
    if (
      rpPayment.amount !== payment.price.amount ||
      rpPayment.currency !== payment.price.currency
    ) {
      await paymentModel.findOneAndUpdate(
        { _id: payment._id, status: "PENDING" },
        { $set: { status: "FAILED", failureReason: "AMOUNT_MISMATCH" } },
      );

      return res.status(400).json({
        success: false,
        message: "Amount mismatch",
      });
    }

    // ✅ Atomic success update
    const updatedPayment = await paymentModel.findOneAndUpdate(
      { _id: payment._id, status: "PENDING" },
      {
        $set: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "COMPLETED",
        },
      },
      { new: true },
    );

    if (!updatedPayment) {
      return res.status(409).json({
        success: false,
        message: "Payment already processed",
      });
    }

    await publishToQueue(QUEUES.PAYMENT_SUCCESS, {
      eventType: "PAYMENT_SUCCESS",
      timestamp: new Date().toISOString(),
      data: {
        userId: updatedPayment.user,
        orderId: updatedPayment.order,
        paymentId: updatedPayment.paymentId,
        amount: updatedPayment.price.amount,
        currency: updatedPayment.price.currency,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: updatedPayment,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err.message);
    next(err);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    const { orderId } = req.params;

    // 🔹 Fetch order from Order Service
    const orderResponse = await axios.get(
      `http://localhost:3004/api/order/me/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const orderData = orderResponse.data.data;
    // 🔐 SECURITY CHECKS
    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(orderData.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized order access" });
    }

    if (orderData.status !== "CREATED") {
      return res.status(400).json({
        message: "Order not eligible for payment",
      });
    }

    // 🔹 Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: orderData.pricing.total.amount, // already in paise
      currency: "INR",
      receipt: `ord_${orderId}`, // under 40 chars
    });

    const payment = await paymentModel.create({
      order: orderId,
      razorpayOrderId: razorpayOrder.id,
      user: req.user._id,
      status: "PENDING",
      price: {
        amount: orderData.pricing.total.amount,
        currency: "INR",
      },
    });

    await publishToQueue(QUEUES.SELLER_PAYMENT_INITIATED,payment)

    return res.status(201).json({
      message: "Payment initiated",
      razorpayOrder,
      payment,
    });
  } catch (err) {
    console.error("Create Payment FULL ERROR:");
    console.error(err);
    next(err);
  }
};

module.exports = {
  verifyPayment,
  createPayment,
};
