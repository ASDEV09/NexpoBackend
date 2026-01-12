import nodemailer from "nodemailer";

export const sendExhibitorQR = async ({
  to,
  exhibitorName,
  expo,
  qrBuffer,
  qrName
}) => {
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
    subject: `📍 Booth QR Code – ${expo.title}`,
    html: `
      <h3>Hello ${exhibitorName},</h3>
      <p>Your booth has been <b>successfully booked</b>.</p>
      <p>Please find your <b>Booth QR Code</b> attached.</p>
      <p>Attendees can scan this QR to visit your booth.</p>
      <br/>
      <p><b>Expo:</b> ${expo.title}</p>
      <p><b>Location:</b> ${expo.location}</p>
    `,
    attachments: [
      {
        filename: qrName,
        content: qrBuffer,
        contentType: "image/png"
      }
    ]
  });
};
