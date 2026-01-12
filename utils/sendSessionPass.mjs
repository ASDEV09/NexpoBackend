import nodemailer from "nodemailer";

export const sendSessionPass = async ({ to, session, pdfBuffer, passName }) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Session Ticket" <${process.env.EMAIL_USER}>`,
        to,
        subject: `🎟 Your Ticket for ${session.title}`,
        html: `
      <h3>Hello!</h3>
      <p>Your ticket for <b>${session.title}</b> is attached.</p>
      <p><b>Date:</b> ${session.date}<br>
      <b>Time:</b> ${session.startTime} - ${session.endTime}<br>
      <b>Location:</b> ${session.location}</p>
      <p>Please present this ticket at the entrance.</p>
    `,
        attachments: [{
            filename: passName,
            content: pdfBuffer,
            contentType: "application/pdf"
        }]
    });
};
