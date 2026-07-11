import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

type Compound = "soft" | "medium" | "hard";

interface TireData {
  baseLapTime: number;   // temps au tour de base (s)
  degradation: number;   // perte par tour (s/tour)
  maxLaps: number;       // durée de vie max (tours)
}

interface RaceParams {
  totalLaps: number;
  pitDelta: number;      // temps perdu aux stands (s)
}

interface Strategy {
  compounds: Compound[];
  pitLaps: number[];     // tours où chaque arrêt a lieu
  stintLengths: number[];
  totalTime: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const COMPOUND_COLORS: Record<Compound, string> = {
  soft: "#ef4444",
  medium: "#eab308",
  hard: "#f8fafc",
};

const COMPOUND_LABELS: Record<Compound, string> = {
  soft: "S",
  medium: "M",
  hard: "H",
};

const COMPOUNDS: Compound[] = ["soft", "medium", "hard"];

const DEFAULT_TIRE_DATA: Record<Compound, TireData> = {
  soft:   { baseLapTime: 88.000, degradation: 0.150, maxLaps: 30 },
  medium: { baseLapTime: 88.500, degradation: 0.080, maxLaps: 45 },
  hard:   { baseLapTime: 89.000, degradation: 0.040, maxLaps: 60 },
};

const DEFAULT_PARAMS: RaceParams = { totalLaps: 57, pitDelta: 22 };

// ── Algorithme d'optimisation ─────────────────────────────────────────────────

/** Temps total d'un relais sur compound frais pendant `laps` tours */
function stintTime(td: TireData, laps: number): number {
  return laps * td.baseLapTime + td.degradation * (laps * (laps - 1)) / 2;
}

/** Trouve la stratégie optimale pour une séquence de compounds donnée */
function optimizeSequence(
  compounds: Compound[],
  tireData: Record<Compound, TireData>,
  params: RaceParams,
): Strategy | null {
  const { totalLaps, pitDelta } = params;
  const n = compounds.length;

  if (n === 1) {
    const td = tireData[compounds[0]];
    if (totalLaps > td.maxLaps) return null;
    return {
      compounds,
      pitLaps: [],
      stintLengths: [totalLaps],
      totalTime: stintTime(td, totalLaps),
    };
  }

  if (n === 2) {
    const td0 = tireData[compounds[0]];
    const td1 = tireData[compounds[1]];
    let best = Infinity;
    let bestL1 = -1;
    for (let l1 = 1; l1 < totalLaps; l1++) {
      const l2 = totalLaps - l1;
      if (l1 > td0.maxLaps || l2 > td1.maxLaps) continue;
      const t = stintTime(td0, l1) + stintTime(td1, l2) + pitDelta;
      if (t < best) { best = t; bestL1 = l1; }
    }
    if (bestL1 === -1) return null;
    return {
      compounds,
      pitLaps: [bestL1],
      stintLengths: [bestL1, totalLaps - bestL1],
      totalTime: best,
    };
  }

  if (n === 3) {
    const td0 = tireData[compounds[0]];
    const td1 = tireData[compounds[1]];
    const td2 = tireData[compounds[2]];
    let best = Infinity;
    let bL1 = -1, bL2 = -1;
    for (let l1 = 1; l1 < totalLaps - 1; l1++) {
      if (l1 > td0.maxLaps) continue;
      for (let l2 = 1; l2 < totalLaps - l1; l2++) {
        const l3 = totalLaps - l1 - l2;
        if (l2 > td1.maxLaps || l3 > td2.maxLaps || l3 < 1) continue;
        const t = stintTime(td0, l1) + stintTime(td1, l2) + stintTime(td2, l3) + 2 * pitDelta;
        if (t < best) { best = t; bL1 = l1; bL2 = l2; }
      }
    }
    if (bL1 === -1) return null;
    const l3 = totalLaps - bL1 - bL2;
    return {
      compounds,
      pitLaps: [bL1, bL1 + bL2],
      stintLengths: [bL1, bL2, l3],
      totalTime: best,
    };
  }

  return null;
}

/** Génère et trie toutes les stratégies viables (1 et 2 arrêts) */
function generateStrategies(
  tireData: Record<Compound, TireData>,
  params: RaceParams,
): Strategy[] {
  const results: Strategy[] = [];

  // 1 arrêt : 2 relais, composés différents
  for (const c0 of COMPOUNDS) {
    for (const c1 of COMPOUNDS) {
      if (c0 === c1) continue;
      const s = optimizeSequence([c0, c1], tireData, params);
      if (s) results.push(s);
    }
  }

  // 2 arrêts : 3 relais, au moins 2 composés différents
  for (const c0 of COMPOUNDS) {
    for (const c1 of COMPOUNDS) {
      for (const c2 of COMPOUNDS) {
        if (new Set([c0, c1, c2]).size < 2) continue;
        const s = optimizeSequence([c0, c1, c2], tireData, params);
        if (s) results.push(s);
      }
    }
  }

  results.sort((a, b) => a.totalTime - b.totalTime);
  return results.slice(0, 12);
}

// ── Utilitaires UI ────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}m ${sec.padStart(6, "0")}s`;
}

function CompoundPill({
  compound,
  label,
}: {
  compound: Compound;
  label?: string;
}) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full border"
      style={{
        color: COMPOUND_COLORS[compound],
        borderColor: COMPOUND_COLORS[compound] + "55",
        backgroundColor: COMPOUND_COLORS[compound] + "22",
      }}
    >
      {label ?? COMPOUND_LABELS[compound]}
    </span>
  );
}

/** Barre visuelle des relais proportionnelle aux tours */
function StintBar({ strategy, totalLaps, t }: { strategy: Strategy; totalLaps: number; t: (key: string, options?: any) => string }) {
  return (
    <div className="flex w-full h-3 rounded overflow-hidden gap-px">
      {strategy.stintLengths.map((len, i) => (
        <div
          key={i}
          style={{
            width: `${(len / totalLaps) * 100}%`,
            backgroundColor: COMPOUND_COLORS[strategy.compounds[i]] + "cc",
          }}
          title={t("stintTooltip", { compound: COMPOUND_LABELS[strategy.compounds[i]], laps: len })}
        />
      ))}
    </div>
  );
}

// ── Composant ─────────────────────────────────────────────────────────────────

function NumInput({
  value,
  onChange,
  step = 1,
  min = 0,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      value={value}
      onChange={(e) => {
        const v = step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      className={`bg-muted/20 border border-border/60 rounded px-2 py-1 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 ${className}`}
    />
  );
}

const ZERO_PARAMS: RaceParams = { totalLaps: 0, pitDelta: 0 };
const ZERO_TIRE_DATA: Record<Compound, TireData> = {
  soft:   { baseLapTime: 0, degradation: 0, maxLaps: 0 },
  medium: { baseLapTime: 0, degradation: 0, maxLaps: 0 },
  hard:   { baseLapTime: 0, degradation: 0, maxLaps: 0 },
};

export default function StrategyPage() {
  const { t } = useTranslation("strategy");
  const [params, setParams] = useState<RaceParams>(ZERO_PARAMS);
  const [tireData, setTireData] = useState<Record<Compound, TireData>>(ZERO_TIRE_DATA);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const setParam = <K extends keyof RaceParams>(k: K, v: RaceParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const setTire = (c: Compound, k: keyof TireData, v: number) =>
    setTireData((prev) => ({ ...prev, [c]: { ...prev[c], [k]: v } }));

  const strategies = useMemo(() => generateStrategies(tireData, params), [tireData, params]);
  const best = strategies[0] ?? null;

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="flex justify-end mt-6 mb-2">
        <Button
          variant="destructive"
          className="flex items-center gap-1.5"
          onClick={() => setResetDialogOpen(true)}
        >
          <ArrowPathIcon className="w-4 h-4" />
          {t("resetAll")}
        </Button>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("resetTitle")}</DialogTitle>
            <DialogDescription>
              {t("resetDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => { setParams(ZERO_PARAMS); setTireData(ZERO_TIRE_DATA); setResetDialogOpen(false); }}>
              {t("confirmReset")}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">{t("cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paramètres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Course */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t("raceParams")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">{t("lapCount")}</label>
              <NumInput
                value={params.totalLaps}
                onChange={(v) => setParam("totalLaps", Math.max(2, v))}
                min={2}
                className="w-20"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">{t("pitLoss")}</label>
              <NumInput
                value={params.pitDelta}
                onChange={(v) => setParam("pitDelta", v)}
                step={0.1}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Pneus */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t("tireData")}
          </h3>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left pb-2 font-medium"></th>
                <th className="text-right pb-2 font-medium">{t("baseTime")}</th>
                <th className="text-right pb-2 font-medium">{t("degradation")}</th>
                <th className="text-right pb-2 font-medium">{t("maxLaps")}</th>
              </tr>
            </thead>
            <tbody>
              {COMPOUNDS.map((c) => (
                <tr key={c} className="border-t border-border/30">
                  <td className="py-2 pr-3">
                    <CompoundPill compound={c} />
                  </td>
                  <td className="py-2 text-right">
                    <NumInput
                      value={tireData[c].baseLapTime}
                      onChange={(v) => setTire(c, "baseLapTime", v)}
                      step={0.001}
                      className="w-24"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <NumInput
                      value={tireData[c].degradation}
                      onChange={(v) => setTire(c, "degradation", v)}
                      step={0.001}
                      className="w-20"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <NumInput
                      value={tireData[c].maxLaps}
                      onChange={(v) => setTire(c, "maxLaps", Math.max(1, v))}
                      min={1}
                      className="w-16"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stratégie optimale */}
      {best && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            {t("optimalStrategy")}
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {best.compounds.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t("pitStop", { lap: best.pitLaps[i - 1] })}
                  </span>
                )}
                <CompoundPill compound={c} label={`${COMPOUND_LABELS[c]} (${best.stintLengths[i]}t)`} />
              </span>
            ))}
            <span className="ml-auto text-lg font-bold font-mono text-primary">
              {formatTime(best.totalTime)}
            </span>
          </div>
          <StintBar strategy={best} totalLaps={params.totalLaps} t={t} />
        </div>
      )}

      {/* Classement */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("ranking", { count: strategies.length })}
          </h3>
        </div>
        {strategies.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("noStrategy")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="px-4 py-2 text-left w-10">{t("rank")}</th>
                <th className="px-4 py-2 text-left">{t("strategyColumn")}</th>
                <th className="px-4 py-2 text-left w-40">{t("visualization")}</th>
                <th className="px-4 py-2 text-center w-20">{t("stops")}</th>
                <th className="px-4 py-2 text-right w-32">{t("totalTime")}</th>
                <th className="px-4 py-2 text-right w-24">{t("gap")}</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/40 transition-colors ${
                    i === 0 ? "bg-primary/5" : "hover:bg-muted/10"
                  }`}
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {i === 0 ? "★" : String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.compounds.map((c, ci) => (
                        <span key={ci} className="flex items-center gap-1.5">
                          {ci > 0 && (
                            <span className="text-xs text-muted-foreground/60">
                              →T{s.pitLaps[ci - 1]}
                            </span>
                          )}
                          <CompoundPill
                            compound={c}
                            label={`${COMPOUND_LABELS[c]} ${s.stintLengths[ci]}t`}
                          />
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StintBar strategy={s} totalLaps={params.totalLaps} t={t} />
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {s.pitLaps.length}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {formatTime(s.totalTime)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                    {i === 0 ? "—" : `+${(s.totalTime - best!.totalTime).toFixed(3)}s`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
