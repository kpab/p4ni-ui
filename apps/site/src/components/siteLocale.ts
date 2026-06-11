import { useEffect, useState } from "react";

export type SiteLocale = "en" | "ja";

export const SITE_LOCALE_EVENT = "p4ni:localechange";

export function getSiteLocale(): SiteLocale {
  if (typeof document === "undefined") {
    return "en";
  }

  return document.documentElement.dataset.locale === "ja" ? "ja" : "en";
}

export function useSiteLocale() {
  const [locale, setLocale] = useState<SiteLocale>(getSiteLocale);

  useEffect(() => {
    const syncLocale = () => setLocale(getSiteLocale());

    syncLocale();
    window.addEventListener(SITE_LOCALE_EVENT, syncLocale);
    return () => window.removeEventListener(SITE_LOCALE_EVENT, syncLocale);
  }, []);

  return locale;
}
