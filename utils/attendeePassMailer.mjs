import nodemailer from "nodemailer";

export const sendAttendeePass = async ({ to, expo, pdfBuffer, passName }) => {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Expo Pass" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎟 Your Pass for ${expo.title}`,
    html: `
      <h3>Hello!</h3>
      <p>Your pass for <b>${expo.title}</b> is attached.</p>
      <p>Please present it at the venue entrance.</p>
    `,
    attachments: [{
      filename: passName,
      content: pdfBuffer,
      contentType: "application/pdf"
    }]
  });
};
