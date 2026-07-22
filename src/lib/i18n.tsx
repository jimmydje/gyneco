"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

// Get initial language from localStorage or default to fr
function getInitialLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem("gyneco-lang");
  if (stored === "en" || stored === "fr") return stored;
  // Default to French since the conference is in Algeria
  return "fr";
}

type I18nContextType = {
  lang: Lang;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  tp: (key: TranslationKey, params?: Record<string, string>) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    setLangState(getInitialLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("gyneco-lang", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>): string => {
      let text = translations[lang]?.[key] ?? translations.fr[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
    [lang]
  );

  const tp = useCallback(
    (key: TranslationKey, params?: Record<string, string>): string => {
      let text = (translations[lang] as Record<string, string>)?.[key];
      if (!text && lang !== "fr") {
        text = (translations.fr as Record<string, string>)?.[key];
      }
      if (!text) text = key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, tp, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
