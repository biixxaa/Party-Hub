/**
 * Client-Side Prohibited Contact Validator (Section 7)
 * Immediate visual feedback preventing WhatsApp / Telegram info leaks.
 */

export interface ClientValidation {
  isBlocked: boolean;
  reason?: string;
}

export function checkProhibitedContact(text: string): ClientValidation {
  if (!text) return { isBlocked: false };

  const lower = text.toLowerCase();

  // WhatsApp patterns
  const waRegexes = [
    /wa\.me/i,
    /api\.whatsapp\.com/i,
    /chat\.whatsapp\.com/i,
    /whatsapp\.com/i,
    /wa\.link/i,
    /\bwhats\s*app\b/i,
    /\bwats\s*app\b/i,
    /\bwhat\s*app\b/i,
  ];

  for (const r of waRegexes) {
    if (r.test(lower)) {
      return {
        isBlocked: true,
        reason: 'WhatsApp numbers and links are prohibited on Party Hub.'
      };
    }
  }

  // Telegram patterns
  const tgRegexes = [
    /t\.me/i,
    /telegram\.me/i,
    /telegram\.dog/i,
    /telegram\.org/i,
    /tg:\/\//i,
    /\btele\s*gram\b/i,
    /\btg\s*[:@]\s*[a-z0-9_]+/i,
    /\btelegram\s*[:@]?\s*[a-z0-9_]+/i,
  ];

  for (const r of tgRegexes) {
    if (r.test(lower)) {
      return {
        isBlocked: true,
        reason: 'Telegram usernames and links are prohibited on Party Hub.'
      };
    }
  }

  return { isBlocked: false };
}
