const nodemailer = require("nodemailer");
const AppError = require("./AppError");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, verificationLink) => {
  try {
    const mailOptions = {
      from: `"Fooderu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Our App!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; 
                    text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${verificationLink}
          </p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return new AppError("Failed to send verification email", 500);
  }
};

module.exports = { sendVerificationEmail };
