import { useTranslation } from "react-i18next";
import { useProfile } from "@/lib/ProfileContext";

const SEASONS = ["2023", "2024", "2025"];

export default function SettingsProfile() {
  const { t } = useTranslation("settings");
  const { teamName, setTeamName, season, setSeason } = useProfile();

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          {t("profile.teamName")}
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
          placeholder={t("profile.teamNamePlaceholder")}
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
          {t("profile.activeSeason")}
        </label>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="bg-card border border-border rounded-lg text-sm text-foreground px-3 py-2 outline-none cursor-pointer"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
