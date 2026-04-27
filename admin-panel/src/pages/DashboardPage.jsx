import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase.js";

import {
  FileText, CheckCircle, Clock, AlertCircle,
  TrendingUp, Activity, ArrowRight, Server, Database, Wifi,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ── DENSE GLOW — increased opacity + spread ──
const glowStyle = (glowColor) => ({
  blue: "0 12px 50px rgba(37,99,235,0.65), 0 4px 20px rgba(37,99,235,0.3)",
  emerald: "0 12px 50px rgba(5,150,105,0.65), 0 4px 20px rgba(5,150,105,0.3)",
  amber: "0 12px 50px rgba(217,119,6,0.65), 0 4px 20px rgba(217,119,6,0.3)",
  rose: "0 12px 50px rgba(225,29,72,0.65), 0 4px 20px rgba(225,29,72,0.3)",
}[glowColor]);

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, complaints: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const { count: total } = await supabase.from("applications").select("*", { count: "exact", head: true });
        const { count: approved } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "approved");
        const { count: pending } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending");
        const { count: complaints } = await supabase.from("complaints").select("*", { count: "exact", head: true });
        const { data: recent } = await supabase.from("applications")
          .select("application_id, applicant_name, certificate_name, status, submitted_at")
          .order("submitted_at", { ascending: false })
          .limit(5);

        setStats({ total: total || 0, approved: approved || 0, pending: pending || 0, complaints: complaints || 0 });
        setRecentApps(recent || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Applications", value: stats.total,
      icon: FileText, color: "text-blue-600", bg: "bg-blue-50",
      border: "border-blue-200", glowColor: "blue",
      link: "/applications",
    },
    {
      label: "Approved", value: stats.approved,
      icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50",
      border: "border-emerald-200", glowColor: "emerald",
      link: "/applications?status=approved",
    },
    {
      label: "Pending", value: stats.pending,
      icon: Clock, color: "text-amber-600", bg: "bg-amber-50",
      border: "border-amber-200", glowColor: "amber",
      link: "/applications?status=pending",
    },
    {
      label: "Complaints", value: stats.complaints,
      icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50",
      border: "border-rose-200", glowColor: "rose",
      link: "/complaints",
    },
  ];

  const statusColor = (s) => {
    switch (s) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      case "generated": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="space-y-6 fade-in">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of system activity</p>
        </div>

        <Badge
          className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 text-xs flex items-center gap-2"
          style={{ boxShadow: "0 0 25px rgba(37,99,235,0.7), 0 0 8px rgba(37,99,235,0.4)" }}
        >
          <Activity className="w-3.5 h-3.5" />
          Live
        </Badge>
      </div>

      {/* ── STAT CARDS ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={item}>
              <motion.div
                whileHover={{ y: -6, boxShadow: glowStyle(stat.glowColor) }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-full rounded-xl"
                style={{
                  boxShadow: `0 4px 15px ${{ blue: "rgba(37,99,235,0.15)", emerald: "rgba(5,150,105,0.15)", amber: "rgba(217,119,6,0.15)", rose: "rgba(225,29,72,0.15)" }[stat.glowColor]
                    }`
                }}
              >
                <Card
                  className={`bg-white/90 backdrop-blur-sm border ${stat.border}
                    transition-all duration-300 cursor-pointer group h-full`}
                  onClick={() => navigate(stat.link)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        {stat.label}
                      </div>
                      <div className="text-3xl font-extrabold text-slate-800">
                        {loading ? "—" : stat.value}
                      </div>
                    </div>

                    <motion.div
                      className={`p-3 rounded-xl ${stat.bg}`}
                      whileHover={{ rotate: 10, scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      style={{ boxShadow: glowStyle(stat.glowColor) }}
                    >
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </motion.div>
                  </CardContent>

                  {/* Hover arrow */}
                  <div className="px-5 pb-3 flex items-center gap-1 text-xs text-slate-400
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    View details
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── BOTTOM PANELS ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Recent Applications */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card
            className="bg-white/70 backdrop-blur-md border border-blue-200/70 transition-all duration-300"
            style={{ boxShadow: "0 6px 30px rgba(37,99,235,0.2)" }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 15px 55px rgba(37,99,235,0.4)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 30px rgba(37,99,235,0.2)"}
          >
            <CardContent className="p-5 space-y-4">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-slate-700">Recent Applications</span>
                </div>

                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/applications")}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100/70 transition-all rounded-lg"
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 25px rgba(37,99,235,0.55)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    View all
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                  <div className="text-sm text-slate-400">Loading...</div>
                </div>
              ) : recentApps.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center">No applications yet</div>
              ) : (
                <div className="space-y-2">
                  {recentApps.map((app, i) => (
                    <motion.div
                      key={app.application_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/80
                        border border-blue-100 hover:border-blue-300
                        transition-all cursor-pointer"
                      style={{ boxShadow: "0 3px 15px rgba(37,99,235,0.15)" }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 25px rgba(37,99,235,0.35)"}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 3px 15px rgba(37,99,235,0.15)"}
                      onClick={() => navigate("/applications")}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">
                          {app.applicant_name || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {app.certificate_name || "—"} · {fmt(app.submitted_at)}
                        </div>
                      </div>

                      <Badge className={`text-[10px] capitalize px-2 py-0.5 border ml-3 ${statusColor(app.status)}`}>
                        {app.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div variants={item}>
          <Card
            className="bg-white/70 backdrop-blur-md border border-blue-200/70 transition-all duration-300 h-full"
            style={{ boxShadow: "0 6px 30px rgba(37,99,235,0.2)" }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 15px 55px rgba(37,99,235,0.4)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 6px 30px rgba(37,99,235,0.2)"}
          >
            <CardContent className="p-5 space-y-4">

              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-slate-700">System Status</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Server", icon: Server, status: "Online" },
                  { label: "Database", icon: Database, status: "Connected" },
                  { label: "API", icon: Wifi, status: "Operational" },
                ].map((sys, i) => (
                  <motion.div
                    key={sys.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/80 border border-blue-100"
                    style={{ boxShadow: "0 3px 15px rgba(16,185,129,0.35), 0 1px 5px rgba(16,185,129,0.15)" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 25px rgba(16,185,129,0.55), 0 2px 10px rgba(16,185,129,0.25)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 3px 15px rgba(16,185,129,0.35), 0 1px 5px rgba(16,185,129,0.15)"}
                  >
                    <div className="flex items-center gap-2.5">
                      <sys.icon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{sys.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"
                        style={{ boxShadow: "0 0 14px rgba(16,185,129,1), 0 0 6px rgba(16,185,129,0.8)" }}
                      />
                      <span className="text-xs font-semibold text-emerald-600">{sys.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick stats summary */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-2">Quick Summary</div>
                <div className="grid grid-cols-2 gap-2">

                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    className="text-center p-2 rounded-lg bg-white/80 border border-blue-200 cursor-default"
                    style={{ boxShadow: "0 5px 22px rgba(37,99,235,0.3), 0 2px 8px rgba(37,99,235,0.15)" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 35px rgba(37,99,235,0.55), 0 3px 12px rgba(37,99,235,0.25)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 5px 22px rgba(37,99,235,0.3), 0 2px 8px rgba(37,99,235,0.15)"}
                  >
                    <div className="text-lg font-bold text-blue-600">
                      {loading ? "—" : stats.total}
                    </div>
                    <div className="text-[10px] text-blue-400">Total</div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    className="text-center p-2 rounded-lg bg-white/80 border border-emerald-200 cursor-default"
                    style={{ boxShadow: "0 5px 22px rgba(16,185,129,0.3), 0 2px 8px rgba(16,185,129,0.15)" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 35px rgba(16,185,129,0.55), 0 3px 12px rgba(16,185,129,0.25)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 5px 22px rgba(16,185,129,0.3), 0 2px 8px rgba(16,185,129,0.15)"}
                  >
                    <div className="text-lg font-bold text-emerald-600">
                      {loading ? "—" : Math.round(stats.total ? (stats.approved / stats.total) * 100 : 0)}%
                    </div>
                    <div className="text-[10px] text-emerald-400">Approved</div>
                  </motion.div>

                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}