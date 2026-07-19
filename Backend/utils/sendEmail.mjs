import { Resend } from "resend";

// Created lazily so the module can be imported without RESEND_API_KEY set.
let resend;

const getClient = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// Sends transactional mail through Resend. With no API key configured the email
// is logged to the terminal instead, so the flows that depend on it stay
// testable locally and in CI without a network call.
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "test") {
      console.log("\n--- Email (not sent, RESEND_API_KEY is not set) ---");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(html);
      console.log("--- End email ---\n");
    }
    return;
  }

  const { error } = await getClient().emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }
};

// Password reset email. Kept next to sendEmail so the markup lives with the
// transport rather than in the controller.
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222;">
      <h2 style="color: #e77b31;">Reset your Dineary password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #e77b31; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset password</a>
      </p>
      <p style="font-size: 13px; color: #666;">If the button does not work, paste this into your browser:<br />${resetUrl}</p>
      <p style="font-size: 13px; color: #666;">If you did not request this, you can ignore this email. Your password will stay the same.</p>
    </div>
  `;

  await sendEmail({ to, subject: "Reset your Dineary password", html });
};

export { sendEmail, sendPasswordResetEmail };
