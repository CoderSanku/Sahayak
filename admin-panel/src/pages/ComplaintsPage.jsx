import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import StatusModal from "../components/StatusModal";
import { motion, AnimatePresence } from "framer-motion";

import {
  RefreshCw,
  Search,
  ArrowUpDown,
  Pencil,
  AlertCircle,
  Filter,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// REPLACE the existing STATUS_OPTIONS with this
const STATUS_OPTIONS = [
  {
    value: "pending", label: "Pending", emoji: "⏳",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-amber-500 text-white border-amber-500",
    inactive: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  {
    value: "reviewed", label: "Reviewed", emoji: "🔍",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    active: "bg-indigo-500 text-white border-indigo-500",
    inactive: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  },
  {
    value: "resolved", label: "Resolved", emoji: "✅",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    value: "dismissed", label: "Dismissed", emoji: "❌",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    active: "bg-rose-500 text-white border-rose-500",
    inactive: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  },
];

const statusColor = (s) => {
  const found = STATUS_OPTIONS.find(o => o.value === s);
  return found ? found.color : "bg-slate-50 text-slate-700 border-slate-200";
};

const CODE_LABELS = {
  C1: { emoji: "⏳", label: "Delay" },
  C2: { emoji: "❌", label: "Rejection" },
  C3: { emoji: "✏️", label: "Correction" },
  C4: { emoji: "🚫", label: "Misconduct" },
  C5: { emoji: "💻", label: "Portal Issue" },
  C6: { emoji: "📝", label: "General" },
};

const PAGE_SIZE = 15;

export default function ComplaintsPage() {
  const [searchParams] = useSearchParams();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [sortDesc, setSortDesc] = useState(true);

  const [modalRow, setModalRow] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("complaints")
      .select(
        "complaint_id, complaint_code, complaint_type, applicant_name, phone, issue_details, letter_text, language, status, submitted_at",
        { count: "exact" }
      )
      .order("submitted_at", { ascending: !sortDesc })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search.trim()) {
      q = q.or(`complaint_id.ilike.%${search}%,applicant_name.ilike.%${search}%`);
    }

    const { data, count } = await q;
    setRows(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, statusFilter, sortDesc]);

  useEffect(() => { setPage(0); }, [search, statusFilter]);
  useEffect(() => { load(); }, [load]);

  async function handleSave({ status, admin_note }) {
    setSaving(true);
    await supabase
      .from("complaints")
      .update({ status, admin_note })
      .eq("complaint_id", modalRow.complaint_id);
    setModalRow(null);
    load();
    setSaving(false);
  }

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">
            Complaints
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} total complaints
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={load}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="bg-white/60 backdrop-blur-md border border-blue-200/70 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ✅ REPLACED THIS SECTION */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />

            {/* All button */}
            <Button
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={`text-xs font-semibold border transition-all ${statusFilter === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
            >
              All
            </Button>

            {/* Status buttons from STATUS_OPTIONS */}
            {STATUS_OPTIONS.map(({ value, label, emoji, active, inactive }) => (
              <Button
                key={value}
                size="sm"
                onClick={() => setStatusFilter(value)}
                className={`text-xs font-semibold border transition-all ${statusFilter === value ? active : inactive
                  }`}
              >
                {emoji} {label}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDesc((p) => !p)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
            {sortDesc ? "Newest" : "Oldest"}
          </Button>

        </CardContent>
      </Card>
      {/* Table */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <div className="text-sm text-slate-400">Loading complaints...</div>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm text-slate-500">No complaints found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                      <tr className="bg-blue-50/80 border-b border-blue-100">
                    {["ID", "Type", "Applicant", "Phone", "Date", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const codeInfo = CODE_LABELS[r.complaint_code] || { emoji: "📋", label: r.complaint_code || "—" };
                    return (
                      <motion.tr
                        key={r.complaint_id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 text-xs whitespace-nowrap">
                          {r.complaint_id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                            {codeInfo.emoji} {codeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {r.applicant_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.phone || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {fmt(r.submitted_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] capitalize px-2.5 py-0.5 border font-semibold ${statusColor(r.status)}`}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setModalRow(r)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 opacity-70 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </motion.div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-100/50">
              <div className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} · {total} records
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  ← Prev
                </Button>
                <Button
                  size="sm" variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StatusModal
        open={!!modalRow}
        onClose={() => setModalRow(null)}
        onSave={handleSave}
        saving={saving}
        row={modalRow}
        statusOptions={STATUS_OPTIONS}
      />
    </div>
  );
}