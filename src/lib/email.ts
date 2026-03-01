import nodemailer from "nodemailer";

export async function createSendEmail(name: string, email: string, title: string, date: string, time: string) {
    const websiteUrl = 'https://xkteekupeepvexwhboyw.supabase.co/storage/v1/object/public/images/logo.png';

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
    });

    try {
        await transporter.sendMail({
            from: `"No Reply" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Appointment Confirmation",
            html: `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#f5f3ff;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your appointment is confirmed for ${date} at ${time}.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08); font-family:Arial, sans-serif; color:#111827;">
            
            <!-- Purple accent header -->
            <tr>
              <td style="background:linear-gradient(90deg,#03ad00,#11e00d); padding:20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <!-- Logo (IMPORTANT: use an absolute URL) -->
                      <img
                        src="${websiteUrl}"
                        alt="Magsaysay College"
                        width="40"
                        height="40"
                        style="display:block; border-radius:8px;"
                      />
                    </td>
                    <td style="padding-left:12px; vertical-align:middle;">
                      <div style="font-size:16px; font-weight:700; color:#ffffff; line-height:1.2;">
                        Magsaysay College
                      </div>
                      <div style="font-size:12px; color:rgba(255,255,255,0.9);">
                        Appointment Scheduler
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px 0; font-size:20px; line-height:1.3;">
                  Hello <strong>${name}</strong>,
                </h2>

                <p style="margin:0 0 16px 0; font-size:14px; line-height:1.7; color:#374151; text-indent:32px;">
                  We have received your appointment request and your schedule has been confirmed. We look forward to meeting you at the
                  Guidance Office of Magsaysay College (Cabubuhan Campus), Cabubuhan, Magsaysay, Misamis Oriental.
                </p>

                <!-- Appointment card -->
                <div style="border:1px solid #ede9fe; background:#faf5ff; border-radius:14px; padding:16px; margin:16px 0;">
                  <div style="font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:#03ad00; font-weight:700; margin-bottom:10px;">
                    Appointment Details
                  </div>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#111827;">
                    <tr>
                      <td style="padding:6px 0; width:140px;"><strong style="color:#111827;">Date:</strong></td>
                      <td style="padding:6px 0;">${date}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;"><strong style="color:#111827;">Time:</strong></td>
                      <td style="padding:6px 0;">${time}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; vertical-align:top;"><strong style="color:#111827;">Location:</strong></td>
                      <td style="padding:6px 0; color:#374151;">
                        Guidance Office of Magsaysay College (Cabubuhan Campus), Cabubuhan, Magsaysay, Misamis Oriental
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Submitted data -->
                <div style="margin-top:8px;">
                  <div style="font-size:14px; font-weight:700; margin:0 0 8px 0;">
                    Here are your submitted data:
                  </div>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#111827;">
                    <tr>
                      <td style="padding:4px 0; width:140px;"><strong>Title:</strong></td>
                      <td style="padding:4px 0;">${title}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; width:140px;"><strong>Name:</strong></td>
                      <td style="padding:4px 0;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;"><strong>Email:</strong></td>
                      <td style="padding:4px 0;">${email}</td>
                    </tr>
                  </table>
                </div>

                <!-- Friendly + formal closing -->
                <p style="margin:18px 0 0 0; font-size:14px; color:#374151; line-height:1.7;">
                  If you need to update or cancel your appointment, please contact the Guidance Office ahead of time.
                </p>

                <p style="margin:14px 0 0 0; font-size:14px; color:#111827;">
                  Sincerely,<br/>
                  <strong>Magsaysay College Guidance Office</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 24px; background:#fafafa; border-top:1px solid #f3f4f6;">
                <p style="margin:0; font-size:12px; color:#6b7280; line-height:1.6;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `
        });
    } catch (e) {
        console.error(e)
    }
}

export async function createReminderEmail(
    name: string,
    email: string,
    title: string,
    date: string, // e.g. "March 2, 2026"
    time: string  // e.g. "10:00 AM - 10:30 AM"
) {
    const websiteUrl =
        "https://xkteekupeepvexwhboyw.supabase.co/storage/v1/object/public/images/logo.png";

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: `"No Reply" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Appointment Reminder (Tomorrow)",
            html: `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:#f5f3ff;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Reminder: Your appointment is tomorrow (${date}) at ${time}.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08); font-family:Arial, sans-serif; color:#111827;">
            
            <!-- Green accent header -->
            <tr>
              <td style="background:linear-gradient(90deg,#03ad00,#11e00d); padding:20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img
                        src="${websiteUrl}"
                        alt="Magsaysay College"
                        width="40"
                        height="40"
                        style="display:block; border-radius:8px;"
                      />
                    </td>
                    <td style="padding-left:12px; vertical-align:middle;">
                      <div style="font-size:16px; font-weight:700; color:#ffffff; line-height:1.2;">
                        Magsaysay College
                      </div>
                      <div style="font-size:12px; color:rgba(255,255,255,0.9);">
                        Appointment Scheduler
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px 0; font-size:20px; line-height:1.3;">
                  Hello <strong>${name}</strong>,
                </h2>

                <p style="margin:0 0 16px 0; font-size:14px; line-height:1.7; color:#374151; text-indent:32px;">
                  This is a friendly reminder that <strong>tomorrow</strong> is your scheduled appointment with the Guidance Office of
                  Magsaysay College (Cabubuhan Campus), Cabubuhan, Magsaysay, Misamis Oriental.
                </p>

                <!-- Reminder card -->
                <div style="border:1px solid #ede9fe; background:#faf5ff; border-radius:14px; padding:16px; margin:16px 0;">
                  <div style="font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:#03ad00; font-weight:700; margin-bottom:10px;">
                    Reminder Details
                  </div>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#111827;">
                    <tr>
                      <td style="padding:6px 0; width:140px;"><strong style="color:#111827;">Date:</strong></td>
                      <td style="padding:6px 0;">${date}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;"><strong style="color:#111827;">Time:</strong></td>
                      <td style="padding:6px 0;">${time}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;"><strong style="color:#111827;">Purpose:</strong></td>
                      <td style="padding:6px 0;">${title}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; vertical-align:top;"><strong style="color:#111827;">Location:</strong></td>
                      <td style="padding:6px 0; color:#374151;">
                        Guidance Office of Magsaysay College (Cabubuhan Campus), Cabubuhan, Magsaysay, Misamis Oriental
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="margin:0; font-size:14px; color:#374151; line-height:1.7;">
                  Please arrive a few minutes early. If you need to update or cancel your appointment, please contact the Guidance Office ahead of time.
                </p>

                <p style="margin:14px 0 0 0; font-size:14px; color:#111827;">
                  Sincerely,<br/>
                  <strong>Magsaysay College Guidance Office</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 24px; background:#fafafa; border-top:1px solid #f3f4f6;">
                <p style="margin:0; font-size:12px; color:#6b7280; line-height:1.6;">
                  This is an automated reminder. Please do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
        });
    } catch (e) {
        console.error(e);
    }
}