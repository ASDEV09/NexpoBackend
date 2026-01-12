import nodemailer from "nodemailer";

import baseEmailTemplate from "./baseEmailTemplate.mjs";

const expoMailer = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Expo Management System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: baseEmailTemplate(html)
  });
};

export default expoMailer;
