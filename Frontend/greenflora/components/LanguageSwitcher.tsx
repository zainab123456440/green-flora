"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [isUrdu, setIsUrdu] = useState(false);

  useEffect(() => {
    // Check if Urdu translation cookie is active
    const hasUrduCookie = document.cookie.includes("googtrans=/en/ur");
    setIsUrdu(hasUrduCookie);

    if (hasUrduCookie) {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ur";
      document.documentElement.classList.add("urdu-mode");
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
      document.documentElement.classList.remove("urdu-mode");
    }
  }, []);

  const toggleLanguage = () => {
    const domain = window.location.hostname;

    if (isUrdu) {
      // Clear cookie to revert to English
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;
    } else {
      // Set cookie to force Urdu translation
      document.cookie = "googtrans=/en/ur; path=/;";
      document.cookie = `googtrans=/en/ur; domain=${domain}; path=/;`;
    }

    // Reload page to allow Google Translate to process dynamic DOM nodes
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50 active:scale-95"
      aria-label="Toggle Language"
    >
      <span>{isUrdu ? "English" : "اردو"}</span>
    </button>
  );
}