import { transporter } from "./EmailConfig.js";
import {
  Verification_Email_Template,
  Welcome_Email_Template,
} from "./EmailTemplate.js";

export const sendVerificationEamil = async (email, verificationCode) => {
  try {
    const response = await transporter.sendMail({
      from: '"Fooderu" <devfoodaru@gmail.com>',

      to: email, // list of receivers
      subject: "Verify your Email", // Subject line
      text: "Verify your Email", // plain text body
      html: Verification_Email_Template.replace(
        "{verificationCode}",
        verificationCode
      ),
    });
    // console.log("Email send Successfully", response);
  } catch (error) {
    // console.error("Email error", error);
    // return res.status(500).json({
    //   message: "Internal Server Error, while sending verification email",
    // });
  }
};

export const sendWelcomeEmail = async (email) => {
  try {
    const response = await transporter.sendMail({
      from: '"Fooderu" <devfoodaru@gmail.com>',

      to: email, // list of receivers
      subject: "Welcome Email", // Subject line
      text: "Welcome Email", // plain text body
      html: Welcome_Email_Template.replace("{name}", email),
    });
    // console.log("Email send Successfully", response);
  } catch (error) {
    // console.error("Email error", error);
    // return res.status(500).json({
    //   message: "Internal Server Error, while sending welcome email",
    // });
  }
};
