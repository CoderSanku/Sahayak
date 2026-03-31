import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import PdfModal from "../components/PdfModal.jsx";
import JSZip from "jszip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, RefreshCw, Search, Filter, 
  ChevronLeft, ChevronRight, FileText, 
  ExternalLink, Upload, Save, X, Info, 
  CheckCircle, Clock, AlertTriangle, FileCheck
} from "lucide-react";

// --- Utility Functions ---
function downloadCSV(data, filename = "applications.csv") {
  if (!data || data.length === 0) return;
  const headers = ["Application ID", "Certificate", "Applicant", "Phone", "Email", "Taluka", "Village", "Status", "Submitted Date"];
  const rows = data.map(r => [
    r.application_id,
    r.certificate_name || "",
    r.applicant_name || "",
    r.phone || "",
    r.email || "",
    r.taluka || "",
    r.village || "",
    r.status || "",
    r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-IN") : ""
  ]);
  
  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending",   icon: Clock,          color: "text-amber-400",  bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { value: "approved",  label: "Approved",  icon: CheckCircle,    color: "text-blue-400",   bg: "bg-blue-400/10",  border: "border-blue-400/20" },
  { value: "generated", label: "Generated", icon: FileCheck,      color: "text-emerald-400",bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { value: "rejected",  label: "Rejected",  icon: AlertTriangle,  color: "text-rose-400",   bg: "bg-rose-400/10",  border: "border-rose-400/20" },
];

const PAGE_SIZE = 12;

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

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("applications")
      .select("application_id, certificate_name, applicant_name, phone, email, taluka, village, status, admin_note, submitted_at", { count: "exact" })
      .order("submitted_at", { ascending: !sortDesc })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search.trim()) {
      q = q.or(`application_id.ilike.%${search}%,applicant_name.ilike.%${search}%,certificate_name.ilike.%${search}%`);
    }

    const { data, count, error } = await q;
    if (!error) { setRows(data || []); setTotal(count || 0); }
    setLoading(false);
  }, [page, search, statusFilter, sortDesc]);

  useEffect(() => { setPage(0); }, [search, statusFilter]);
  useEffect(() => { load(); }, [load]);

  async function handleExport() {
    const { data } = await supabase.from("applications").select("*").order("submitted_at", { ascending: false });
    if (data) downloadCSV(data, `Export_${new Date().toISOString().split('T')[0]}.csv`);
  }

  async function handleSave({ status, admin_note }) {
    setSaving(true);
    const { error } = await supabase.from("applications").update({ status, admin_note }).eq("application_id", modalRow.application_id);
    if (error) showToast("Update failed", false);
    else { showToast("Application updated"); setModalRow(null); load(); }
    setSaving(false);
  }

  async function handleUploadCertificate(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !modalRow) return;

    setUploadingCert(true);
    const filePath = `certificates/${modalRow.application_id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("application-docs").upload(filePath, file, { upsert: true });

    if (uploadError) { showToast("Upload error", false); setUploadingCert(false); return; }

    const { data: signed } = await supabase.storage.from("application-docs").createSignedUrl(filePath, 31536000);
    const fileUrl = signed?.signedUrl;

    const { error: dbError } = await supabase.from("applications").update({ status: "generated", certificate_url: fileUrl }).eq("application_id", modalRow.application_id);
    if (dbError) showToast("Database sync failed", false);
    else { showToast("Certificate issued successfully"); setModalRow(null); load(); }
    setUploadingCert(false);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
          >
            {toast.ok ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Applications</h1>
          <p className="text-slate-500 text-sm font-medium">Manage and verify citizen certificate requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={load} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Name or Certificate..." 
            className="w-full bg-[#0F172A] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          <button 
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${statusFilter === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            All Requests
          </button>
          {STATUS_OPTIONS.map(opt => (
            <button 
              key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${statusFilter === opt.value ? `${opt.bg} ${opt.color} ${opt.border}` : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1E293B]/30 border-b border-slate-800">
                {["Application ID", "Certificate", "Applicant", "Region", "Date", "Status", ""].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center text-slate-500 text-sm italic">Loading database records...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-slate-500 text-sm italic">No records matching your filters</td></tr>
              ) : rows.map(r => (
                <tr key={r.application_id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-400">{r.application_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-200 font-medium">{r.certificate_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{r.applicant_name}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{r.taluka}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(r.submitted_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${STATUS_OPTIONS.find(o => o.value === r.status)?.bg || 'bg-slate-800'} ${STATUS_OPTIONS.find(o => o.value === r.status)?.color || 'text-slate-400'} ${STATUS_OPTIONS.find(o => o.value === r.status)?.border || 'border-slate-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setModalRow(r)}
                      className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-[#1E293B]/20 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Showing {rows.length} of {total} applications</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-all"
            ><ChevronLeft className="w-4 h-4" /></button>
            <button 
              disabled={page >= Math.ceil(total / PAGE_SIZE) - 1} onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-all"
            ><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <ApplicationsModal
        open={!!modalRow}
        row={modalRow}
        onClose={() => setModalRow(null)}
        onSave={handleSave}
        saving={saving}
        onUploadCertificate={handleUploadCertificate}
        uploadingCert={uploadingCert}
        setPdfViewerUrl={setPdfViewerUrl}
      />

      <PdfModal
        url={pdfViewerUrl}
        title="Document Preview"
        onClose={() => setPdfViewerUrl(null)}
      />
    </div>
  );
}

// --- Internal Modal Component ---
function ApplicationsModal({ open, row, onClose, onSave, saving, onUploadCertificate, uploadingCert, setPdfViewerUrl }) {
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    if (row) { setStatus(row.status || "pending"); setNote(row.admin_note || ""); loadDocs(row.application_id); }
  }, [row, open]);

  async function loadDocs(id) {
    setDocsLoading(true);
    const { data } = await supabase.from("application_documents").select("*").eq("application_id", id);
    setDocs(data || []);
    setDocsLoading(false);
  }

  async function handleZip() {
    setDownloadingZip(true);
    const zip = new JSZip();
    for (const d of docs) {
      if (!d.file_url) continue;
      const res = await fetch(d.file_url.startsWith('http') ? d.file_url : (await supabase.storage.from("application-docs").createSignedUrl(`${row.application_id}/${d.doc_id}_${d.file_name}`, 60)).data.signedUrl);
      const blob = await res.blob();
      zip.file(d.file_name, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(content); a.download = `${row.application_id}_files.zip`; a.click();
    setDownloadingZip(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-[#1E293B]/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><FileText className="w-5 h-5" /></div>
            <h2 className="text-white font-bold">Review Application</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Applicant</p><p className="text-sm font-semibold">{row.applicant_name}</p></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Service</p><p className="text-sm font-semibold">{row.certificate_name}</p></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Phone</p><p className="text-sm font-semibold">{row.phone}</p></div>
            <div><p className="text-[10px] uppercase font-bold text-slate-500">Location</p><p className="text-sm font-semibold">{row.taluka}, {row.village}</p></div>
          </div>

          {/* Docs Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Info className="w-3 h-3" /> Submitted Evidence</h3>
              <button onClick={handleZip} disabled={downloadingZip} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-tighter transition-all">
                {downloadingZip ? "Preparing..." : <><Download className="w-3 h-3" /> Get All Files</>}
              </button>
            </div>
            <div className="space-y-2">
              {docsLoading ? <div className="animate-pulse h-20 bg-slate-800 rounded-xl" /> : docs.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
                  <div><p className="text-xs font-bold text-slate-200">{d.doc_id.replace(/_/g, " ")}</p><p className="text-[10px] text-slate-500">{d.file_name}</p></div>
                  <button onClick={() => setPdfViewerUrl(d.file_url)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] font-bold transition-all uppercase">View</button>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Generation Action */}
          {status === "generated" && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div><h4 className="text-sm font-bold text-emerald-400">Ready for Issuance</h4><p className="text-[10px] text-emerald-500/70">Upload the final signed document.</p></div>
              <label className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" /> {uploadingCert ? "Uploading..." : "Upload Final"}
                <input type="file" className="hidden" onChange={onUploadCertificate} disabled={uploadingCert} />
              </label>
            </div>
          )}

          {/* Workflow Status */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-500">Update Workflow</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button 
                  key={opt.value} onClick={() => setStatus(opt.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border-2 ${status === opt.value ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-slate-500">Administrator Remarks</label>
            <textarea 
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Internal notes or reason for rejection..."
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-[#1E293B]/30 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-all">Cancel</button>
          <button 
            onClick={() => onSave({ status, admin_note: note })} disabled={saving}
            className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {saving ? "Syncing..." : <><Save className="w-4 h-4" /> Save Update</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}