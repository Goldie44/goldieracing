import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProfile } from "@/lib/ProfileContext";
import { useBudget } from "@/lib/BudgetContext";
import { useRace } from "@/lib/RaceContext";
import { useAtr } from "@/lib/AtrContext";
import type { SaveSlotData } from "@/components/SaveSlot";

const SAVES_KEY = "goldie_saves";
const ONBOARDED_KEY = "goldie-racing:onboarded";

export default function WelcomeDialog() {
  const { t } = useTranslation("welcome");
  const [open, setOpen] = useState(() => !localStorage.getItem(ONBOARDED_KEY));
  const [teamName, setTeamName] = useState("");
  const [saveName, setSaveName] = useState("");

  const { setTeamName: setProfileTeamName } = useProfile();
  const { sections, totalBudget } = useBudget();
  const { done } = useRace();
  const { atrData } = useAtr();

  const canSubmit = teamName.trim().length > 0 && saveName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setProfileTeamName(teamName.trim());

    const newSlot: SaveSlotData = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      data: {
        teamName: teamName.trim(),
        budget: { sections: structuredClone(sections), totalBudget },
        race: { done: structuredClone(done) },
        atr: structuredClone(atrData),
      },
    };

    try {
      const existing: SaveSlotData[] = JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]");
      localStorage.setItem(SAVES_KEY, JSON.stringify([newSlot, ...existing]));
    } catch {}

    localStorage.setItem(ONBOARDED_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">{t("title")}</DialogTitle>
            <DialogDescription className="mt-1">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="welcome-save-name" className="text-sm font-medium text-foreground">
                {t("saveNameLabel")}
              </label>
              <input
                id="welcome-save-name"
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t("saveNamePlaceholder")}
                className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="welcome-team-name" className="text-sm font-medium text-foreground">
                {t("teamNameLabel")}
              </label>
              <input
                id="welcome-team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={t("teamNamePlaceholder")}
                className="px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <DialogFooter className="mt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("start")}
              </button>
            </DialogFooter>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
