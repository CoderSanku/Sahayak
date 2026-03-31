// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { motion } from "framer-motion";
import {
  FileText, Clock, CheckCircle, PartyPopper,
  XCircle, MessageSquare, ShieldCheck, ChevronRight,
  ArrowUpRight, BarChart3, Activity
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, bg, border, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 20px -10px rgba(0,0,0,0.1)" }}
      onClick={onClick}
      className={`relative overflow-hidden bg-[#0F172A] border ${border} p-5 rounded-2xl cursor-pointer transition-all group`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`text-2xl font-black ${color}`}>
          {value ?? <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">{label}</div>
        <div className="flex items-center text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
          View Details <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
      {/* Decorative Background Glow */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${bg}`} />
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const queries = [
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "generated"),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "resolved"),
      ];

      const results = await Promise.all(queries);
      setStats({
        totalApps: results[0].count,
        pendingApps: results[1].count,
        approvedApps: results[2].count,
        generatedApps: results[3].count,
        rejectedApps: results[4].count,
        totalCmps: results[5].count,
        pendingCmps: results[6].count,
        resolvedCmps: results[7].count,
      });

      // Load Recent Apps
      const { data } = await supabase
        .from("applications")
        .select("application_id, certificate_name, applicant_name, status, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(6);

      setRecent(data || []);
      setLoading(false);
    }
    loadStats();
  }, []);

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    : "—";

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-violet-400 font-bold text-xs uppercase tracking-[0.2em]">
            <Activity className="w-4 h-4" /> System Overview
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 italic">Real-time metrics for citizen service requests</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl text-xs font-mono text-slate-400">
          Last Refresh: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Application Metrics Grid */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[1px] flex-1 bg-slate-800" />
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Service Applications</h2>
          <div className="h-[1px] flex-1 bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={FileText} label="Total Volume" value={stats?.totalApps} color="text-indigo-400" bg="bg-indigo-400/10" border="border-indigo-400/20" onClick={() => navigate("/applications")} />
          <StatCard icon={Clock} label="Awaiting Review" value={stats?.pendingApps} color="text-amber-400" bg="bg-amber-400/10" border="border-amber-400/20" onClick={() => navigate("/applications?status=pending")} />
          <StatCard icon={CheckCircle} label="Verified" value={stats?.approvedApps} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" onClick={() => navigate("/applications?status=approved")} />
          <StatCard icon={PartyPopper} label="Certificates Issued" value={stats?.generatedApps} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" onClick={() => navigate("/applications?status=generated")} />
          <StatCard icon={XCircle} label="Discrepancies" value={stats?.rejectedApps} color="text-rose-400" bg="bg-rose-400/10" border="border-rose-400/20" onClick={() => navigate("/applications?status=rejected")} />
        </div>
      </section>

      {/* Complaint Metrics Grid */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[1px] flex-1 bg-slate-800" />
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Grievance Desk</h2>
          <div className="h-[1px] flex-1 bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={MessageSquare} label="Total Complaints" value={stats?.totalCmps} color="text-violet-400" bg="bg-violet-400/10" border="border-violet-400/20" onClick={() => navigate("/complaints")} />
          <StatCard icon={Clock} label="Open Issues" value={stats?.pendingCmps} color="text-amber-400" bg="bg-amber-400/10" border="border-amber-400/20" onClick={() => navigate("/complaints?status=pending")} />
          <StatCard icon={ShieldCheck} label="Resolved" value={stats?.resolvedCmps} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" onClick={() => navigate("/complaints?status=resolved")} />
        </div>
      </section>

      {/* Recent Activity Table */}
      <section className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 rounded-lg text-white">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Activity Feed</h3>
          </div>
          <button
            onClick={() => navigate("/applications")}
            className="group flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Full Ledger <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E293B]/30">
                {["Reference ID", "Service Category", "Citizen Name", "Timestamp", "Current Status"].map((h) => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-slate-500 italic text-sm">Synchronizing data...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-slate-500 italic text-sm">No recent data found</td></tr>
              ) : (
                recent.map((r) => (
                  <tr key={r.application_id} className="hover:bg-slate-800/30 transition-colors cursor-pointer group" onClick={() => navigate("/applications")}>
                    <td className="px-6 py-4 font-mono text-[11px] font-bold text-violet-400">{r.application_id}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors capitalize">
                        {r.certificate_name?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-400">{r.applicant_name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 uppercase">{fmt(r.submitted_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border pill ${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}