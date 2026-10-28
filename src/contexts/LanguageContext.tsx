"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  applyLanguage,
  readStoredLanguage,
  translate,
  type Language,
  type TranslationKey,
} from "@/lib/i18n";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The app only renders its children after mount (see RootProviders), so reading
  // localStorage here cannot cause a hydration mismatch.
  const [lang, setLangState] = useState<Language>(() => readStoredLanguage());

  const setLang = useCallback((next: Language) => {
    applyLanguage(next);
    setLangState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(key, vars, lang),
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
