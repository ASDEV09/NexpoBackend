import nodemailer from "nodemailer";
// 🔹 SEND EMAIL WITH PDF ATTACH + ORIGINAL HTML CONTENT
const sendBoothPass = async ({ to, pdfBuffer, passName, exhibitor, booth, expo, productsServices, staff }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const emailHtml = `
    <h2>Booth Booking Confirmation</h2>

    <p>Hello <b>${exhibitor.name}</b>,</p>

    <p>Your booth has been <b>successfully booked</b>.</p>

    <h3>📌 Booking Details</h3>
    <ul>
      <li><b>Expo:</b> ${expo.title}</li>
      <li><b>Booth Name:</b> ${booth.name}</li>
      <li><b>Booth Size:</b> ${booth.size} ft</li>
      <li><b>Location:</b> ${expo.location}</li>
      <li><b>Start Date:</b> ${new Date(expo.startDate).toDateString()}</li>
      <li><b>End Date:</b> ${new Date(expo.endDate).toDateString()}</li>
    </ul>

    <h3>🛍 Products / Services</h3>
    <p>${productsServices.join(", ")}</p>

    <h3>👥 Staff Added</h3>
    <ul>
      ${staff.map(s => `<li>${s.name} – ${s.role} (${s.contact})</li>`).join("")}
    </ul>

    <p>Thank you for choosing our platform.</p>

    <p><b>Expo Management System</b></p>
  `;

  await transporter.sendMail({
    from: `"Expo Management System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎫 Booth Booking Confirmation`,
    html: emailHtml,
    attachments: [
      {
        filename: passName,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
};
export default sendBoothPass;