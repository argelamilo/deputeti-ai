/**
 * Translation Service
 * 
 * Translates text between Albanian and English using Google Translate API
 * This ensures users can ask questions in Albanian and receive responses in Albanian
 * 
 * API RELIABILITY & OPTIONS:
 * 
 * Current Implementation: Google Translate Unofficial Free Endpoint
 * - ✅ No API key required
 * - ✅ Free to use
 * - ⚠️ No official rate limits, but may be throttled with heavy usage
 * - ⚠️ Could potentially be blocked by Google in the future (not officially supported)
 * - ⚠️ May have occasional reliability issues
 * 
 * Recommended for Production: Google Cloud Translation API (Official)
 * - ✅ Officially supported by Google
 * - ✅ Reliable and stable
 * - ✅ $20 per million characters (very affordable for most use cases)
 * - ✅ Free tier: 500,000 characters/month
 * - ✅ Better rate limits and SLA
 * 
 * Alternative: OpenAI GPT-4 for Translation
 * - ✅ High quality translations
 * - ⚠️ More expensive (~$30-60 per million tokens)
 * - ⚠️ Slower than dedicated translation APIs
 * - ✅ Already using OpenAI for chat, could use same API key
 * 
 * For now, the free endpoint works well for moderate usage. Monitor for:
 * - Rate limiting errors
 * - Blocked requests
 * - Inconsistent translation quality
 * 
 * If issues arise, switch to Google Cloud Translation API (recommended) or OpenAI.
 */

import { devError, devLog } from "@/lib/utils/logger";
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

/**
 * Normalize text by removing Albanian accents for comparison
 * This allows detection even when users type without special characters
 */
function normalizeAlbanian(text: string): string {
  return text
    .replace(/[çÇ]/g, 'c')
    .replace(/[ëË]/g, 'e')
    .toLowerCase();
}

/**
 * Detect if text is in Albanian
 * Enhanced detection that works even without special characters (ç, ë)
 * Uses strict criteria to avoid false positives with English text
 */
function isAlbanian(text: string): boolean {
  if (!text || !text.trim()) {
    return false;
  }

  const normalizedText = normalizeAlbanian(text);
  const lowerText = text.toLowerCase();

  // FIRST: Check for Albanian-specific characters (ç, ë) - strongest indicator
  const albanianChars = /[çëÇË]/;
  if (albanianChars.test(text)) {
    return true;
  }

  // SECOND: Check for English question patterns - if found, it's NOT Albanian
  const englishQuestionPatterns = [
    /^what\s+/i,
    /^who\s+/i,
    /^when\s+/i,
    /^where\s+/i,
    /^why\s+/i,
    /^how\s+/i,
    /^which\s+/i,
    /^is\s+/i,
    /^are\s+/i,
    /^can\s+/i,
    /^does\s+/i,
    /^do\s+/i,
    /^will\s+/i,
    /^would\s+/i,
    /^could\s+/i,
    /^should\s+/i,
    /^tell\s+me/i,
    /^explain\s+/i,
    /^describe\s+/i,
    /^define\s+/i,
  ];

  // If it starts with English question words, it's English
  for (const pattern of englishQuestionPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // THIRD: Check for strong Albanian question words at the start
  // These are the most reliable indicators
  const strongAlbanianQuestionWords = [
    /^(cfare|cfarë|çfarë|çfare,cfar)\s+/i,
    /^(eshte|është|eshtë|ështe)\s+/i,
    /^(ku|kur|pse|kush|cila|cilat|cilët)\s+/i,
    /^(si|sa)\s+/i,
  ];

  for (const pattern of strongAlbanianQuestionWords) {
    if (pattern.test(normalizedText) || pattern.test(text)) {
      return true;
    }
  }

  // FOURTH: Check for Albanian phrases (multiple words together)
  // These are more reliable than single words
  const albanianPhrases = [
    /\b(cfare\s+eshte|cfarë\s+është|çfarë\s+është|çfare\s+eshte)\b/i,
    /\b(ku\s+eshte|ku\s+është)\b/i,
    /\b(kur\s+eshte|kur\s+është)\b/i,
    /\b(si\s+quhet|si\s+quhen)\b/i,
    /\b(neni\s+\d+)\b/i,  // "neni 50" pattern
    /\b(nen\s+\d+)\b/i,   // "nen 50" pattern
  ];

  for (const pattern of albanianPhrases) {
    if (pattern.test(normalizedText) || pattern.test(text)) {
      return true;
    }
  }

  // FIFTH: Count Albanian-specific words (excluding ambiguous ones like "teu", "nen" alone)
  // Require multiple strong indicators to avoid false positives
  const strongAlbanianWords = [
    'cfare', 'cfarë', 'çfarë', 'çfare',
    'eshte', 'është', 'eshtë', 'ështe',
    'neni',  // "neni" is more specific than just "nen"
    'traktatit', 'traktat',
    'bashkimi', 'bashkim',
    'shteti', 'shtet',
    'anëtar', 'anetar',
    'ligjit', 'ligj',
    'evropian', 'evropiane',
  ];

  let strongIndicatorCount = 0;
  for (const word of strongAlbanianWords) {
    // Use word boundaries to avoid partial matches
    const wordPattern = new RegExp(`\\b${word}\\b`, 'i');
    if (wordPattern.test(normalizedText) || wordPattern.test(text)) {
      strongIndicatorCount++;
    }
  }

  // Require at least 2 strong Albanian indicators (not just one)
  // This prevents false positives from single words
  if (strongIndicatorCount >= 2) {
    return true;
  }

  // SIXTH: Check for Albanian verb forms (more specific)
  const albanianVerbs = [
    /\b(jam|je|jemi|jeni|jane|janë)\b/i,
    /\b(kam|ke|ka|kemi|keni|kane|kanë)\b/i,
    /\b(dua|dëshiroj|dëshiron|dëshironi)\b/i,
    /\b(mund|mundet|mundemi|mundeni)\b/i,
  ];

  let verbCount = 0;
  for (const pattern of albanianVerbs) {
    if (pattern.test(normalizedText) || pattern.test(text)) {
      verbCount++;
    }
  }

  // If we have Albanian verbs AND other Albanian words, it's Albanian
  if (verbCount >= 1 && strongIndicatorCount >= 1) {
    return true;
  }

  // Default: not Albanian (be conservative to avoid false positives)
  return false;
}

/**
 * Translate text using Google Translate API
 * @param text - Text to translate
 * @param fromLang - Source language code (e.g., 'sq' for Albanian, 'en' for English)
 * @param toLang - Target language code
 * @returns Translated text
 */
async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || !text.trim()) {
    return text;
  }

  try {
    // Use Google Translate free API endpoint
    const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      devError('[Translation] API request failed:', response.status, response.statusText);
      // Fallback: return original text if translation fails
      return text;
    }

    const data = await response.json();
    
    // Google Translate returns nested arrays, extract the translated text
    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      const translatedParts = data[0]
        .map((item: any[]) => item[0])
        .filter((part: string) => part)
        .join('');
      
      return translatedParts || text;
    }
    
    return text;
  } catch (error) {
    devError('[Translation] Error translating text:', error);
    // Fallback: return original text if translation fails
    return text;
  }
}

/**
 * Translate Albanian text to English
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!text || !text.trim()) {
    return text;
  }

  // If already in English (no Albanian indicators), return as-is
  if (!isAlbanian(text)) {
    return text;
  }

  devLog('[Translation] Translating Albanian to English:', text.substring(0, 50));
  const translated = await translateText(text, 'sq', 'en');
  devLog('[Translation] Translated result:', translated.substring(0, 50));
  return translated;
}

/**
 * Translate English text to Albanian
 * Removes unwanted conversational prefixes like "Yes" or "Po" that translators might add
 */
export async function translateToAlbanian(text: string): Promise<string> {
  if (!text || !text.trim()) {
    return text;
  }

  devLog('[Translation] Translating English to Albanian:', text.substring(0, 50));
  let translated = await translateText(text, 'en', 'sq');
  
  // ALWAYS remove unwanted conversational prefixes - backend never uses them
  // Remove "Po" (Yes in Albanian) at the start - always remove since backend doesn't use it
  translated = translated.replace(/^Po\s*,?\s*/i, '');
  translated = translated.replace(/^Po\s+/i, '');
  translated = translated.replace(/^Po,\s+/i, '');
  
  // Also remove "Yes" if somehow it got translated incorrectly
  translated = translated.replace(/^Yes\s*,?\s*/i, '');
  translated = translated.replace(/^Yes\s+/i, '');
  translated = translated.replace(/^Yes,\s+/i, '');
  
  devLog('[Translation] Translated result (cleaned):', translated.substring(0, 50));
  return translated;
}

/**
 * Translate conversation history messages
 * Translates user messages (Albanian -> English) and assistant messages (Albanian -> English)
 * This ensures the backend always receives English text for proper context
 */
export async function translateConversationHistory(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<Array<{ role: "user" | "assistant" | "system"; content: string }>> {
  const translatedMessages = await Promise.all(
    messages.map(async (msg) => {
      if (msg.role === 'user' && isAlbanian(msg.content)) {
        // Translate user messages from Albanian to English
        const translated = await translateToEnglish(msg.content);
        return { ...msg, content: translated };
      } else if (msg.role === 'assistant' && isAlbanian(msg.content)) {
        // Translate assistant messages from Albanian back to English
        // (These were previously translated to Albanian for display, but backend needs English)
        const translated = await translateToEnglish(msg.content);
        return { ...msg, content: translated };
      }
      // Keep system messages and already-English messages as-is
      return msg;
    })
  );

  return translatedMessages;
}

/**
 * Export isAlbanian function for use in other modules
 */
export function detectAlbanian(text: string): boolean {
  return isAlbanian(text);
}

