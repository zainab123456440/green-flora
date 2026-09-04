"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translations } from "@/lib/translations";

export type Language = "en" | "ur";
type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("green-flora-language");
    if (savedLanguage === "en" || savedLanguage === "ur") {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("urdu-mode", language === "ur");
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("green-flora-language", newLanguage);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ur" : "en");
  };

  const t = (key: TranslationKey) => {
    return translations[language][key];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}