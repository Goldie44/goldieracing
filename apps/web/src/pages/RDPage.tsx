import { motion } from "framer-motion";
import { BoltIcon, CheckCircleIcon, ClockIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import { formatMoneyInMillions } from "../lib/utils";
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
  specs?: Record<string, string>;
};

const RD_STORAGE_KEY = "goldie-racing:rd-projects";

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

const statusConfig: Record<Project["status"], { color: string; bg: string; icon: React.ElementType }> = {
  "Terminé": { color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircleIcon },
  "En cours": { color: "text-primary", bg: "bg-primary/10", icon: BoltIcon },
  "Planifié": { color: "text-muted-foreground", bg: "bg-secondary", icon: ClockIcon },
};

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
  budget: "",
  reductionTrainee: "",
  deltaDRS: "",
  refroidissementMoteur: "",
  debitAirMilieu: "",
};

export default function RDPage() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = window.localStorage.getItem(RD_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaultProjects;
  });
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);

  useEffect(() => {
    try {
      window.localStorage.setItem(RD_STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPiece) return;
    const specs: Record<string, string> = {};
    if (selectedPiece === "Châssis") {
      if (formValues.reductionTrainee) specs["Réduction traînée"] = `${formValues.reductionTrainee}%`;
      if (formValues.deltaDRS) specs["Delta DRS"] = `${formValues.deltaDRS}%`;
      if (formValues.refroidissementMoteur) specs["Refroidissement moteur"] = `${formValues.refroidissementMoteur}%`;
      if (formValues.debitAirMilieu) specs["Débit d'air milieu"] = `${formValues.debitAirMilieu}%`;
    }
    const newProject: Project = {
      id: Date.now(),
      name: formValues.nom,
      category: selectedPiece,
      status: "Planifié",
      progress: 0,
      deadline: "—",
      budget: Number(formValues.budget) || 0,
      lead: "—",
      spent: 0,
      ...(Object.keys(specs).length > 0 ? { specs } : {}),
    };
    setProjects(prev => [...prev, newProject]);
    setDialogOpen(false);
    setFormValues(emptyForm);
  };

  const removeProject = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      <PageHeader title="Recherche & Développement" subtitle="Projets R&D" />

      <div className="flex items-center gap-3 mt-8 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary">Créer un projet</Button>
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
          {projects.length} projet{projects.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un projet : {selectedPiece}</DialogTitle>
            <DialogDescription>
              Remplis les informations du projet pour la pièce sélectionnée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Nom du projet</label>
              <Input
                value={formValues.nom}
                onChange={e => setFormValues(f => ({ ...f, nom: e.target.value }))}
                placeholder="Nom du projet"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Budget (€)</label>
              <Input
                type="number"
                value={formValues.budget}
                onChange={e => setFormValues(f => ({ ...f, budget: e.target.value }))}
                placeholder="Budget"
                required
                min={0}
              />
            </div>
            {selectedPiece === "Châssis" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">Réduction traînée (%)</label>
                  <Input
                    type="number"
                    value={formValues.reductionTrainee}
                    onChange={e => setFormValues(f => ({ ...f, reductionTrainee: e.target.value }))}
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
                    onChange={e => setFormValues(f => ({ ...f, deltaDRS: e.target.value }))}
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
                    onChange={e => setFormValues(f => ({ ...f, refroidissementMoteur: e.target.value }))}
                    placeholder="Refroidissement moteur (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Débit d'air milieu (%)</label>
                  <Input
                    type="number"
                    value={formValues.debitAirMilieu}
                    onChange={e => setFormValues(f => ({ ...f, debitAirMilieu: e.target.value }))}
                    placeholder="Débit d'air milieu (%)"
                    min={0}
                    max={100}
                    step={0.01}
                    required
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="submit">Valider</Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annuler</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16">
          <span className="text-muted-foreground text-lg">Aucun projet R&D pour l'instant.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => {
            const statusCfg = statusConfig[project.status];
            const StatusIcon = statusCfg.icon;
            const catColor = categoryColors[project.category] ?? "hsl(220, 12%, 50%)";
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                    <span className="text-xs font-medium" style={{ color: catColor }}>
                      {project.category}
                    </span>
                  </div>
                  <button
                    onClick={() => removeProject(project.id)}
                    className="ml-2 shrink-0 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mb-3 ${statusCfg.bg} ${statusCfg.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {project.status}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progression</span>
                    <span className="font-mono">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-mono">{formatMoneyInMillions(project.budget, 2)}</span>
                </div>
                {project.deadline !== "—" && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Deadline</span>
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
      )}
    </div>
  );
}
