import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from '../config/consts.js';

export async function sendReviewEmail(to, reviewInfo, attachment) {
  const transporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.password
    }
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DataField - Informe de Inspección</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3faff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3faff; padding: 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 32, 83, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px; text-align: center; background: linear-gradient(135deg, #002053, #00347e); border-radius: 12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; color: #ffffff; font-weight: 700;">DataField</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <span style="font-size: 14px; color: #d9e2ff;">Sistema de Gestión de Informes</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #002053;">
                Informe de Inspección
              </h1>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e6f6ff; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="font-size: 12px; font-weight: 600; color: #43474d; text-transform: uppercase; letter-spacing: 0.5px;">Código de Documento</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; font-weight: 700; color: #002053;">
                          ${reviewInfo.docCode || 'N/A'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #c3c7ce;">
                    <span style="font-size: 13px; color: #43474d;">Proyecto:</span>
                    <span style="font-size: 13px; font-weight: 600; color: #071e27; margin-left: 8px;">${reviewInfo.projectName || 'N/A'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #c3c7ce;">
                    <span style="font-size: 13px; color: #43474d;">Fecha:</span>
                    <span style="font-size: 13px; font-weight: 600; color: #071e27; margin-left: 8px;">${reviewInfo.date || 'N/A'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #c3c7ce;">
                    <span style="font-size: 13px; color: #43474d;">Estado:</span>
                    <span style="font-size: 13px; font-weight: 600; color: #071e27; margin-left: 8px;">${reviewInfo.status || 'N/A'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="font-size: 13px; color: #43474d;">Formato:</span>
                    <span style="font-size: 13px; font-weight: 600; color: #071e27; margin-left: 8px; text-transform: uppercase;">${reviewInfo.format || 'N/A'}</span>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; padding: 16px; background-color: #dbf1fe; border-radius: 8px; border-left: 4px solid #002053;">
                <p style="margin: 0; font-size: 14px; color: #071e27;">
                  Se adjunta informe de inspección en formato <strong>${reviewInfo.format}</strong>.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #f3faff; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #73777e;">
                Este correo fue enviado automáticamente por el sistema DataField.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #73777e;">
                © ${new Date().getFullYear()} DataField. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const info = await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Informe de Inspección - ${reviewInfo.docCode || 'N/A'}`,
    html: htmlContent,
    attachments: attachment ? [{
      filename: attachment.filename,
      content: attachment.buffer
    }] : []
  });

  return info;
}
