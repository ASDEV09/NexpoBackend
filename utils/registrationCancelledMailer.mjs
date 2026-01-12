import nodemailer from "nodemailer";

export const sendRegistrationCancelledEmail = async ({
  to,
  attendeeName,
  expoName
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Expo Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Expo Registration Cancelled",
    html: `
      <p>Dear <strong>${attendeeName}</strong>,</p>

      <p>Your registration for the expo <strong>${expoName}</strong> has been cancelled by the admin.</p>

      <p>If you think this is a mistake, please contact support.</p>

      <br/>
      <p>Regards,<br/>Expo Team</p>
    `
  });
};
