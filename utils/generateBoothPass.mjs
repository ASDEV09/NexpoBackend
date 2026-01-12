import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// 🔹 PDF + QR Generator (Premium Badge Style)
const generateBoothPass = async ({ booth, exhibitor, expo }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 0 }); // Full bleed
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  // --- ARTEFACTS & COLORS ---
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const colors = {
    dark: "#1a1a2e",
    accent: "#e94560", // vibrant pink-red
    gold: "#FFD700",
    textLight: "#ffffff",
    textDark: "#333333",
    bg: "#f3f4f6"
  };

  // 1. PAGE BACKGROUND (Light Gray)
  doc.rect(0, 0, pageWidth, pageHeight).fill(colors.bg);

  // 2. CENTRAL CARD CONTAINER (Simulating a physical badge)
  const cardWidth = 400;
  const cardHeight = 600;
  const cardX = (pageWidth - cardWidth) / 2; // ~97
  const cardY = (pageHeight - cardHeight) / 2; // ~120

  // Draw Card Shadow (Simulated by offset dark rect)
  doc.roundedRect(cardX + 5, cardY + 5, cardWidth, cardHeight, 15).fill("#dbdbdb");
  // Draw White Card
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 15).fill("#ffffff");

  // --- CARD HEADER ---
  // Top Banner (Dark Navy)
  doc.save(); // Clip context
  doc.roundedRect(cardX, cardY, cardWidth, 140, 15).clip();
  doc.rect(cardX, cardY, cardWidth, 140).fill(colors.dark);

  // Expo Title (White, Centered)
  doc.fontSize(22).font('Helvetica-Bold').fillColor(colors.textLight)
    .text((expo?.title || "EXPO EVENT").toUpperCase(), cardX, cardY + 40, { width: cardWidth, align: 'center' });

  // Badge Type (Accent Pill)
  const badgeText = "OFFICIAL EXHIBITOR";
  doc.roundedRect(cardX + 100, cardY + 110, 200, 30, 15).fill(colors.accent);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.textLight)
    .text(badgeText, cardX, cardY + 118, { width: cardWidth, align: 'center', characterSpacing: 1 });

  doc.restore(); // End clip

  // --- CARD BODY ---
  const contentStartY = cardY + 180;
  doc.fillColor(colors.textDark);

  // Exhibitor Name (Large)
  doc.fontSize(10).font('Helvetica').fillColor('#888')
    .text("EXHIBITOR NAME", cardX, contentStartY, { width: cardWidth, align: 'center' });
  doc.fontSize(20).font('Helvetica-Bold').fillColor(colors.dark)
    .text(exhibitor?.name || "Valued Exhibitor", cardX, contentStartY + 15, { width: cardWidth, align: 'center' });

  // Organization / Contact
  doc.fontSize(12).font('Helvetica').fillColor('#555')
    .text(exhibitor?.email || "", cardX, contentStartY + 40, { width: cardWidth, align: 'center' });

  // Separator
  doc.moveTo(cardX + 50, contentStartY + 70).lineTo(cardX + 350, contentStartY + 70).lineWidth(1).stroke("#eeeeee");

  // Grid Info (Booth & Date)
  const gridY = contentStartY + 90;

  // Left Column: Booth
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#888').text("BOOTH NUMBER", cardX + 30, gridY);
  doc.fontSize(24).font('Helvetica-Bold').fillColor(colors.accent).text(booth?.name || "N/A", cardX + 30, gridY + 15);

  // Right Column: Location
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#888').text("LOCATION", cardX + 220, gridY);
  doc.fontSize(14).font('Helvetica').fillColor(colors.dark).text(expo?.location || "Main Hall", cardX + 220, gridY + 15);

  // Bottom Row: Date
  const dateY = gridY + 60;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#888').text("VALID DATES", cardX + 30, dateY);
  const dateStr = expo?.startDate
    ? `${new Date(expo.startDate).toLocaleDateString()} - ${new Date(expo.endDate).toLocaleDateString()}`
    : "Full Event Access";
  doc.fontSize(12).font('Helvetica').fillColor(colors.dark).text(dateStr, cardX + 30, dateY + 15);

  // --- QR CODE (Bottom of Card) ---
  const qrUrl = `${process.env.FRONTEND_URL}/attendee/boothvisit/${booth.expoId}/${booth._id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl);
  const qrImage = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrImage, "base64");

  const qrSize = 130;
  const qrY = cardY + cardHeight - 170; // 170px from bottom of card

  // QR Background box
  doc.roundedRect((pageWidth - qrSize) / 2 - 10, qrY - 10, qrSize + 20, qrSize + 20, 10).fill("#ffffff").stroke("#eeeeee");
  doc.image(qrBuffer, (pageWidth - qrSize) / 2, qrY, { width: qrSize, height: qrSize });

  doc.fontSize(9).font('Helvetica').fillColor('#999')
    .text("Scan this code at entry", cardX, qrY + qrSize + 20, { width: cardWidth, align: 'center' });

  doc.end();

  const pdfBuffer = await new Promise(resolve =>
    doc.on("end", () => resolve(Buffer.concat(buffers)))
  );

  return {
    buffer: pdfBuffer,
    fileName: `EXHIBITOR-PASS-${booth.name}.pdf`
  };
};

export default generateBoothPass;
