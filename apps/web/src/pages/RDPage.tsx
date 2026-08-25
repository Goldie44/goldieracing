import { motion } from "framer-motion";
import { TrashIcon, ArrowPathIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import PageHeader from "../components/PageHeader";
import { formatMoneyInMillions } from "../lib/utils";
import { useBudget } from "../lib/BudgetContext";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";

type Project = {
  id: number;
  name: string;
  category: string;
  status: "En cours" | "Terminé" | "Planifié";
  progress: number;
  deadline: string;
  budget: number;
  lead: string;
  spent: number;
  cost?: number;
  specs?: Record<string, string>;
};

const RD_STORAGE_KEY = "goldie-racing:rd-projects";
const AERO_TABLE_KEY = "goldie-racing:aero-table";

const defaultProjects: Project[] = [
  {
    id: 1,
    name: "Fond plat aérodynamique Spec 2",
    category: "Aérodynamique",
    status: "En cours",
    progress: 65,
    deadline: "GP Monaco",
    budget: 2400000,
    lead: "Ingénieur Aéro",
    spent: 1500000,
  },
  {
    id: 2,
    name: "Suspension avant rigidité variable",
    category: "Châssis",
    status: "Terminé",
    progress: 100,
    deadline: "GP Bahreïn",
    budget: 1800000,
    lead: "Ingénieur Châssis",
    spent: 1800000,
  },
  {
    id: 3,
    name: "Moteur thermique refroidissement optimisé",
    category: "Powertrain",
    status: "En cours",
    progress: 40,
    deadline: "GP Silverstone",
    budget: 3200000,
    lead: "Ingénieur Moteur",
    spent: 1200000,
  },
  {
    id: 4,
    name: "DRS système actionneur V2",
    category: "Aérodynamique",
    status: "Planifié",
    progress: 10,
    deadline: "GP Spa",
    budget: 900000,
    lead: "Ingénieur Aéro",
    spent: 900000,
  },
  {
    id: 5,
    name: "Boîte de vitesses 8 rapports allégée",
    category: "Transmission",
    status: "En cours",
    progress: 75,
    deadline: "GP Canada",
    budget: 2100000,
    lead: "Ingénieur Transmission",
    spent: 1500000,
  },
  {
    id: 6,
    name: "Système de freinage carbone-céramique",
    category: "Freinage",
    status: "Planifié",
    progress: 5,
    deadline: "GP Japon",
    budget: 1500000,
    lead: "Ingénieur Freinage",
    spent: 1500000,
  },
];


const categoryColors: Record<string, string> = {
  "Aérodynamique": "hsl(43, 96%, 56%)",
  "Châssis": "hsl(210, 60%, 50%)",
  "Powertrain": "hsl(0, 72%, 51%)",
  "Transmission": "hsl(280, 60%, 55%)",
  "Freinage": "hsl(150, 60%, 45%)",
};

const pieceTypes = [
  "Châssis",
  "Aileron avant",
  "Aileron arrière",
  "Flancs",
  "Fond plat",
  "Suspension",
];

const emptyForm = {
  nom: "",
  cout: "",
  reductionTrainee: "",
  deltaDRS: "",
  refroidissementMoteur: "",
  debitAirMilieu: "",
  preservationPneus: "",
  sensibiliteDebitAir: "",
  debitAirAvant: "",
};

// ── Aerodynamic table ──────────────────────────────────────────────────────────

const aeroGroups: { piece: string; parametres: string[] }[] = [
  {
    piece: "Châssis",
    parametres: ["Réduction traînée", "Delta DRS", "Refroidissement moteur", "Débit d'air milieu"],
  },
  {
    piece: "Aileron avant",
    parametres: ["Préservation des pneus", "Sensibilité du débit d'air", "Débit d'air avant"],
  },
  {
    piece: "Aileron arrière",
    parametres: ["Réduction traînée", "Delta DRS", "Sensibilité du débit d'air"],
  },
  {
    piece: "Flancs",
    parametres: ["Réduction traînée", "Refroidissement moteur", "Débit d'air avant", "Débit d'air milieu"],
  },
  {
    piece: "Fond plat",
    parametres: ["Réduction traînée", "Sensibilité du débit d'air"],
  },
  {
    piece: "Suspension",
    parametres: ["Réduction traînée", "Préservation des pneus", "Débit d'air avant"],
  },
];

type AeroCellData = {
  statBase: number;
  gainsAttendus: number;
  modificationsReglementations: number;
  objectif: number;
  nDeR: number;
};

type AeroTableState = Record<string, AeroCellData>;

function makeDefaultAeroState(): AeroTableState {
  const state: AeroTableState = {};
  for (const group of aeroGroups) {
    for (const param of group.parametres) {
      state[`${group.piece}__${param}`] = {
        statBase: 0,
        gainsAttendus: 0,
        modificationsReglementations: 0,
        objectif: 0,
        nDeR: 0,
      };
    }
  }
  return state;
}

const fmtPct = (val: number) =>
  val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

function NumCell({
  value,
  onChange,
  width = "w-20",
  textColor,
}: {
  value: number;
  onChange: (v: number) => void;
  width?: string;
  textColor?: string;
}) {
  return (
    <input
      type="number"
      step="0.01"
      value={value === 0 ? "" : value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onBlur={(e) => { if (e.target.value === "") onChange(0); }}
      placeholder="0,00"
      className={`${width} bg-transparent text-center text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 py-0.5 ${textColor ?? ""}`}
    />
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function RDPage() {
  const { t } = useTranslation("rd");
  const { setSections } = useBudget();
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = window.localStorage.getItem(RD_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultProjects;
  });
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const toggleCollapse = (id: number) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });

  const [aeroData, setAeroData] = useState<AeroTableState>(() => {
    try {
      const stored = window.localStorage.getItem(AERO_TABLE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...makeDefaultAeroState(), ...parsed };
      }
    } catch {}
    return makeDefaultAeroState();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(RD_STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AERO_TABLE_KEY, JSON.stringify(aeroData));
    } catch {}
  }, [aeroData]);

  const updateAeroCell = (piece: string, param: string, field: keyof AeroCellData, value: number) => {
    setAeroData((prev) => ({
      ...prev,
      [`${piece}__${param}`]: {
        ...prev[`${piece}__${param}`],
        [field]: value,
      },
    }));
  };

  const buildSpecs = (piece: string): Record<string, string> => {
    const specs: Record<string, string> = {};
    if (piece === "Châssis") {
      if (formValues.reductionTrainee) specs["Réduction traînée"] = `${formValues.reductionTrainee}%`;
      if (formValues.deltaDRS) specs["Delta DRS"] = `${formValues.deltaDRS}%`;
      if (formValues.refroidissementMoteur) specs["Refroidissement moteur"] = `${formValues.refroidissementMoteur}%`;
      if (formValues.debitAirMilieu) specs["Débit d'air milieu"] = `${formValues.debitAirMilieu}%`;
    }
    if (piece === "Aileron avant") {
      if (formValues.preservationPneus) specs["Préservation des pneus"] = `${formValues.preservationPneus}%`;
      if (formValues.sensibiliteDebitAir) specs["Sensibilité du débit d'air"] = `${formValues.sensibiliteDebitAir}%`;
      if (formValues.debitAirAvant) specs["Débit d'air avant"] = `${formValues.debitAirAvant}%`;
    }
    if (piece === "Aileron arrière") {
      if (formValues.reductionTrainee) specs["Réduction traînée"] = `${formValues.reductionTrainee}%`;
      if (formValues.deltaDRS) specs["Delta DRS"] = `${formValues.deltaDRS}%`;
      if (formValues.sensibiliteDebitAir) specs["Sensibilité du débit d'air"] = `${formValues.sensibiliteDebitAir}%`;
    }
    if (piece === "Flancs") {
      if (formValues.reductionTrainee) specs["Réduction traînée"] = `${formValues.reductionTrainee}%`;
      if (formValues.refroidissementMoteur) specs["Refroidissement moteur"] = `${formValues.refroidissementMoteur}%`;
      if (formValues.debitAirAvant) specs["Débit d'air avant"] = `${formValues.debitAirAvant}%`;
      if (formValues.debitAirMilieu) specs["Débit d'air milieu"] = `${formValues.debitAirMilieu}%`;
    }
    if (piece === "Fond plat") {
      if (formValues.reductionTrainee) specs["Réduction traînée"] = `${formValues.reductionTrainee}%`;
      if (formValues.sensibiliteDebitAir) specs["Sensibilité du débit d'air"] = `${formValues.sensibiliteDebitAir}%`;
    }
    if (piece === "Suspension") {
      if (formValues.reductionTrainee) specs["Réduction traînée"] = `${formValues.reductionTrainee}%`;
      if (formValues.preservationPneus) specs["Préservation des pneus"] = `${formValues.preservationPneus}%`;
      if (formValues.debitAirAvant) specs["Débit d'air avant"] = `${formValues.debitAirAvant}%`;
    }
    return specs;
  };

  const buildGainsMap = (piece: string): Record<string, number> => {
    const gainsMap: Record<string, number> = {};
    if (piece === "Châssis") {
      if (formValues.reductionTrainee) gainsMap["Réduction traînée"] = parseFloat(formValues.reductionTrainee);
      if (formValues.deltaDRS) gainsMap["Delta DRS"] = parseFloat(formValues.deltaDRS);
      if (formValues.refroidissementMoteur) gainsMap["Refroidissement moteur"] = parseFloat(formValues.refroidissementMoteur);
      if (formValues.debitAirMilieu) gainsMap["Débit d'air milieu"] = parseFloat(formValues.debitAirMilieu);
    }
    if (piece === "Aileron avant") {
      if (formValues.preservationPneus) gainsMap["Préservation des pneus"] = parseFloat(formValues.preservationPneus);
      if (formValues.sensibiliteDebitAir) gainsMap["Sensibilité du débit d'air"] = parseFloat(formValues.sensibiliteDebitAir);
      if (formValues.debitAirAvant) gainsMap["Débit d'air avant"] = parseFloat(formValues.debitAirAvant);
    }
    if (piece === "Aileron arrière") {
      if (formValues.reductionTrainee) gainsMap["Réduction traînée"] = parseFloat(formValues.reductionTrainee);
      if (formValues.deltaDRS) gainsMap["Delta DRS"] = parseFloat(formValues.deltaDRS);
      if (formValues.sensibiliteDebitAir) gainsMap["Sensibilité du débit d'air"] = parseFloat(formValues.sensibiliteDebitAir);
    }
    if (piece === "Flancs") {
      if (formValues.reductionTrainee) gainsMap["Réduction traînée"] = parseFloat(formValues.reductionTrainee);
      if (formValues.refroidissementMoteur) gainsMap["Refroidissement moteur"] = parseFloat(formValues.refroidissementMoteur);
      if (formValues.debitAirAvant) gainsMap["Débit d'air avant"] = parseFloat(formValues.debitAirAvant);
      if (formValues.debitAirMilieu) gainsMap["Débit d'air milieu"] = parseFloat(formValues.debitAirMilieu);
    }
    if (piece === "Fond plat") {
      if (formValues.reductionTrainee) gainsMap["Réduction traînée"] = parseFloat(formValues.reductionTrainee);
      if (formValues.sensibiliteDebitAir) gainsMap["Sensibilité du débit d'air"] = parseFloat(formValues.sensibiliteDebitAir);
    }
    if (piece === "Suspension") {
      if (formValues.reductionTrainee) gainsMap["Réduction traînée"] = parseFloat(formValues.reductionTrainee);
      if (formValues.preservationPneus) gainsMap["Préservation des pneus"] = parseFloat(formValues.preservationPneus);
      if (formValues.debitAirAvant) gainsMap["Débit d'air avant"] = parseFloat(formValues.debitAirAvant);
    }
    return gainsMap;
  };

  const openEdit = (project: Project) => {
    const s = project.specs ?? {};
    const strip = (key: string) => (s[key] ? s[key].replace("%", "") : "");
    setEditingProject(project);
    setSelectedPiece(project.category);
    setFormValues({
      nom: project.name,
      cout: project.cost ? String(project.cost / 1_000_000) : "",
      reductionTrainee: strip("Réduction traînée"),
      deltaDRS: strip("Delta DRS"),
      refroidissementMoteur: strip("Refroidissement moteur"),
      debitAirMilieu: strip("Débit d'air milieu"),
      preservationPneus: strip("Préservation des pneus"),
      sensibiliteDebitAir: strip("Sensibilité du débit d'air"),
      debitAirAvant: strip("Débit d'air avant"),
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPiece) return;
    const specs = buildSpecs(selectedPiece);
    const gainsMap = buildGainsMap(selectedPiece);
    const cost = (Number(formValues.cout) || 0) * 1_000_000;

    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? { ...p, name: formValues.nom, cost, specs: Object.keys(specs).length > 0 ? specs : undefined }
            : p
        )
      );
      const oldCost = editingProject.cost ?? 0;
      const oldSpecs = editingProject.specs ?? {};
      setAeroData((prev) => {
        const next = { ...prev };
        for (const [param, valStr] of Object.entries(oldSpecs)) {
          const key = `${selectedPiece}__${param}`;
          if (next[key]) next[key] = { ...next[key], gainsAttendus: (next[key].gainsAttendus || 0) - (parseFloat(String(valStr)) || 0) };
        }
        for (const [param, val] of Object.entries(gainsMap)) {
          const key = `${selectedPiece}__${param}`;
          if (next[key]) next[key] = { ...next[key], gainsAttendus: (next[key].gainsAttendus || 0) + val };
        }
        return next;
      });
      if (oldCost !== cost) {
        setSections((prev) =>
          prev.map((s) =>
            s.section === "R&D"
              ? { ...s, spentTotal: Math.max(0, (s.spentTotal || 0) - oldCost) + cost }
              : s
          )
        );
      }
      setEditingProject(null);
    } else {
      const newProject: Project = {
        id: Date.now(),
        name: formValues.nom,
        category: selectedPiece,
        status: "Planifié",
        progress: 0,
        deadline: "—",
        budget: 0,
        lead: "—",
        spent: 0,
        cost,
        ...(Object.keys(specs).length > 0 ? { specs } : {}),
      };
      setProjects((prev) => [...prev, newProject]);
      if (Object.keys(gainsMap).length > 0) {
        setAeroData((prev) => {
          const next = { ...prev };
          for (const [param, val] of Object.entries(gainsMap)) {
            const key = `${selectedPiece}__${param}`;
            if (next[key]) next[key] = { ...next[key], gainsAttendus: (next[key].gainsAttendus || 0) + val };
          }
          return next;
        });
      }
      if (cost > 0) {
        setSections((prev) =>
          prev.map((s) =>
            s.section === "R&D" ? { ...s, spentTotal: (s.spentTotal || 0) + cost } : s
          )
        );
      }
    }
    setDialogOpen(false);
    setFormValues(emptyForm);
  };

  const resetAll = () => {
    setProjects([]);
    setAeroData(makeDefaultAeroState());
    setSections((prev) =>
      prev.map((s) => (s.section === "R&D" ? { ...s, spentTotal: 0 } : s))
    );
    setResetDialogOpen(false);
  };

  const removeProject = (id: number) => {
    const project = projects.find((p) => p.id === id);
    if (project?.cost && project.cost > 0) {
      setSections((prev) =>
        prev.map((s) =>
          s.section === "R&D"
            ? { ...s, spentTotal: Math.max(0, (s.spentTotal || 0) - project.cost!) }
            : s
        )
      );
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div data-tour-id="rd-create-project" className="flex items-center gap-3 mt-8 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary">{t("createProject")}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {pieceTypes.map((type) => (
              <DropdownMenuItem
                key={type}
                onSelect={() => {
                  setSelectedPiece(type);
                  setDialogOpen(true);
                }}
              >
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xs text-muted-foreground">
          {t("projectCount", { count: projects.length })}
        </span>
        <Button
          variant="destructive"
          className="ml-auto flex items-center gap-1.5"
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
            <Button variant="destructive" onClick={resetAll}>{t("confirmReset")}</Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">{t("cancel")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setFormValues(emptyForm); setEditingProject(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? t("editTitle", { piece: selectedPiece }) : t("createTitle", { piece: selectedPiece })}</DialogTitle>
            <DialogDescription>
              {editingProject ? t("editDescription") : t("createDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">{t("projectNameLabel")}</label>
              <Input
                value={formValues.nom}
                onChange={(e) => setFormValues((f) => ({ ...f, nom: e.target.value }))}
                placeholder={t("projectNamePlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">{t("costLabel")}</label>
              <Input
                type="number"
                value={formValues.cout}
                onChange={(e) => setFormValues((f) => ({ ...f, cout: e.target.value }))}
                placeholder={t("costPlaceholder")}
                min={0}
                step={0.01}
              />
            </div>
            {selectedPiece === "Châssis" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Réduction traînée (%)</label>
                  <Input
                    type="number"
                    value={formValues.reductionTrainee}
                    onChange={(e) => setFormValues((f) => ({ ...f, reductionTrainee: e.target.value }))}
                    placeholder="Réduction traînée (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Delta DRS (%)</label>
                  <Input
                    type="number"
                    value={formValues.deltaDRS}
                    onChange={(e) => setFormValues((f) => ({ ...f, deltaDRS: e.target.value }))}
                    placeholder="Delta DRS (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Refroidissement moteur (%)</label>
                  <Input
                    type="number"
                    value={formValues.refroidissementMoteur}
                    onChange={(e) => setFormValues((f) => ({ ...f, refroidissementMoteur: e.target.value }))}
                    placeholder="Refroidissement moteur (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Débit d&apos;air milieu (%)</label>
                  <Input
                    type="number"
                    value={formValues.debitAirMilieu}
                    onChange={(e) => setFormValues((f) => ({ ...f, debitAirMilieu: e.target.value }))}
                    placeholder="Débit d'air milieu (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            {selectedPiece === "Aileron avant" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Préservation des pneus (%)</label>
                  <Input
                    type="number"
                    value={formValues.preservationPneus}
                    onChange={(e) => setFormValues((f) => ({ ...f, preservationPneus: e.target.value }))}
                    placeholder="Préservation des pneus (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Sensibilité du débit d&apos;air (%)</label>
                  <Input
                    type="number"
                    value={formValues.sensibiliteDebitAir}
                    onChange={(e) => setFormValues((f) => ({ ...f, sensibiliteDebitAir: e.target.value }))}
                    placeholder="Sensibilité du débit d'air (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Débit d&apos;air avant (%)</label>
                  <Input
                    type="number"
                    value={formValues.debitAirAvant}
                    onChange={(e) => setFormValues((f) => ({ ...f, debitAirAvant: e.target.value }))}
                    placeholder="Débit d'air avant (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            {selectedPiece === "Aileron arrière" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Réduction traînée (%)</label>
                  <Input
                    type="number"
                    value={formValues.reductionTrainee}
                    onChange={(e) => setFormValues((f) => ({ ...f, reductionTrainee: e.target.value }))}
                    placeholder="Réduction traînée (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Delta DRS (%)</label>
                  <Input
                    type="number"
                    value={formValues.deltaDRS}
                    onChange={(e) => setFormValues((f) => ({ ...f, deltaDRS: e.target.value }))}
                    placeholder="Delta DRS (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Sensibilité du débit d&apos;air (%)</label>
                  <Input
                    type="number"
                    value={formValues.sensibiliteDebitAir}
                    onChange={(e) => setFormValues((f) => ({ ...f, sensibiliteDebitAir: e.target.value }))}
                    placeholder="Sensibilité du débit d'air (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            {selectedPiece === "Flancs" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Réduction traînée (%)</label>
                  <Input
                    type="number"
                    value={formValues.reductionTrainee}
                    onChange={(e) => setFormValues((f) => ({ ...f, reductionTrainee: e.target.value }))}
                    placeholder="Réduction traînée (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Refroidissement moteur (%)</label>
                  <Input
                    type="number"
                    value={formValues.refroidissementMoteur}
                    onChange={(e) => setFormValues((f) => ({ ...f, refroidissementMoteur: e.target.value }))}
                    placeholder="Refroidissement moteur (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Débit d&apos;air avant (%)</label>
                  <Input
                    type="number"
                    value={formValues.debitAirAvant}
                    onChange={(e) => setFormValues((f) => ({ ...f, debitAirAvant: e.target.value }))}
                    placeholder="Débit d'air avant (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Débit d&apos;air milieu (%)</label>
                  <Input
                    type="number"
                    value={formValues.debitAirMilieu}
                    onChange={(e) => setFormValues((f) => ({ ...f, debitAirMilieu: e.target.value }))}
                    placeholder="Débit d'air milieu (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            {selectedPiece === "Fond plat" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Réduction traînée (%)</label>
                  <Input
                    type="number"
                    value={formValues.reductionTrainee}
                    onChange={(e) => setFormValues((f) => ({ ...f, reductionTrainee: e.target.value }))}
                    placeholder="Réduction traînée (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Sensibilité du débit d&apos;air (%)</label>
                  <Input
                    type="number"
                    value={formValues.sensibiliteDebitAir}
                    onChange={(e) => setFormValues((f) => ({ ...f, sensibiliteDebitAir: e.target.value }))}
                    placeholder="Sensibilité du débit d'air (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            {selectedPiece === "Suspension" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Réduction traînée (%)</label>
                  <Input
                    type="number"
                    value={formValues.reductionTrainee}
                    onChange={(e) => setFormValues((f) => ({ ...f, reductionTrainee: e.target.value }))}
                    placeholder="Réduction traînée (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Préservation des pneus (%)</label>
                  <Input
                    type="number"
                    value={formValues.preservationPneus}
                    onChange={(e) => setFormValues((f) => ({ ...f, preservationPneus: e.target.value }))}
                    placeholder="Préservation des pneus (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Débit d&apos;air avant (%)</label>
                  <Input
                    type="number"
                    value={formValues.debitAirAvant}
                    onChange={(e) => setFormValues((f) => ({ ...f, debitAirAvant: e.target.value }))}
                    placeholder="Débit d'air avant (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="submit">{editingProject ? t("save") : t("submit")}</Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">{t("cancel")}</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {(() => {
        const actifs = projects.filter((p) => !collapsedIds.has(p.id));
        return actifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16">
            <span className="text-muted-foreground text-lg">{t("noProjects")}</span>
          </div>
        ) : (
          <div data-tour-id="rd-active-projects" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actifs.map((project, i) => {
              const catColor = categoryColors[project.category] ?? "hsl(220, 12%, 50%)";
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ layout: { duration: 0.2 }, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl px-5 py-3 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                      <span className="text-xs font-medium" style={{ color: catColor }}>
                        {project.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 ml-2">
                      <button
                        onClick={() => toggleCollapse(project.id)}
                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors"
                        title={t("complete")}
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(project)}
                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title={t("edit")}
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeProject(project.id)}
                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={t("delete")}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mt-3">
                    <span className="text-muted-foreground">{t("cost")}</span>
                    <span className="font-mono">{project.cost ? formatMoneyInMillions(project.cost, 2) : "—"}</span>
                  </div>
                  {project.deadline !== "—" && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">{t("deadline")}</span>
                      <span className="font-mono text-primary">{project.deadline}</span>
                    </div>
                  )}
                  {project.specs && Object.keys(project.specs).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1">
                      {Object.entries(project.specs).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-mono text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Aerodynamic Performance Table ─────────────────────────────────────── */}
      <div data-tour-id="rd-aero-table" className="mt-12">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          {t("aeroPerformance")}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-card border-b-2 border-border shadow-sm">
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px] w-28"></th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px] w-40"></th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                  {t("baseStat")}
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                  {t("expectedGains")}
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                  {t("regulationChanges")}
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                  {t("postRegulationValue")}
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                  {t("objective")}
                </th>
                <th className="px-3 py-3 text-center font-semibold text-cyan-400 uppercase tracking-wide text-[10px]">
                  {t("gap")}
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                  {t("nDeR")}
                </th>
                <th className="px-3 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Calculer tous les groupGaps d'abord pour trouver le minimum et maximum
                const groupGapsData = aeroGroups.map(group => {
                  const gapSum = group.parametres.reduce((sum, param) => {
                    const cell = aeroData[`${group.piece}__${param}`];
                    const valeur = (cell.statBase + cell.gainsAttendus) - cell.modificationsReglementations;
                    return sum + (valeur - cell.objectif);
                  }, 0);
                  return gapSum / group.parametres.length;
                });

                const minGap = Math.min(...groupGapsData);
                const maxGap = Math.max(...groupGapsData);
                const gapRange = maxGap - minGap;

                // Fonction pour obtenir la couleur dégradée rouge -> orange
                const getGapColor = (gap: number) => {
                  if (gapRange === 0) return "rgb(220, 38, 38)"; // Rouge si toutes les valeurs sont égales
                  const normalized = (gap - minGap) / gapRange; // 0 (min/rouge) à 1 (max/orange)
                  
                  // Rouge: rgb(220, 38, 38) -> Orange: rgb(249, 115, 22)
                  const r = Math.round(220 + (249 - 220) * normalized);
                  const g = Math.round(38 + (115 - 38) * normalized);
                  const b = Math.round(38 + (22 - 38) * normalized);
                  
                  return `rgb(${r}, ${g}, ${b})`;
                };

                return aeroGroups.flatMap((group, groupIdx) => {
                  const groupGap = groupGapsData[groupIdx];
                  const gapColor = getGapColor(groupGap);
                  const groupColor = categoryColors[group.piece] ?? "hsl(220, 12%, 50%)";
                  const zebra = groupIdx % 2 === 0 ? "bg-card" : "bg-muted/5";

                const dataRows = group.parametres.map((param, pIdx) => {
                  const cellKey = `${group.piece}__${param}`;
                  const cell = aeroData[cellKey];
                  const valeur = (cell.statBase + cell.gainsAttendus) - cell.modificationsReglementations;
                  const gap = valeur - cell.objectif;
                  const isFirst = pIdx === 0;
                  const isLast = pIdx === group.parametres.length - 1;

                  return (
                    <tr
                      key={cellKey}
                      className={`${zebra} hover:bg-muted/20 transition-colors ${isFirst ? "border-t-2" : "border-t border-border/30"} ${isLast ? "border-b-2 border-b-border/60" : ""}`}
                      style={isFirst ? { borderTopColor: groupColor } : undefined}
                    >
                      {isFirst && (
                        <td
                          rowSpan={group.parametres.length}
                          className="px-3 py-2 font-semibold text-foreground text-center border-r border-border align-middle whitespace-nowrap"
                          style={{ boxShadow: `inset 3px 0 0 ${groupColor}` }}
                        >
                          {group.piece}
                        </td>
                      )}
                      <td className="px-3 py-2 text-[#5BA8D4] border-r border-border/30 whitespace-nowrap">
                        {param}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-border/20">
                        <NumCell
                          value={cell.statBase}
                          onChange={(v) => updateAeroCell(group.piece, param, "statBase", v)}
                        />
                      </td>
                      <td className="px-2 py-1 text-center border-r border-border/20">
                        <NumCell
                          value={cell.gainsAttendus}
                          onChange={(v) => updateAeroCell(group.piece, param, "gainsAttendus", v)}
                        />
                      </td>
                      <td className="px-2 py-1 text-center border-r border-border/20">
                        <NumCell
                          value={cell.modificationsReglementations}
                          onChange={(v) => updateAeroCell(group.piece, param, "modificationsReglementations", v)}
                          textColor={cell.modificationsReglementations > 0 ? "text-red-500" : undefined}
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-semibold border-r border-border/20">
                        {fmtPct(valeur)}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-border/20">
                        <NumCell
                          value={cell.objectif}
                          onChange={(v) => updateAeroCell(group.piece, param, "objectif", v)}
                          width="w-16"
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-cyan-400 border-r border-border/20">
                        {fmtPct(gap)}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-border/20">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={cell.nDeR === 0 ? "" : cell.nDeR}
                          onChange={(e) =>
                            updateAeroCell(group.piece, param, "nDeR", parseInt(e.target.value) || 0)
                          }
                          onBlur={(e) => { if (e.target.value === "") updateAeroCell(group.piece, param, "nDeR", 0); }}
                          placeholder="0"
                          className="w-12 bg-transparent text-center text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 py-0.5"
                        />
                      </td>
                      {isFirst && (
                        <td
                          rowSpan={group.parametres.length}
                          className="px-3 py-2 text-center font-mono align-middle border-l border-border font-semibold"
                          style={{ color: gapColor }}
                        >
                          {fmtPct(groupGap)}
                        </td>
                      )}
                    </tr>
                  );
                });

                return dataRows;
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Projets achevés ───────────────────────────────────────────────────── */}
      {(() => {
        const achevesList = projects.filter((p) => collapsedIds.has(p.id));
        if (achevesList.length === 0) return null;
        return (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              {t("completedProjects", { count: achevesList.length })}
            </h2>
            <div className="flex flex-col gap-1">
              {achevesList.map((project) => {
                const catColor = categoryColors[project.category] ?? "hsl(220, 12%, 50%)";
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="text-sm font-medium truncate">{project.name}</span>
                      <span className="text-xs shrink-0" style={{ color: catColor }}>{project.category}</span>
                    </div>
                    <div className="flex items-center gap-0.5 ml-3 shrink-0">
                      <button
                        onClick={() => toggleCollapse(project.id)}
                        className="p-1 rounded text-green-400 hover:text-muted-foreground hover:bg-muted/20 transition-colors"
                        title={t("reactivate")}
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(project)}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title={t("edit")}
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeProject(project.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={t("delete")}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
