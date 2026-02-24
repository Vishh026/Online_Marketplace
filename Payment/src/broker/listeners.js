const { subscribeToQueue } = require("./broker");
const sendEmail = require("../email");

module.exports = function () {
  subscribeToQueue("AUTH_NOTIFICATION_USER_CREATED", async (data) => {
    console.log("Received data from queue:", data);

    const { username, email, role } = data;

    const subject = `Welcome to Our Platform, ${username}! 🎉`;

    const text = `
Welcome ${username},

Your account has been successfully created.

Email: ${email}
Role: ${role}

You can now log in and start using the platform.

If you did not create this account, please contact support immediately.

Regards,
The Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
  <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
    
    <h2 style="color: #222;">Welcome, ${username}! 🎉</h2>

    <p>Your account has been successfully created.</p>

    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Role:</strong> ${role}</p>

    <p style="margin-top: 20px;">
      You can now log in and start using the platform.
    </p>

    <a href="http://localhost:3000/login"
       style="display: inline-block; margin-top: 20px; padding: 12px 20px;
              background-color: #2563eb; color: white;
              text-decoration: none; border-radius: 5px;">
      Go to Login
    </a>

    <hr style="margin: 30px 0;" />

    <p style="font-size: 12px; color: #888;">
      If you did not create this account, please contact support immediately.
    </p>

  </div>
</body>
</html>
    `;

    try {
      await sendEmail({
        to: email,
        subject,
        text,
        html,
      });

      console.log("Welcome email sent successfully");

    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw error; // Important so your broker can nack properly
    }
  });
};