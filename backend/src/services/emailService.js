
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log(
      `[email] SMTP connection verified (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 465}).`
    );
  })
  .catch((error) => {
    console.error("[email] SMTP connection verification failed:", error.message);
  });

function maskEmail(email) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "[invalid email]";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export async function sendResetOtp(email, otp) {
  const maskedEmail = maskEmail(email);

  console.log(`[email] Sending password reset code to ${maskedEmail}.`);

  try {
    const info = await transporter.sendMail({
      from: `"RaphaCare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "RaphaCare Password Reset Code",
      text: [
        "You requested a password reset for your RaphaCare account.",
        "",
        `Your verification code is: ${otp}`,
        "",
        "This code expires in 10 minutes.",
        "Do not share this code with anyone.",
        "If you did not request this, ignore this email.",
      ].join("\n"),
    });

    const accepted = Array.isArray(info.accepted) && info.accepted.includes(email);

    if (!accepted) {
      console.error(
        `[email] Password reset code was not accepted for ${maskedEmail}.`,
        {
          rejected: info.rejected,
          response: info.response,
        }
      );

      throw new Error("SMTP server did not accept the password reset email.");
    }

    console.log(
      `[email] Password reset code sent to ${maskedEmail}.`,
      {
        messageId: info.messageId,
        response: info.response,
      }
    );

    return info;
  } catch (error) {
    console.error(
      `[email] Password reset code delivery failed for ${maskedEmail}:`,
      error.message
    );
    throw error;
  }
}
