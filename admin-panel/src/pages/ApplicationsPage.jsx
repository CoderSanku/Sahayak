import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import PdfModal from "../components/PdfModal";
import {
  Download, RefreshCw, Search, ArrowUpDown,
  Pencil, FileText, Filter,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ApplicationsModal from "@/components/ApplicationsModal.jsx";

function downloadCSV(data, filename = "applications.csv") {
  if (!data || data.length === 0) return;
  const headers = ["Application ID", "Certificate", "Applicant", "Phone", "Email", "Taluka", "Village", "Status", "Submitted Date"];
  const rows = data.map(r => [
    r.application_id, r.certificate_name || "", r.applicant_name || "",
    r.phone || "", r.email || "", r.taluka || "", r.village || "",
    r.status || "", r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-IN") : ""
  ]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function exportAllApplications() {
  const { data, error } = await supabase
    .from("applications")
    .select("application_id, certificate_name, applicant_name, phone, email, taluka, village, status, submitted_at")
    .order("submitted_at", { ascending: false });
  if (!error && data) {
    downloadCSV(data, `applications_${new Date().toISOString().split("T")[0]}.csv`);
  }
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", emoji: "⏳", color: "bg-amber-50 text-amber-700 border-amber-200", active: "bg-amber-500 text-white border-amber-500", inactive: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { value: "approved", label: "Approved", emoji: "✅", color: "bg-blue-50 text-blue-700 border-blue-200", active: "bg-blue-500 text-white border-blue-500", inactive: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { value: "generated", label: "Generated", emoji: "🎉", color: "bg-emerald-50 text-emerald-700 border-emerald-200", active: "bg-emerald-500 text-white border-emerald-500", inactive: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { value: "rejected", label: "Rejected", emoji: "❌", color: "bg-rose-50 text-rose-700 border-rose-200", active: "bg-rose-500 text-white border-rose-500", inactive: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
];

const statusColor = (s) => {
  const found = STATUS_OPTIONS.find(o => o.value === s);
  return found ? found.color : "bg-slate-50 text-slate-700 border-slate-200";
};

const PAGE_SIZE = 15;

export default function ApplicationsPage() {
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
  const [toast, setToast] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  async function loadDocs(applicationId) {
    setDocsLoading(true);
    const { data, error } = await supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId);
    if (error) { console.error("Error loading docs:", error); setDocs([]); }
    else { setDocs(data || []); }
    setDocsLoading(false);
  }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ FIX 1: modalRow REMOVED from dependencies — was causing infinite loop
  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("applications")
      .select(
        "application_id, certificate_name, applicant_name, phone, email, taluka, village, status, admin_note, submitted_at, certificate_url",
        { count: "exact" }
      )
      .order("submitted_at", { ascending: !sortDesc })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search.trim()) {
      q = q.or(`application_id.ilike.%${search}%,applicant_name.ilike.%${search}%,certificate_name.ilike.%${search}%`);
    }

    const { data, count, error } = await q;
    if (!error) {
      setRows(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [page, search, statusFilter, sortDesc]); // ✅ No modalRow here

  useEffect(() => { setPage(0); }, [search, statusFilter]);
  useEffect(() => { load(); }, [load]);

  // ✅ FIX 2: handleSave — close modal + refresh table
  async function handleSave({ status, admin_note }) {
    setSaving(true);
    const { error } = await supabase
      .from("applications")
      .update({ status, admin_note })
      .eq("application_id", modalRow.application_id);

    if (error) {
      showToast("Failed to update. Check Supabase RLS policies.", false);
    } else {
      showToast("Application updated successfully.");
      setModalRow(null); // ✅ Close modal properly
      load();            // ✅ Refresh table
    }
    setSaving(false);
  }

  // ✅ FIX 3: Upload — update modalRow locally, keep modal open
  async function handleUploadCertificate(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !modalRow) return;

    setUploadingCert(true);
    const filePath = `certificates/${modalRow.application_id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("application-docs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast("Failed to upload: " + uploadError.message, false);
      setUploadingCert(false);
      return;
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from("application-docs")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    const fileUrl = signError
      ? supabase.storage.from("application-docs").getPublicUrl(filePath).data.publicUrl
      : signedData.signedUrl;

    const { error: dbError } = await supabase
      .from("applications")
      .update({ status: "generated", certificate_url: fileUrl })
      .eq("application_id", modalRow.application_id);

    if (dbError) {
      showToast("Uploaded but failed to save URL: " + dbError.message, false);
      setUploadingCert(false);
      return;
    }

    // ✅ Update modalRow locally without closing
    setModalRow(prev => prev ? {
      ...prev,
      status: "generated",
      certificate_url: fileUrl,
    } : null);

    showToast("✅ Certificate uploaded successfully!");
    load();
    setUploadingCert(false);
  }

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 fade-in">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg
              ${toast.ok
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Applications</h1>
          <p className="text-sm text-slate-500 mt-1">{total} total · click edit to update status</p>
        </div>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={exportAllApplications} className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-sm">
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={load} className="border-slate-200 text-slate-600 hover:bg-slate-50">
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/60 backdrop-blur-md border border-blue-200/70 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, or certificate..."
              className="pl-9 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <Button size="sm" onClick={() => setStatusFilter("all")}
              className={`text-xs font-semibold border transition-all ${statusFilter === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
            >All</Button>
            {STATUS_OPTIONS.map(({ value, label, emoji, active, inactive }) => (
              <Button key={value} size="sm" onClick={() => setStatusFilter(value)}
                className={`text-xs font-semibold border transition-all ${statusFilter === value ? active : inactive}`}
              >{emoji} {label}</Button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => setSortDesc((p) => !p)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
            {sortDesc ? "Newest" : "Oldest"}
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/60 backdrop-blur-md border border-blue-200/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-slate-400">Loading applications...</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm text-slate-500">No applications found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50/80 border-b border-blue-100">
                  {["Application ID", "Certificate", "Applicant", "Phone", "Taluka", "Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={r.application_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 text-xs whitespace-nowrap">{r.application_id}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">{r.certificate_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.applicant_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{r.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{r.taluka || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(r.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] capitalize px-2.5 py-0.5 border font-semibold ${statusColor(r.status)}`}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="sm" variant="outline"
                          onClick={() => setModalRow(r)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="w-3 h-3 mr-1" />Edit
                        </Button>
                      </motion.div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-100/50">
            <div className="text-xs text-slate-500">Page {page + 1} of {totalPages} · {total} records</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="border-slate-200 text-slate-600 disabled:opacity-40">← Prev</Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="border-slate-200 text-slate-600 disabled:opacity-40">Next →</Button>
            </div>
          </div>
        )}
      </Card>

      <ApplicationsModal
        open={!!modalRow}
        row={modalRow}
        onClose={() => setModalRow(null)}
        onSave={handleSave}
        saving={saving}
        onUploadCertificate={handleUploadCertificate}
        uploadingCert={uploadingCert}
        pdfViewerUrl={pdfViewerUrl}
        setPdfViewerUrl={setPdfViewerUrl}
        loadDocs={loadDocs}
        docs={docs}
        docsLoading={docsLoading}
      />

      <PdfModal
        url={pdfViewerUrl}
        title="📄 Document Viewer"
        onClose={() => setPdfViewerUrl(null)}
      />
    </div>
  );
}