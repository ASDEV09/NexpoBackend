const baseEmailTemplate = (content) => {
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expo Management</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 30px 20px; text-align: center; }
        .header img { max-height: 50px; object-fit: contain; }
        .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #475569; }
        .footer { background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white !important; text-decoration: none; border-radius: 30px; font-weight: 600; margin-top: 20px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: all 0.3s ease; }
        .btn:hover { background-color: #059669; box-shadow: 0 6px 8px rgba(16, 185, 129, 0.3); }
        h1, h2, h3 { color: #1e293b; margin-top: 0; }
        p { margin-bottom: 16px; }
        .otp { font-size: 28px; font-weight: 800; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; display: inline-block; padding: 15px 30px; border-radius: 8px; margin: 20px 0; border: 1px dashed #cbd5e1; }
        .divider { height: 1px; background-color: #e2e8f0; margin: 25px 0; }
        a { color: #10b981; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; width: 100%; box-shadow: none; }
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <!-- Ensure this logo URL is valid or use a text fallback -->
            <img src="https://res.cloudinary.com/dpkazflwy/image/upload/v1768156890/images_oknyty_vqtukf.png" alt="NexPo Logo">
        </div>

        <!-- BODY -->
        <div class="content">
            ${content}
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <p>&copy; ${currentYear} NexPo Management System. All rights reserved.</p>
            <p style="margin: 0;">
                <a href="#">Privacy Policy</a> &bull; <a href="#">Terms of Service</a> &bull; <a href="#">Support</a>
            </p>
            <p style="margin-top: 10px; opacity: 0.6;">This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
  `;
};

export default baseEmailTemplate;
