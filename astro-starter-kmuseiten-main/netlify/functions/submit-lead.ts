import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Resend } from 'resend';

/**
 * Submit Lead - Netlify Function
 * ═══════════════════════════════════════════════════════════════
 * Handles contact form submissions.
 * - Validates input
 * - Sends notification email to admin
 * - Sends confirmation email to user
 * - Optionally stores in Supabase (if enabled)
 */

// Environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Unser Team';

// Supabase (optional - only if fullstack tier)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface LeadData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}

// Email templates
function adminNotificationHtml(data: LeadData): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                📬 Neue Kontaktanfrage
              </h1>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
                    <strong style="color: #666666;">Name:</strong><br>
                    ${escapeHtml(data.name)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
                    <strong style="color: #666666;">E-Mail:</strong><br>
                    <a href="mailto:${escapeHtml(data.email)}" style="color: #0066cc;">${escapeHtml(data.email)}</a>
                  </td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
                    <strong style="color: #666666;">Telefon:</strong><br>
                    <a href="tel:${escapeHtml(data.phone)}" style="color: #0066cc;">${escapeHtml(data.phone)}</a>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0;">
                    <strong style="color: #666666;">Nachricht:</strong><br>
                    <div style="margin-top: 8px; padding: 16px; background-color: #fafafa; border-radius: 4px; white-space: pre-wrap;">${escapeHtml(data.message)}</div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #999999;">
                Quelle: ${escapeHtml(data.source || 'Website-Kontaktformular')}<br>
                Zeit: ${new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function userConfirmationHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                Vielen Dank für Ihre Anfrage
              </h1>
              
              <p style="margin: 0 0 16px;">
                Guten Tag ${escapeHtml(name)},
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
                ${escapeHtml(COMPANY_NAME)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #eaeaea; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
                Diese E-Mail wurde automatisch versendet. Bitte antworten Sie nicht direkt auf diese Nachricht.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Parse body
  let data: LeadData;
  try {
    const contentType = event.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      data = JSON.parse(event.body || '{}');
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(event.body || '');
      data = {
        name: params.get('name') || '',
        email: params.get('email') || '',
        phone: params.get('phone') || undefined,
        message: params.get('message') || '',
        source: params.get('source') || 'website',
      };
    } else {
      throw new Error('Unsupported content type');
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  // Validate required fields
  if (!data.name || !data.email || !data.message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Name, email, and message are required' }),
    };
  }

  if (!validateEmail(data.email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid email address' }),
    };
  }

  // Check for Resend API key
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service not configured' }),
    };
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    // Send notification to admin
    if (ADMIN_EMAIL) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `Neue Kontaktanfrage von ${data.name}`,
        html: adminNotificationHtml(data),
      });
    }

    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'Vielen Dank für Ihre Anfrage',
      html: userConfirmationHtml(data.name),
    });

    // Store in Supabase if configured (fullstack tier)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        await supabase.from('contact_submissions').insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          source: data.source || 'website',
        });
      } catch (dbError) {
        // Log but don't fail - email was sent successfully
        console.error('Failed to store in database:', dbError);
      }
    }

    // Redirect for form submissions, JSON for API calls
    const accept = event.headers['accept'] || '';
    if (accept.includes('text/html')) {
      return {
        statusCode: 302,
        headers: {
          Location: '/?success=true',
        },
        body: '',
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Thank you for your message!' }),
    };

  } catch (error) {
    console.error('Error processing lead:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process your request' }),
    };
  }
};

export { handler };


