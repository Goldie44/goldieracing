import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  FlagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavOrder } from "@/lib/NavOrderContext";
import { useProfile } from "@/lib/ProfileContext";
import { useAppearance } from "@/lib/AppearanceContext";
import NavList from "@/components/NavList";

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { orderedItems, reorder, settingsItem } = useNavOrder();
  const { teamName } = useProfile();
  const { bgImage, bgOpacity, bgBlur } = useAppearance();

  return (
    <div className="min-h-screen flex bg-background relative">
      {bgImage && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${bgImage})`,
            opacity: bgOpacity / 100,
            filter: `blur(${(bgBlur / 100) * 20}px)`,
          }}
        />
      )}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed inset-y-0 z-30">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlagIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight">F1 Manager</h1>
              <p className="text-xs text-muted-foreground font-mono">{teamName}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavList
            items={orderedItems}
            activePath={location.pathname}
            isEditMode={false}
            droppableId="desktop-nav"
            onReorder={reorder}
            onItemClick={undefined}
          />
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link
            to={settingsItem.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname === settingsItem.path
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <settingsItem.icon className="w-4 h-4" />
            {settingsItem.label}
            {location.pathname === settingsItem.path && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
          <div className="text-xs text-muted-foreground font-mono text-center">
            <p>Beta Version 1.8.0</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <FlagIcon className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">GOLDIE F1</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
            {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="w-64 h-full bg-card border-r border-border p-4 pt-20 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-1 space-y-1">
                <NavList
                  items={orderedItems}
                  activePath={location.pathname}
                  isEditMode={false}
                  droppableId="mobile-nav"
                  onReorder={reorder}
                  onItemClick={() => setMobileOpen(false)}
                />
                <Link
                  to={settingsItem.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === settingsItem.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <settingsItem.icon className="w-4 h-4" />
                  {settingsItem.label}
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
