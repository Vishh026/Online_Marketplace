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

const createPayment = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    const { orderId } = req.params;

    const orderResponse = await axios.get(
      `http://localhost:3003/api/order/me/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const orderData = orderResponse.data.data;

    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: orderData.pricing.total.amount,
      currency: "INR",
      receipt: `ord_${orderId}`,
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

    // 🔥 Publish PAYMENT_INITIATED (non-blocking)
    try {
      await publishToQueue(QUEUES.PAYMENT_INITIATED, {
        eventType: "PAYMENT_INITIATED",
        timestamp: new Date().toISOString(),
        data: {
          userId: payment.user,
          email: req.user.email,
          username: req.user.username,
          orderId: payment.order,
          amount: payment.price.amount,
          currency: payment.price.currency,
        },
      });
    } catch (err) {
      console.error("PAYMENT_INITIATED publish failed:", err.message);
    }

    return res.status(201).json({
      message: "Payment initiated",
      razorpayOrder,
      payment,
    });

  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing verification fields" });
    }

    const payment = await paymentModel.findOne({
      razorpayOrderId: razorpay_order_id,
      status: "PENDING",
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // 🔐 Signature validation
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await markFailed(payment._id, "INVALID_SIGNATURE");
      await publishFailure(payment, "INVALID_SIGNATURE", req.user);
      return res.status(400).json({ message: "Invalid signature" });
    }

    // 🔎 Fetch payment from Razorpay
    const rpPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!rpPayment || rpPayment.status !== "captured") {
      await markFailed(payment._id, "NOT_CAPTURED");
      await publishFailure(payment, "NOT_CAPTURED", req.user);
      return res.status(400).json({ message: "Payment not captured" });
    }

    // 🔐 Amount + currency validation
    if (
      rpPayment.amount !== payment.price.amount ||
      rpPayment.currency !== payment.price.currency
    ) {
      await markFailed(payment._id, "AMOUNT_MISMATCH");
      await publishFailure(payment, "AMOUNT_MISMATCH", req.user);
      return res.status(400).json({ message: "Amount mismatch" });
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
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(409).json({ message: "Payment already processed" });
    }

    // 🔥 Publish PAYMENT_SUCCESS (non-blocking)
    try {
      await publishToQueue(QUEUES.PAYMENT_SUCCESS, {
        eventType: "PAYMENT_SUCCESS",
        timestamp: new Date().toISOString(),
        data: {
          userId: updatedPayment.user,
          email: req.user.email,
          username: req.user.username,
          orderId: updatedPayment.order,
          paymentId: updatedPayment.paymentId,
          amount: updatedPayment.price.amount,
          currency: updatedPayment.price.currency,
        },
      });
    } catch (err) {
      console.error("PAYMENT_SUCCESS publish failed:", err.message);
    }

    return res.status(200).json({
      message: "Payment verified successfully",
      payment: updatedPayment,
    });

  } catch (err) {
     console.log("error while doing payment",err)
    next(err);
  }
};


// ================= HELPERS =================

async function markFailed(id, reason) {
  await paymentModel.findOneAndUpdate(
    { _id: id, status: "PENDING" },
    { $set: { status: "FAILED", failureReason: reason } }
  );
}

async function publishFailure(payment, reason, user) {
  try {
    await publishToQueue(QUEUES.PAYMENT_FAILED, {
      eventType: "PAYMENT_FAILED",
      timestamp: new Date().toISOString(),
      data: {
        userId: payment.user,
        email: user.email,
        username: user.username,
        orderId: payment.order,
        reason,
      },
    });
  } catch (err) {
    console.error("PAYMENT_FAILED publish failed:", err.message);
  }
}

module.exports = { createPayment, verifyPayment };