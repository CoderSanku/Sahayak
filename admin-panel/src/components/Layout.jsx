import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  LogOut,
  Building2,
  ChevronRight,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/applications", icon: FileText, label: "Applications" },
  { to: "/complaints", icon: AlertCircle, label: "Complaints" },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen text-slate-800 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #bfdbfe 0%, #dbeafe 50%, #bae6fd 100%)" }}
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-64 w-80 h-80 bg-indigo-300/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl" />
      </div>

      {/* ── SIDEBAR (Darker blue, not black) ── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col relative z-10 shadow-2xl"
        style={{ background: "linear-gradient(180deg, #1e3a5f 0%, #1e3a6e 50%, #1a3460 100%)" }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          {/* Indian tricolor stripe */}
          <div className="h-[3px] rounded-full mb-5 bg-gradient-to-r from-orange-400 via-white to-green-400 opacity-90" />

          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="p-2 rounded-xl bg-blue-400/20">
              <Building2 className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-wide">
                GramSevak Bot
              </div>
              <div className="text-[10px] text-blue-200/60 tracking-[0.2em] uppercase">
                Admin Panel
              </div>
            </div>
          </motion.div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map(({ to, icon: Icon, label }, index) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ x: 4 }}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                    cursor-pointer relative overflow-hidden transition-all duration-200
                    ${isActive
                      ? "text-white bg-blue-400/25 border border-blue-300/30 shadow-lg"
                      : "text-blue-100/70 hover:text-white hover:bg-white/10"}
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-300"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <Icon className={`w-[18px] h-[18px] ${isActive ? "text-blue-200" : "group-hover:text-blue-300"}`} />
                  <span className="flex-1">{label}</span>

                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-200 opacity-60" />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-2 text-blue-100/60 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </motion.div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Topbar */}
        <div className="h-14 backdrop-blur-xl border-b border-blue-200/60 flex items-center px-6 shadow-sm"
          style={{ background: "rgba(219, 234, 254, 0.6)" }}
        >
          <div className="flex-1 text-xs text-blue-700/70 font-medium tracking-wide">
            Maharashtra Government — Certificate Portal
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1 text-xs flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              Admin
            </Badge>
          </div>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            className="flex-1 p-6 overflow-y-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}