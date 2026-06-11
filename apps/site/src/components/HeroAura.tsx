import { AuraInput } from "@p4ni/ui/aura";
import { useSiteLocale } from "./siteLocale";

export default function HeroAura() {
  const locale = useSiteLocale();

  return (
    <AuraInput
      placeholder={locale === "ja" ? "入力してみて..." : "Try typing..."}
      aria-label={locale === "ja" ? "AuraInput ライブデモ" : "AuraInput live demo"}
      bleed={32}
    />
  );
}
