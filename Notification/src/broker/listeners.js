const { subscribeToQueue } = require("./broker");
const sendEmail = require("../email");
const QUEUES = require("../constants/queues");
const generateInvoice = require("../utils/generateInvoice");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

module.exports = function registerSubscribers() {
  subscribeToQueue(QUEUES.USER_REGISTERED, async (event) => {
    try {
      const { username, email } = event.data;

      await sendEmail({
        to: email,
        subject: `Welcome ${username}! 🎉`,
        html: `
          <h2>Welcome ${username}</h2>
          <p>Your account has been created successfully.</p>
          <a href="${CLIENT_URL}/login">Login</a>
        `,
      });

      console.log("USER_REGISTERED email sent");
    } catch (err) {
      console.error("USER_REGISTERED email failed:", err.message);
    }
  });

  subscribeToQueue(QUEUES.ORDER_CANCELLED, async (event) => {
    try {
      const { orderId, userId } = event.data;

      // If you are including email in event → use directly
      // If not → fetch user (not recommended for now)

      const { email } = event.data; // better approach

      if (!email) {
        console.error("Missing email in ORDER_CANCELLED event");
        return;
      }

      await sendEmail({
        to: email,
        subject: "Order Cancelled ❌",
        html: `
        <h2>Your Order Has Been Cancelled</h2>
        <p>Order ID: ${orderId}</p>
        <p>If this was not expected, contact support.</p>
      `,
      });

      console.log("ORDER_CANCELLED email sent");
    } catch (err) {
      console.error("ORDER_CANCELLED email failed:", err.message);
    }
  });

  subscribeToQueue(QUEUES.PAYMENT_FAILED, async (event) => {
    try {
      const { email, orderId } = event.data;

      if (!email) {
        console.error("Missing email in PAYMENT_FAILED event");
        return;
      }

      await sendEmail({
        to: email,
        subject: "Payment Failed ❌",
        html: `
          <h2>Payment Failed</h2>
          <p>Your payment for Order ${orderId} failed.</p>
          <a href="${CLIENT_URL}/orders/${orderId}">Retry Payment</a>
        `,
      });

      console.log("PAYMENT_FAILED email sent");
    } catch (err) {
      console.error("PAYMENT_FAILED email failed:", err.message);
    }
  });

  subscribeToQueue(QUEUES.PAYMENT_SUCCESS, async (event) => {
    try {
      const { email, username, orderId, paymentId, amount, currency } =
        event.data;

      if (!email) {
        console.error("Missing email in PAYMENT_SUCCESS event");
        return;
      }

      const invoiceBuffer = await generateInvoice({
        orderId,
        paymentId,
        amount,
        currency,
        username,
      });

      await sendEmail({
        to: email,
        subject: "Invoice - Payment Successful 🧾",
        html: `
          <h2>Payment Successful</h2>
          <p>Order ID: ${orderId}</p>
          <p>Invoice attached.</p>
        `,
        attachments: [
          {
            filename: `invoice-${orderId}.pdf`,
            content: invoiceBuffer,
          },
        ],
      });

      console.log("PAYMENT_SUCCESS invoice email sent");
    } catch (err) {
      console.error("PAYMENT_SUCCESS email failed:", err.message);
    }
  });

  subscribeToQueue(
  QUEUES.PRODUCT_NOTIFICATION_PRODUCT_CREATED,
  async (event) => {
    try {
      const { email, username, productId, title, price } = event.data;

      if (!email) {
        console.error("Missing email in PRODUCT_CREATED event");
        return;
      }

      await sendEmail({
        to: email,
        subject: "Your Product is Live 🚀",
        html: `
          <h2>Hi ${username || "Seller"},</h2>
          <p>Your product <strong>${title}</strong> has been successfully added.</p>
          <p>Product ID: ${productId}</p>
          <p>Price: ₹${(price / 100).toFixed(2)}</p>
          <a href="${CLIENT_URL}/seller/products/${productId}">
            View Product
          </a>
        `,
      });

      console.log("PRODUCT_NOTIFICATION_PRODUCT_CREATED email sent");
    } catch (err) {
      console.error(
        "PRODUCT_NOTIFICATION_PRODUCT_CREATED email failed:",
        err.message
      );
    }
  }
);
  
};
