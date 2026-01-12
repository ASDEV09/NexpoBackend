import PDFDocument from "pdfkit";
import axios from "axios";

export const generateExpoPass = async ({
  expo,
  attendeeName,
  attendeeEmail,
  serial
}) => {

  const doc = new PDFDocument({ size: [520, 240], margin: 0 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  let imageBuffer = null;
  try {
    const res = await axios.get(expo.thumbnailImage, {
      responseType: "arraybuffer"
    });
    imageBuffer = Buffer.from(res.data);
  } catch {}

  if (imageBuffer) {
    doc.image(imageBuffer, 0, 0, { width: 180, height: 240 });
  }

  doc.rect(180, 0, 340, 240).fill("#0b0f1a");

  doc.fillColor("#fff")
     .font("Helvetica-Bold")
     .fontSize(22)
     .text(expo.title, 200, 28);

  doc.fontSize(12)
     .fillColor("#f5c542")
     .text(
       `${new Date(expo.startDate).toDateString()} → ${new Date(expo.endDate).toDateString()}`,
       200,
       70
     );

  doc.fontSize(11)
     .fillColor("#ccc")
     .text(expo.location, 200, 105);

  // 👤 ATTENDEE (FORM DATA)
  doc.fontSize(9).fillColor("#888").text("ATTENDEE", 200, 145);

  doc.font("Helvetica-Bold")
     .fontSize(14)
     .fillColor("#fff")
     .text(attendeeName, 200, 160);

  doc.font("Helvetica")
     .fontSize(10)
     .fillColor("#aaa")
     .text(attendeeEmail, 200, 180);

  doc.font("Helvetica-Bold")
     .fontSize(11)
     .fillColor("#f5c542")
     .text(`Ticket No: ${serial}`, 200, 205);

  doc.end();

  const pdfBuffer = await new Promise(resolve =>
    doc.on("end", () => resolve(Buffer.concat(buffers)))
  );

  return {
    buffer: pdfBuffer,
    fileName: `TICKET-${serial}.pdf`
  };
};
