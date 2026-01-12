const accountUnapprovedTemplate = ({ name, role }) => {
  return `
    <div style="font-family:Arial, sans-serif; line-height:1.6">
      <h2 style="color:#dc3545">⚠ Account Deactivated</h2>

      <p>Hello <b>${name}</b>,</p>

      <p>
        Your <b>${role}</b> account is currently
        <b>inactive or not approved</b>.
      </p>

      <p>
        If you believe this is a mistake, please contact the administrator
        for further assistance.
      </p>

      <p style="margin-top:20px">
        Regards,<br/>
        <b>Expo Management Team</b>
      </p>
    </div>
  `;
};

export default accountUnapprovedTemplate;
