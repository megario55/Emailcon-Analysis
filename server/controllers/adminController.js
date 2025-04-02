import User from "../models/User.js";
import transporter from "../config/nodemailer.js";
export const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

export const updateStatus = async (req, res) => {
  const { id, status } = req.body;
  const user = await User.findByIdAndUpdate(
    id,
    {
      isActive: status,
    },
    {
      new: true,
    }
  );

  const mailOptions = {
    from: `"Emailcon Support" <emailcon.01012000@gmail.com>`,
    to: user.email,
    subject: `Account ${status ? "Activated" : "Deactivated"}`,
    html: `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Notification</title>
        </head>
        <body style="margin:0; padding:20px; font-family:Arial, sans-serif; background-color:#f7f7f7; color:#333;">
            <table role="presentation" style="width:100%; background-color:#f7f7f7;" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center">
                        <table role="presentation" style="max-width:600px; width:100%; background:#fff; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" style="background:#1a5eb8; color:white; padding:20px;">
                                      <div style="font-size:50px;margin-bottom:10px;border:none;display:inline-block;">✉️</div>
                                    <h1 style="margin:0; font-size:24px;">Account Notification</h1>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding:20px;">
                                    <p style="margin:10px 0; font-size:16px;">Hello <strong>${
                                      user.username
                                    }</strong>,</p>
                                    <p style="margin:10px 0; font-size:16px;">Your account status has changed.</p>
                                    <h3 style="color:${
                                      status ? "#28a745" : "#dc3545"
                                    };">Your account has been ${
      status ? "activated" : "deactivated"
    }.</h3>
                                    <p style="margin:10px 0; font-size:14px;">
                                        You can ${
                                          status
                                            ? "now access your services"
                                            : "contact admin for more details"
                                        }.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding:20px; background:#f7f7f7;">
                                    <p style="font-size:12px; color:#666;">
                                        If you have any questions, contact us at
                                        <a href="mailto:support@emailcon.com" style="color:#1a5eb8; text-decoration:none;">support@emailcon.com</a>.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) return res.status(500).send("Email failed to send.");
    res.send(`Account ${status ? "activated" : "deactivated"} successfully.`);
  });
};
