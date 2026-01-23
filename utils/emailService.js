const nodemailer = require("nodemailer");
const AppError = require("./AppError");
const { getFrontendUrl } = require("./envUtil");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Mobile: Send OTP email
const sendOTPEmail = async (email, otp, name = "") => {
  try {
    const mailOptions = {
      from: `"Fooderu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for email verification</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 6px; text-align: center; margin: 25px 0;">
            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Enter this OTP to verify your email address:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #007bff; margin: 20px 0; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #dc3545; font-size: 14px; margin: 0;">
              <strong>This OTP will expire in 10 minutes.</strong>
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 14px; margin-bottom: 5px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; font-size: 14px; padding-left: 20px; margin-top: 10px;">
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this OTP, please ignore this email</li>
              <li>For security reasons, this OTP is valid for one-time use only</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new AppError("Failed to send OTP email", 500);
  }
};

// Mobile:Resend OTP email
const sendResendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Fooderu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your New Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Verification OTP</h2>
          <p>You requested a new OTP. Here is your new verification code:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 28px; letter-spacing: 5px; margin: 20px 0; font-weight: bold;">
            ${otp}
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request a new OTP, please secure your account.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending resend OTP email:", error);
    throw new AppError("Failed to send new OTP email", 500);
  }
};

// console.log(getFrontendUrl());

// Web: Send email verification link
const sendVerificationEmail = async (email, verificationToken) => {
  try {
    // const verificationLink = `http://localhost:5173/verifyEmail?token=${verificationToken}`;

    const verificationLink = `${process.env.FRONTEND_URL}/verifyEmail?token=${verificationToken}`;

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
    // console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    // console.error("Error sending verification email:", error);
    return new AppError("Failed to send verification email", 500);
  }
};

module.exports = { sendVerificationEmail, sendOTPEmail, sendResendOTPEmail };
