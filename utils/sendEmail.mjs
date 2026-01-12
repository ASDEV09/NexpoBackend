import nodemailer from "nodemailer";

import baseEmailTemplate from "./baseEmailTemplate.mjs";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Expo App" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: baseEmailTemplate(options.message),
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
