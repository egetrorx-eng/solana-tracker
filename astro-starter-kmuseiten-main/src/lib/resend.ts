/**
 * Resend Email Utilities
 * ═══════════════════════════════════════════════════════════════
 * Pre-configured email sending with Swiss B2B professional templates.
 * Always enabled - used for transactional emails in all tiers.
 */

import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = import.meta.env.RESEND_API_KEY;
const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'noreply@example.com';

if (!resendApiKey) {
  console.warn('⚠️ RESEND_API_KEY is not set. Email sending will fail.');
}

export const resend = new Resend(resendApiKey);

/**
 * Email configuration
 */
export const emailConfig = {
  from: fromEmail,
  replyTo: import.meta.env.RESEND_REPLY_TO || fromEmail,
};

/**
 * Send email with error handling
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || emailConfig.replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES - Swiss B2B Professional Style (Formal German)
// ═══════════════════════════════════════════════════════════════

/**
 * Base email wrapper with professional styling
 */
function emailWrapper(content: string, footer?: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          ${footer ? `
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #eaeaea; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
                ${footer}
              </p>
            </td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Lead notification email (sent to admin when contact form submitted)
 */
export function leadNotificationEmail(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}): string {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
      Neue Kontaktanfrage
    </h1>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
          <strong style="color: #666666;">Name:</strong><br>
          ${data.name}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
          <strong style="color: #666666;">E-Mail:</strong><br>
          <a href="mailto:${data.email}" style="color: #0066cc;">${data.email}</a>
        </td>
      </tr>
      ${data.phone ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
          <strong style="color: #666666;">Telefon:</strong><br>
          <a href="tel:${data.phone}" style="color: #0066cc;">${data.phone}</a>
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px 0;">
          <strong style="color: #666666;">Nachricht:</strong><br>
          <div style="margin-top: 8px; padding: 16px; background-color: #fafafa; border-radius: 4px; white-space: pre-wrap;">${data.message}</div>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-size: 13px; color: #999999;">
      Quelle: ${data.source || 'Website-Kontaktformular'}
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Contact confirmation email (sent to user after form submission)
 */
export function contactConfirmationEmail(data: {
  name: string;
  companyName?: string;
}): string {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
      Vielen Dank für Ihre Anfrage
    </h1>
    
    <p style="margin: 0 0 16px;">
      Guten Tag ${data.name},
    </p>
    
    <p style="margin: 0 0 16px;">
      vielen Dank für Ihre Kontaktaufnahme. Wir haben Ihre Nachricht erhalten und werden uns schnellstmöglich bei Ihnen melden.
    </p>
    
    <p style="margin: 0 0 16px;">
      In der Regel antworten wir innerhalb von 24 Stunden während der Geschäftszeiten (Mo-Fr, 09:00-17:00 Uhr).
    </p>
    
    <p style="margin: 0 0 8px;">
      Mit freundlichen Grüssen
    </p>
    
    <p style="margin: 0; font-weight: 600;">
      ${data.companyName || 'Das Team'}
    </p>
  `;

  const footer = `
    Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese Nachricht.
  `;

  return emailWrapper(content, footer);
}

/**
 * Welcome email (for new user signups)
 */
export function welcomeEmail(data: {
  name: string;
  companyName?: string;
  loginUrl?: string;
}): string {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
      Willkommen bei ${data.companyName || 'uns'}!
    </h1>
    
    <p style="margin: 0 0 16px;">
      Guten Tag ${data.name},
    </p>
    
    <p style="margin: 0 0 16px;">
      herzlich willkommen! Ihr Konto wurde erfolgreich erstellt.
    </p>
    
    ${data.loginUrl ? `
    <p style="margin: 0 0 24px;">
      <a href="${data.loginUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Zum Login
      </a>
    </p>
    ` : ''}
    
    <p style="margin: 0 0 16px;">
      Bei Fragen stehen wir Ihnen gerne zur Verfügung.
    </p>
    
    <p style="margin: 0 0 8px;">
      Mit freundlichen Grüssen
    </p>
    
    <p style="margin: 0; font-weight: 600;">
      ${data.companyName || 'Das Team'}
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Password reset email
 */
export function passwordResetEmail(data: {
  name: string;
  resetUrl: string;
  companyName?: string;
}): string {
  const content = `
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
      Passwort zurücksetzen
    </h1>
    
    <p style="margin: 0 0 16px;">
      Guten Tag ${data.name},
    </p>
    
    <p style="margin: 0 0 16px;">
      Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen:
    </p>
    
    <p style="margin: 0 0 24px;">
      <a href="${data.resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0066cc; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Passwort zurücksetzen
      </a>
    </p>
    
    <p style="margin: 0 0 16px; font-size: 14px; color: #666666;">
      Dieser Link ist 24 Stunden gültig. Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
    </p>
    
    <p style="margin: 0 0 8px;">
      Mit freundlichen Grüssen
    </p>
    
    <p style="margin: 0; font-weight: 600;">
      ${data.companyName || 'Das Team'}
    </p>
  `;

  return emailWrapper(content);
}


