import PDFDocument from "pdfkit";
import axios from "axios";

export const generateSessionPass = async ({
    session,
    attendeeName,
    attendeeEmail,
    serial
}) => {

    const doc = new PDFDocument({ size: [520, 240], margin: 0 });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));

    let imageBuffer = null;
    try {
        const imageUrl = session.bannerImage || "https://placehold.co/600x400?text=No+Image";
        const res = await axios.get(imageUrl, {
            responseType: "arraybuffer"
        });
        imageBuffer = Buffer.from(res.data);
    } catch { }

    if (imageBuffer) {
        doc.image(imageBuffer, 0, 0, { width: 180, height: 240 });
    }

    doc.rect(180, 0, 340, 240).fill("#0b0f1a");

    // Type Badge
    doc.rect(200, 28, 80, 20).fill("#14b8a6");
    doc.fontSize(10).fillColor("#fff").font("Helvetica-Bold").text(session.type.toUpperCase(), 210, 34);

    // Title
    doc.fillColor("#fff")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(session.title, 200, 60, { width: 300 });

    // Date & Time
    doc.fontSize(12)
        .fillColor("#f5c542")
        .text(
            `${session.date} | ${session.startTime} - ${session.endTime}`,
            200,
            100
        );

    doc.fontSize(11)
        .fillColor("#ccc")
        .text(session.location, 200, 125);

    // 👤 ATTENDEE (FORM DATA)
    doc.fontSize(9).fillColor("#888").text("ATTENDEE", 200, 155);

    doc.font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#fff")
        .text(attendeeName, 200, 170);

    doc.font("Helvetica")
        .fontSize(10)
        .fillColor("#aaa")
        .text(attendeeEmail, 200, 190);

    doc.font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#f5c542")
        .text(`Ticket No: ${serial}`, 200, 215);

    doc.end();

    const pdfBuffer = await new Promise(resolve =>
        doc.on("end", () => resolve(Buffer.concat(buffers)))
    );

    return {
        buffer: pdfBuffer,
        fileName: `SESSION-TICKET-${serial}.pdf`
    };
};
