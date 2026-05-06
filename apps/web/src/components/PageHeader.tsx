import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-8"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      <div className="h-1 w-12 bg-primary rounded-full mt-3" />
    </motion.div>
  );
}