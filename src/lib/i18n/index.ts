import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  TRANSLATIONS,
  isLanguage,
  type Language,
  type TranslationKey,
} from "./translations";

export type { Language, TranslationKey } from "./translations";

let currentLanguage: Language = DEFAULT_LANGUAGE;

export function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function getLanguage(): Language {
  if (typeof window !== "undefined") currentLanguage = readStoredLanguage();
  return currentLanguage;
}

export function applyLanguage(lang: Language): void {
  currentLanguage = lang;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Storage can be unavailable (private mode); the in-memory value still applies.
  }
  document.documentElement.lang = lang;
}

export function translate(
  key: TranslationKey,
  vars?: Record<string, string | number>,
  lang: Language = getLanguage()
): string {
  let text: string = TRANSLATIONS[lang][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}
