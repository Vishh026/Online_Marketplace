const { subscribeToQueue } = require("./broker");
const sendEmail = require("../email");
const QUEUES = require("../constants/queues");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

module.exports = function registerSubscribers() {

  subscribeToQueue(QUEUES.USER_REGISTERED, async (event) => {
    try {
      const { data } = event;
      const { username, email } = data;

      await sendEmail({
        to: email,
        subject: `Welcome ${username}! 🎉`,
        html: `
          <h2>Welcome ${username}</h2>
          <p>Your account has been created successfully.</p>
          <a href="${CLIENT_URL}/login">Login</a>
        `,
      });

    } catch (err) {
      console.error("USER_REGISTERED failed:", err);
      throw err;
    }
  });

  subscribeToQueue(QUEUES.USER_LOGIN, async (event) => {
    try {
      const { data } = event;
      const { userId, ip } = data;

      console.log(`User ${userId} logged in from ${ip}`);

      // optional: security alert email

    } catch (err) {
      console.error("USER_LOGIN failed:", err);
      throw err;
    }
  });

  subscribeToQueue(QUEUES.PAYMENT_SUCCESS, async (event) => {
    try {
      const { data } = event;
      const { userId, orderId, amount, currency } = data;

      await sendEmail({
        to: data.email, // only if you include email in event
        subject: "Payment Successful ✅",
        html: `
          <h2>Payment Successful</h2>
          <p>Order ID: ${orderId}</p>
          <p>Amount: ${amount / 100} ${currency}</p>
        `,
      });

      console.log("PAYMENT_SUCCESS handled");

    } catch (err) {
      console.error("PAYMENT_SUCCESS failed:", err);
      throw err;
    }
  });

  subscribeToQueue(QUEUES.PAYMENT_FAILED, async (event) => {
    try {
      const { data } = event;
      const { orderId, reason } = data;

      await sendEmail({
        to: data.email,
        subject: "Payment Failed ❌",
        html: `
          <h2>Payment Failed</h2>
          <p>Order ID: ${orderId}</p>
          <p>Reason: ${reason}</p>
          <a href="${CLIENT_URL}/retry-payment">Retry Payment</a>
        `,
      });

      console.log("PAYMENT_FAILED handled");

    } catch (err) {
      console.error("PAYMENT_FAILED failed:", err);
      throw err;
    }
  });

};