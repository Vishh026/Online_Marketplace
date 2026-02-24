const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email server connection error:", error);
  } else {
    console.log("Email server is ready");
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: `"Your Name" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("Message sent:", info.messageId);
};

module.exports = sendEmail;