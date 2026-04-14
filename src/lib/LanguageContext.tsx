"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import { translations, type Language } from "./i18n";

type LanguageContextType = {
  lang: Language;
  t: typeof translations["en"];
  toggleLang: () => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "lang";

// In-memory fanout so components subscribed via useSyncExternalStore rerender
// when toggleLang mutates localStorage (the native `storage` event only fires
// for OTHER tabs, not the current one).
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = () => callback();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getClientLang(): Language {
  if (typeof window === "undefined") return "en";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "ar" ? "ar" : "en";
}

function getServerLang(): Language {
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getClientLang, getServerLang);

  // Document attributes are DOM side effects — setting them in an effect is
  // correct (not setState, so the react-hooks/set-state-in-effect rule is happy).
  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const toggleLang = useCallback(() => {
    const next: Language = lang === "en" ? "ar" : "en";
    window.localStorage.setItem(STORAGE_KEY, next);
    emit();
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    t: translations[lang],
    toggleLang,
    isRTL: lang === "ar",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
