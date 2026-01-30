/**
 * Shared Utilities for Netlify Functions
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Standard CORS headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * JSON response helper
 */
export function jsonResponse(data: unknown, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(data),
  };
}

/**
 * Error response helper
 */
export function errorResponse(message: string, statusCode = 400) {
  return jsonResponse({ error: message }, statusCode);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Parse request body (handles JSON and form data)
 */
export function parseBody<T>(body: string | null, contentType: string): T {
  if (!body) {
    return {} as T;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(body);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result as T;
  }

  throw new Error('Unsupported content type');
}


