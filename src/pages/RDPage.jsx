import { motion } from "framer-motion";
import { FlaskConical, CheckCircle, Clock, Zap } from "lucide-react";
import PageHeader from "../components/PageHeader";

const projects = [
  {
    id: 1,
    name: "Fond plat aérodynamique Spec 2",
    category: "Aérodynamique",
    status: "En cours",
    progress: 65,
    deadline: "GP Monaco",
    budget: 2400000,
    lead: "Ingénieur Aéro",
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
  },
];

const statusConfig = {
  "Terminé": { color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle },
  "En cours": { color: "text-primary", bg: "bg-primary/10", icon: Zap },
  "Planifié": { color: "text-muted-foreground", bg: "bg-secondary", icon: Clock },
};

const categoryColors = {
  "Aérodynamique": "hsl(43, 96%, 56%)",
  "Châssis": "hsl(210, 60%, 50%)",
  "Powertrain": "hsl(0, 72%, 51%)",
  "Transmission": "hsl(280, 60%, 55%)",
  "Freinage": "hsl(150, 60%, 45%)",
};

export default function RDPage() {
  const totalBudget = projects.reduce((a, p) => a + p.budget, 0);
  const done = projects.filter(p => p.status === "Terminé").length;
  const inProgress = projects.filter(p => p.status === "En cours").length;

  return (
    <div>
      <PageHeader title="Recherche & Développement" subtitle="Projets R&D · Saison 2023" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Projets total", value: projects.length },
          { label: "En cours", value: inProgress },
          { label: "Terminés", value: done },
          { label: "Budget R&D", value: `${(totalBudget / 1000000).toFixed(1)}M €` },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-2xl font-bold font-mono text-foreground">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p, i) => {
          const cfg = statusConfig[p.status];
          const Icon = cfg.icon;
          const catColor = categoryColors[p.category] || "hsl(220,10%,50%)";
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: catColor + "20", color: catColor }}
                  >
                    {p.category}
                  </span>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  <Icon className="w-3 h-3" />
                  {p.status}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-4">{p.name}</h3>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Avancement</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ background: p.progress === 100 ? "hsl(150,60%,45%)" : catColor }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>📅 {p.deadline}</span>
                <span className="font-mono text-foreground">{(p.budget / 1000000).toFixed(1)}M €</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}