import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAtr } from "../lib/AtrContext";
import PageHeader from "../components/PageHeader";
import { developmentUpdates } from "../lib/f1Data";
import { initialSections } from "../lib/AtrContext";

const PROJECTS_STORAGE_KEY = "goldie-racing:dev-projects";

const loadProjects = () => {
  try {
    const stored = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return developmentUpdates;
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import { Input } from "../components/ui/input";
import { mergeAtrVisionEntries, type AtrVisionEntry } from "../lib/atrVisionImport";

const radarData = [
  { subject: "Vitesse Max", value: 78 },
  { subject: "Accélération", value: 72 },
  { subject: "DRS", value: 67 },
  { subject: "Virage Faible V.", value: 76 },
  { subject: "Virage Moy. V.", value: 70 },
  { subject: "Virage Gde V.", value: 65 },
  { subject: "Débit d'air", value: 68 },
  { subject: "Refroidissement", value: 74 },
];

const degradationData = [
  { lap: 0, soft: 0, medium: 0, hard: 0 },
  { lap: 10, soft: 0.9, medium: 0.6, hard: 0.4 },
  { lap: 20, soft: 1.8, medium: 1.2, hard: 0.8 },
  { lap: 30, soft: 2.7, medium: 1.8, hard: 1.2 },
  { lap: 40, soft: 3.6, medium: 2.4, hard: 1.6 },
  { lap: 50, soft: 4.5, medium: 3.0, hard: 2.0 },
  { lap: 60, soft: 5.4, medium: 3.6, hard: 2.4 },
];

const PARTS_LIST = [
  "Châssis",
  "Aileron avant",
  "Aileron arrière",
  "Flancs",
  "Fond plat",
  "Suspension",
];

export default function PerformancePage() {
  const { t } = useTranslation("performance");
  const { atrData, setAtrData } = useAtr();
  const [projects, setProjects] = useState(loadProjects);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    atr: "",
    part: "",
    vitesseMax: "",
    acceleration: "",
    drs: "",
    faibleVitesse: "",
    vitesseMoyenne: "",
    grandeVitesse: "",
    dirtyAir: "",
    preservation: "",
    refroidissement: "",
    poids: "",
  });

  const addProjectGains = (project) => {
    const gainUpdates = [
      { si: 0, ri: 0, val: project.vitesseMax },
      { si: 0, ri: 1, val: project.acceleration },
      { si: 0, ri: 2, val: project.drs },
      { si: 1, ri: 0, val: project.faibleVitesse },
      { si: 1, ri: 1, val: project.vitesseMoyenne },
      { si: 1, ri: 2, val: project.grandeVitesse },
      { si: 1, ri: 3, val: project.dirtyAir },
      { si: 2, ri: 0, val: project.preservation },
      { si: 2, ri: 1, val: project.refroidissement },
      { si: 2, ri: 2, val: project.poids },
    ];

    setAtrData(prev => prev.map((section, si) => ({
      ...section,
      rows: section.rows.map((row, ri) => {
        const update = gainUpdates.find(u => u.si === si && u.ri === ri);
        if (!update || !update.val) return row;
        const current = parseFloat(row.gainsAttendus) || 0;
        const delta = parseFloat(update.val) || 0;
        return { ...row, gainsAttendus: (current + delta).toString() };
      }),
    })));
  };

  const subtractProjectGains = (project) => {
    const gainUpdates = [
      { si: 0, ri: 0, val: project.vitesseMax },
      { si: 0, ri: 1, val: project.acceleration },
      { si: 0, ri: 2, val: project.drs },
      { si: 1, ri: 0, val: project.faibleVitesse },
      { si: 1, ri: 1, val: project.vitesseMoyenne },
      { si: 1, ri: 2, val: project.grandeVitesse },
      { si: 1, ri: 3, val: project.dirtyAir },
      { si: 2, ri: 0, val: project.preservation },
      { si: 2, ri: 1, val: project.refroidissement },
      { si: 2, ri: 2, val: project.poids },
    ];

    setAtrData(prev => prev.map((section, si) => ({
      ...section,
      rows: section.rows.map((row, ri) => {
        const update = gainUpdates.find(u => u.si === si && u.ri === ri);
        if (!update || !update.val) return row;
        const current = parseFloat(row.gainsAttendus) || 0;
        const delta = parseFloat(update.val) || 0;
        return { ...row, gainsAttendus: (current - delta).toString() };
      }),
    })));
  };

  const resetAll = () => {
    setProjects([]);
    setAtrData(initialSections.map(s => ({
      ...s,
      rows: s.rows.map(r => ({ ...r, v1: "", moyenne: "", delta: "", cd: "", deltaCD: "", gainsAttendus: "" })),
    })));
    setResetDialogOpen(false);
  };

  const removeProject = (projectIndex) => {
    const project = projects[projectIndex];
    subtractProjectGains(project);
    setProjects(prev => prev.filter((_, index) => index !== projectIndex));
  };

  // Map ATR rows to radar subjects in order
  const radarMapped = [
    { subject: "Vitesse Max",      value: parseFloat(atrData[0]?.rows[0]?.v1) || 0, competitor: parseFloat(atrData[0]?.rows[0]?.moyenne) || 0 },
    { subject: "Accélération",     value: parseFloat(atrData[0]?.rows[1]?.v1) || 0, competitor: parseFloat(atrData[0]?.rows[1]?.moyenne) || 0 },
    { subject: "DRS",              value: parseFloat(atrData[0]?.rows[2]?.v1) || 0, competitor: parseFloat(atrData[0]?.rows[2]?.moyenne) || 0 },
    { subject: "Virage Faible V.", value: parseFloat(atrData[1]?.rows[0]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[0]?.moyenne) || 0 },
    { subject: "Virage Moy. V.",   value: parseFloat(atrData[1]?.rows[1]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[1]?.moyenne) || 0 },
    { subject: "Virage Gde V.",    value: parseFloat(atrData[1]?.rows[2]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[2]?.moyenne) || 0 },
    { subject: "Dirty Air",        value: parseFloat(atrData[1]?.rows[3]?.v1) || 0, competitor: parseFloat(atrData[1]?.rows[3]?.moyenne) || 0 },
    { subject: "Refroidissement",  value: parseFloat(atrData[2]?.rows[1]?.v1) || 0, competitor: parseFloat(atrData[2]?.rows[1]?.moyenne) || 0 },
  ];

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Nouveau Projet */}
      <div className="my-6 flex items-center gap-3">
        <Button variant="primary" onClick={() => setShowNewProject(true)}>
          {t("newProject")}
        </Button>
        <Button
          variant="destructive"
          className="ml-auto flex items-center gap-1.5 text-xs h-7 px-3"
          onClick={() => setResetDialogOpen(true)}
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
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
            <Button variant="destructive" onClick={resetAll}>{t("confirmReset")}</Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">{t("cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showNewProject}
        onOpenChange={(open) => {
          setShowNewProject(open);
          if (!open) {
            setNewProject({ atr: "", part: "", vitesseMax: "", acceleration: "", drs: "", faibleVitesse: "", vitesseMoyenne: "", grandeVitesse: "", dirtyAir: "", preservation: "", refroidissement: "", poids: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newProject")}</DialogTitle>
            <DialogDescription>{t("newProjectDescription")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newProject.atr) return;
              const projectData = { atr: newProject.atr, part: newProject.part, vitesseMax: newProject.vitesseMax, acceleration: newProject.acceleration, drs: newProject.drs, faibleVitesse: newProject.faibleVitesse, vitesseMoyenne: newProject.vitesseMoyenne, grandeVitesse: newProject.grandeVitesse, dirtyAir: newProject.dirtyAir, preservation: newProject.preservation, refroidissement: newProject.refroidissement, poids: newProject.poids };
              setProjects(prev => [...prev, projectData]);
              addProjectGains(projectData);
              setNewProject({ atr: "", part: "", vitesseMax: "", acceleration: "", drs: "", faibleVitesse: "", vitesseMoyenne: "", grandeVitesse: "", dirtyAir: "", preservation: "", refroidissement: "", poids: "" });
              setShowNewProject(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block mb-1 text-sm font-medium">ATR</label>
              <Input value={newProject.atr} onChange={e => setNewProject(p => ({...p, atr: e.target.value}))} placeholder="ex: ATR-08" required />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">{t("pieceLabel")}</label>
              <Select value={newProject.part} onValueChange={(value) => setNewProject(p => ({...p, part: value}))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectPiece")} />
                </SelectTrigger>
                <SelectContent>
                  {PARTS_LIST.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t border-border pt-3">
              <label className="block mb-2 text-sm font-medium">Gains Attendus</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm font-medium">Vitesse max</label>
                  <Input type="number" value={newProject.vitesseMax} onChange={e => setNewProject(p => ({...p, vitesseMax: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Accélération</label>
                  <Input type="number" value={newProject.acceleration} onChange={e => setNewProject(p => ({...p, acceleration: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Efficacité du DRS</label>
                  <Input type="number" value={newProject.drs} onChange={e => setNewProject(p => ({...p, drs: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Faible vitesse</label>
                  <Input type="number" value={newProject.faibleVitesse} onChange={e => setNewProject(p => ({...p, faibleVitesse: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Vitesse moyenne</label>
                  <Input type="number" value={newProject.vitesseMoyenne} onChange={e => setNewProject(p => ({...p, vitesseMoyenne: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Grande vitesse</label>
                  <Input type="number" value={newProject.grandeVitesse} onChange={e => setNewProject(p => ({...p, grandeVitesse: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Tolérance Dirty air</label>
                  <Input type="number" value={newProject.dirtyAir} onChange={e => setNewProject(p => ({...p, dirtyAir: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Préservation des pneus</label>
                  <Input type="number" value={newProject.preservation} onChange={e => setNewProject(p => ({...p, preservation: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Refroidissement du moteur</label>
                  <Input type="number" value={newProject.refroidissement} onChange={e => setNewProject(p => ({...p, refroidissement: e.target.value}))} placeholder="0" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Poids excédentaire totale</label>
                  <Input type="number" value={newProject.poids} onChange={e => setNewProject(p => ({...p, poids: e.target.value}))} placeholder="0" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t("add")}</Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">{t("cancel")}</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Development Projects */}
      <div data-tour-id="performance-dev-plan" className="mt-8">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {t("developmentPlan")}
        </h2>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16">
            <span className="text-muted-foreground text-lg">{t("noProjects")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((update, i) => {
              const gainsAttendus = (
                (parseFloat(update.vitesseMax) || 0) +
                (parseFloat(update.acceleration) || 0) +
                (parseFloat(update.drs) || 0) +
                (parseFloat(update.faibleVitesse) || 0) +
                (parseFloat(update.vitesseMoyenne) || 0) +
                (parseFloat(update.grandeVitesse) || 0) +
                (parseFloat(update.dirtyAir) || 0) +
                (parseFloat(update.preservation) || 0) +
                (parseFloat(update.refroidissement) || 0) +
                (parseFloat(update.poids) || 0)
              ).toFixed(2);
              return (
                <motion.div
                  key={`${update.atr}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ layout: { duration: 0.2 }, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl px-5 py-3 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{update.atr}</h3>
                      <span className="text-xs text-muted-foreground">{update.race}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProject(i)}
                      aria-label={t("deleteProject", { atr: update.atr })}
                      title={t("deleteProject", { atr: update.atr })}
                      className="shrink-0 ml-2 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(Array.isArray(update.parts) ? update.parts : [update.part]).map(part => (
                      <span key={part} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {part}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border relative group">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("expectedGains")}</span>
                      <span className="font-mono font-bold text-green-400">{gainsAttendus}</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg bg-card border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">{t("gainsDetail")}</div>
                      <div className="space-y-1 text-xs">
                        {update.vitesseMax && <div className="flex justify-between"><span>Vitesse max:</span><span className="text-green-400">{update.vitesseMax}</span></div>}
                        {update.acceleration && <div className="flex justify-between"><span>Accélération:</span><span className="text-green-400">{update.acceleration}</span></div>}
                        {update.drs && <div className="flex justify-between"><span>Efficacité DRS:</span><span className="text-green-400">{update.drs}</span></div>}
                        {update.faibleVitesse && <div className="flex justify-between"><span>Faible vitesse:</span><span className="text-green-400">{update.faibleVitesse}</span></div>}
                        {update.vitesseMoyenne && <div className="flex justify-between"><span>Vitesse moyenne:</span><span className="text-green-400">{update.vitesseMoyenne}</span></div>}
                        {update.grandeVitesse && <div className="flex justify-between"><span>Grande vitesse:</span><span className="text-green-400">{update.grandeVitesse}</span></div>}
                        {update.dirtyAir && <div className="flex justify-between"><span>Dirty air:</span><span className="text-green-400">{update.dirtyAir}</span></div>}
                        {update.preservation && <div className="flex justify-between"><span>Préservation pneus:</span><span className="text-green-400">{update.preservation}</span></div>}
                        {update.refroidissement && <div className="flex justify-between"><span>Refroidissement:</span><span className="text-green-400">{update.refroidissement}</span></div>}
                        {update.poids && <div className="flex justify-between"><span>Poids excédentaire:</span><span className="text-green-400">{update.poids}</span></div>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div data-tour-id="performance-atr-table" className="mt-8">
        <AtrCalTable data={atrData} setData={setAtrData} title={t("calibrationTitle")} />
      </div>
    </div>
  );
}

function AtrCalTable({ data, setData, title }: { data: any; setData: any; title?: string }) {
  const { t } = useTranslation("performance");
  const reset = () => setData(initialSections.map(s => ({
    ...s,
    rows: s.rows.map(r => ({ ...r, v1: "", moyenne: "", delta: "", cd: "", deltaCD: "", gainsAttendus: "" })),
  })));

  const update = (si, ri, field, val) => {
    setData(prev => prev.map((s, i) => i !== si ? s : {
      ...s,
      rows: s.rows.map((r, j) => j !== ri ? r : { ...r, [field]: val }),
    }));
  };

  const [importOpen, setImportOpen] = useState(false);
  const [pastedImage, setPastedImage] = useState<{ base64: string; mediaType: string } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewEntries, setPreviewEntries] = useState<AtrVisionEntry[] | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.app?.atrVisionApiKey
      ?.load()
      .then((key) => {
        if (!cancelled) setHasApiKey(!!key);
      })
      .catch(() => {
        if (!cancelled) setHasApiKey(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetImportState = () => {
    setPastedImage(null);
    setImportLoading(false);
    setImportError(null);
    setPreviewEntries(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      setPastedImage({ base64, mediaType: item.type });
      setImportError(null);
      setPreviewEntries(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!pastedImage || !window.app?.atrVision) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const entries = await window.app.atrVision.extract(pastedImage.base64, pastedImage.mediaType);
      // Reconcile the model's response against the full ATR row structure so
      // every row appears in the preview, even ones the model omitted entirely.
      const fullEntries: AtrVisionEntry[] = data.flatMap((section) =>
        section.rows.map((row) => {
          const match = entries.find(
            (entry) => entry.section === section.label && entry.label === row.label,
          );
          return {
            section: section.label,
            label: row.label,
            v1: match?.v1 ?? "",
            moyenne: match?.moyenne ?? "",
          };
        }),
      );
      setPreviewEntries(fullEntries);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportLoading(false);
    }
  };

  const updatePreviewEntry = (section: string, label: string, field: "v1" | "moyenne", value: string) => {
    setPreviewEntries((prev) =>
      prev
        ? prev.map((entry) =>
            entry.section === section && entry.label === label ? { ...entry, [field]: value } : entry,
          )
        : prev,
    );
  };

  const handleApplyImport = () => {
    if (!previewEntries) return;
    setData((prev) => mergeAtrVisionEntries(prev, previewEntries));
    setImportOpen(false);
    resetImportState();
  };

  const cellCls = "w-full text-center text-xs font-mono bg-transparent border border-transparent focus:border-primary rounded px-1 py-1 outline-none transition-colors text-foreground";

  const calcDelta = (v1, gainsAttendus, moyenne) => {
    const a = parseFloat(v1) || 0, b = parseFloat(gainsAttendus) || 0, c = parseFloat(moyenne);
    if (isNaN(c)) return "";
    return (a + b - c).toFixed(3);
  };

  // Compute all deltas and find the 3 smallest values
  const allDeltas = data.flatMap(s => s.rows.map(r => {
    const d = calcDelta(r.v1, r.gainsAttendus, r.moyenne);
    return d !== "" ? parseFloat(d) : null;
  })).filter(v => v !== null);
  allDeltas.sort((a, b) => a - b);
  const threshold3 = allDeltas.length >= 3 ? allDeltas[2] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-border rounded-xl p-6 mb-8 overflow-x-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center">
          <button
            data-tour-id="performance-import-screenshot"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mr-4"
          >
            {t("importFromScreenshot")}
          </button>
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">
            <ArrowPathIcon className="w-3 h-3" />
            {t("resetToZero")}
          </button>
        </div>
      </div>
      {/* Top 3 smallest deltas */}
      {threshold3 !== null && (() => {
        const worst = [];
        data.forEach(s => s.rows.forEach(r => {
          const d = calcDelta(r.v1, r.gainsAttendus, r.moyenne);
          if (d !== "") worst.push({ label: r.label, delta: parseFloat(d) });
        }));
        worst.sort((a, b) => a.delta - b.delta);
        const top3 = worst.slice(0, 3);
        return (
          <div className="mb-4 border border-red-500/20 rounded-lg bg-red-500/10 p-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("topDeficits")}</h4>
            <div className="flex flex-col gap-1.5">
              {top3.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded bg-red-500/10">
                  <span className="text-xs text-foreground font-medium">{item.label}</span>
                  <span className="text-xs font-mono text-red-400 font-bold">{item.delta.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      <table className="w-full text-xs min-w-[640px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left py-2 px-2 font-medium w-48"></th>
            <th className="py-2 px-2 font-medium">{t("tableMonoplace")}</th>
            <th className="py-2 px-2 font-medium text-green-400">{t("tableGains")}</th>
            <th className="py-2 px-2 font-medium">{t("tableCompetitor")}</th>
            <th className="py-2 px-2 font-medium text-yellow-400">{t("tableDeficit")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((section, si) => (
            <>
              <tr key={section.label + "-header"}>
                <td colSpan={6} className="py-2 px-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{section.label}</span>
                </td>
              </tr>
              {section.rows.map((row, ri) => (
                <tr key={row.label} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-1.5 px-2 text-muted-foreground">{row.label}</td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      value={row.v1}
                      onChange={e => update(si, ri, "v1", e.target.value)}
                      className={cellCls}
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      value={row.gainsAttendus}
                      onChange={e => update(si, ri, "gainsAttendus", e.target.value)}
                      className={cellCls}
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      value={row.moyenne}
                      onChange={e => update(si, ri, "moyenne", e.target.value)}
                      className={cellCls}
                      placeholder="0"
                    />
                  </td>
                  <td className="py-1 px-2">
                    {(() => {
                      const delta = calcDelta(row.v1, row.gainsAttendus, row.moyenne);
                      if (delta === "") return null;
                      const val = parseFloat(delta);
                      const isWeightRow = row.label === "Poids excédentaire totale (Kg)";
                      const isNeg = isWeightRow ? val > 0 : val < 0;
                      const color = isNeg ? "bg-red-500" : "bg-green-500";
                      const maxWidth = 80;
                      const width = Math.min(Math.abs(val) * 10, maxWidth);
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono w-14 text-right ${isNeg ? "text-red-400" : "text-green-400"}`}>{delta}</span>
                          <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${color} opacity-80`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) resetImportState();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
          </DialogHeader>

          {!previewEntries && (
            <>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground focus:border-primary outline-none"
              >
                {pastedImage ? (
                  <img
                    src={`data:${pastedImage.mediaType};base64,${pastedImage.base64}`}
                    alt=""
                    className="max-h-48 mx-auto rounded"
                  />
                ) : (
                  t("importPasteHint")
                )}
              </div>
              {importError && <p className="text-xs text-red-400">{importError}</p>}
              {!hasApiKey && <p className="text-xs text-yellow-400">{t("importNoApiKey")}</p>}
              <DialogFooter>
                <Button
                  variant="primary"
                  disabled={!pastedImage || importLoading || !hasApiKey}
                  onClick={handleAnalyze}
                >
                  {importLoading ? t("importAnalyzing") : t("importAnalyze")}
                </Button>
              </DialogFooter>
            </>
          )}

          {previewEntries && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("importPreviewTitle")}
              </p>
              {data.every((section) => section.rows.length === 0) ? (
                <p className="text-sm text-muted-foreground">{t("importNoEntries")}</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {data.map((section) => (
                    <div key={section.label}>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-2 mb-1">
                        {section.label}
                      </p>
                      {section.rows.map((row) => {
                        const entry = previewEntries.find(
                          (e) => e.section === section.label && e.label === row.label,
                        );
                        return (
                          <div key={row.label} className="grid grid-cols-3 gap-2 items-center text-xs mb-1">
                            <span className="text-muted-foreground truncate">{row.label}</span>
                            <Input
                              type="number"
                              value={entry?.v1 ?? ""}
                              onChange={(e) => updatePreviewEntry(section.label, row.label, "v1", e.target.value)}
                            />
                            <Input
                              type="number"
                              value={entry?.moyenne ?? ""}
                              onChange={(e) => updatePreviewEntry(section.label, row.label, "moyenne", e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button variant="secondary" onClick={resetImportState}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  disabled={previewEntries.length === 0}
                  onClick={handleApplyImport}
                >
                  {t("importApply")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
