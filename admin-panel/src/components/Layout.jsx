import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquareWarning, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Bell
} from "lucide-react";

// --- Configuration ---
const NAV_ITEMS = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/applications", icon: FileText,        label: "Applications" },
  { to: "/complaints",   icon: MessageSquareWarning, label: "Complaints"   },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(null);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-200 font-sans">
      
      {/* ── SIDEBAR ── */}
      <aside className="w-64 flex-shrink-0 bg-[#0F172A] border-r border-slate-800 flex flex-col sticky top-0 h-screen z-20">
        
        {/* Branding Section */}
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              {/* Subtle Pulsing Aura */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-500 rounded-xl -z-10"
              />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight leading-none">Sahayak</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1 uppercase">Admin Command</p>
            </div>
          </div>

          {/* Tricolor Accent - Professional Subtle Version */}
          <div className="flex h-[2px] w-full rounded-full overflow-hidden opacity-60">
            <div className="flex-1 bg-orange-500" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-green-600" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onMouseEnter={() => setIsHovered(item.to)}
                onMouseLeave={() => setIsHovered(null)}
                className="relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 no-underline"
              >
                {/* Active Background Glow */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                  />
                )}

                <item.icon className={`w-5 h-5 z-10 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                
                <span className={`text-sm font-semibold z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="ml-auto z-10"
                  >
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 font-semibold text-sm group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Modern Topbar (Glassmorphism) */}
        <header className="h-16 flex items-center px-8 gap-4 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Digital India <span className="mx-2 text-slate-700">•</span> Maharashtra Portal
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Icon */}
            <div className="relative p-2 rounded-full hover:bg-slate-800 cursor-pointer transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0B1120]" />
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">System Live</span>
            </div>

            {/* Profile Avatar Placeholder */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              AD
            </div>
          </div>
        </header>

        {/* Page Content with Entrance Animation */}
        <div className="flex-1 p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}