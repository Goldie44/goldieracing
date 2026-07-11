import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", labelKey: "language.fr" },
  { code: "en", flag: "🇬🇧", labelKey: "language.en" },
] as const;

export default function SettingsLanguage() {
  const { t, i18n } = useTranslation("settings");

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("language.title")}
        </p>
        <div className="flex gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${
                i18n.resolvedLanguage === lang.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {lang.flag} {t(lang.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
