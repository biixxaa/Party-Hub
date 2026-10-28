/**
 * Prohibited Contact Information Validator
 * Section 7: WhatsApp numbers, WhatsApp links, Telegram usernames,
 * and Telegram links are strictly prohibited throughout the platform.
 * Legitimate official website and app links must NOT be blocked.
 */

export interface ValidationResult {
  isValid: boolean;
  prohibitedFound?: string;
  errorMessage?: string;
}

export function validateNoProhibitedContact(text: string | null | undefined): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: true };
  }

  const cleanText = text.toLowerCase();

  // 1. WhatsApp link patterns (wa.me, api.whatsapp.com, etc.)
  const waLinkPatterns = [
    /wa\.me\b/i,
    /api\.whatsapp\.com\b/i,
    /chat\.whatsapp\.com\b/i,
    /whatsapp\.com\b/i,
    /wa\.link\b/i,
    /api\.whatsapp\b/i,
  ];

  for (const pattern of waLinkPatterns) {
    if (pattern.test(cleanText)) {
      return {
        isValid: false,
        prohibitedFound: 'WhatsApp link',
        errorMessage: 'WhatsApp links are strictly prohibited on Party Hub.'
      };
    }
  }

  // 2. WhatsApp keyword & variations (e.g., "whatsapp", "whats app", "watsapp", "wapp")
  const waKeywordPatterns = [
    /\bwhats\s*app\b/i,
    /\bwats\s*app\b/i,
    /\bwhat\s*app\b/i,
    /\bwa\.app\b/i,
  ];

  for (const pattern of waKeywordPatterns) {
    if (pattern.test(cleanText)) {
      return {
        isValid: false,
        prohibitedFound: 'WhatsApp reference/number',
        errorMessage: 'WhatsApp contact information and numbers are strictly prohibited on Party Hub.'
      };
    }
  }

  // 3. Telegram link patterns (t.me, telegram.me, etc.)
  const tgLinkPatterns = [
    /t\.me\b/i,
    /telegram\.me\b/i,
    /telegram\.dog\b/i,
    /telegram\.org\b/i,
    /tg:\/\/join\b/i,
    /tg:\/\//i
  ];

  for (const pattern of tgLinkPatterns) {
    if (pattern.test(cleanText)) {
      return {
        isValid: false,
        prohibitedFound: 'Telegram link',
        errorMessage: 'Telegram links are strictly prohibited on Party Hub.'
      };
    }
  }

  // 4. Telegram keyword and username handle patterns
  const tgKeywordPatterns = [
    /\btele\s*gram\b/i,
    /\btg\s*[:@]\s*[a-z0-9_]+/i,
    /\btelegram\s*[:@]?\s*[a-z0-9_]+/i,
  ];

  for (const pattern of tgKeywordPatterns) {
    if (pattern.test(cleanText)) {
      return {
        isValid: false,
        prohibitedFound: 'Telegram reference/username',
        errorMessage: 'Telegram usernames and links are strictly prohibited on Party Hub.'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates multiple fields of an object for prohibited contact patterns.
 */
export function validateObjectFields(obj: Record<string, any>, fieldsToCheck: string[]): ValidationResult {
  for (const field of fieldsToCheck) {
    if (obj[field]) {
      const result = validateNoProhibitedContact(String(obj[field]));
      if (!result.isValid) {
        return {
          isValid: false,
          prohibitedFound: result.prohibitedFound,
          errorMessage: `Field '${field}' contains prohibited content: ${result.errorMessage}`
        };
      }
    }
  }
  return { isValid: true };
}
