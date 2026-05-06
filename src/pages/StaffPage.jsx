import { motion } from "framer-motion";
import { User, Star } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { staff } from "../lib/f1Data";

function SkillBar({ name, value }) {
  const color = value >= 90 ? "bg-green-400" : value >= 85 ? "bg-primary" : value >= 80 ? "bg-blue-400" : "bg-muted-foreground";

  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">{name}</span>
        <span className="text-xs font-mono font-semibold">{value}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <div>
      <PageHeader title="Personnel" subtitle="Équipe technique et compétences" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member, i) => {
          const avgSkill = Math.round(member.skills.reduce((a, b) => a + b.value, 0) / member.skills.length);
          const topSkill = member.skills.reduce((a, b) => a.value > b.value ? a : b);

          return (
            <motion.div
              key={member.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{member.role}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs text-muted-foreground">Moy. {avgSkill}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-primary">{avgSkill}</div>
                </div>
              </div>

              {/* Top Skill Highlight */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-4">
                <div className="text-xs text-primary font-medium">Meilleure compétence</div>
                <div className="text-sm font-semibold mt-0.5">{topSkill.name} — {topSkill.value}</div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                {member.skills.map(skill => (
                  <SkillBar key={skill.name} name={skill.name} value={skill.value} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}