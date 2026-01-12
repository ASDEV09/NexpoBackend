const accountApprovedTemplate = ({ name, role }) => {
  return `
    <div style="font-family:Arial, sans-serif; line-height:1.6">
      <h2 style="color:#28a745">🎉 Account Approved</h2>

      <p>Hello <b>${name}</b>,</p>

      <p>
        We are pleased to inform you that your
        <b>${role}</b> account has been <b>approved and activated</b>.
      </p>

      <p>
        You can now log in and access all features of the Expo Management System.
      </p>

      <p style="margin-top:20px">
        Best regards,<br/>
        <b>Expo Management Team</b>
      </p>
    </div>
  `;
};

export default accountApprovedTemplate;
