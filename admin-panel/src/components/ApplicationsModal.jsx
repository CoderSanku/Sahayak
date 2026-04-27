import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { supabase } from "../lib/supabase.js";

import {
    X, Upload, CheckCircle, XCircle, FileText,
    Eye, Save, Download, Loader2, Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
    pending: { emoji: "⏳", label: "Pending", color: "bg-amber-500 text-white border-amber-500", inactive: "bg-amber-500/15 text-amber-300 border-amber-400/40 hover:bg-amber-500/30" },
    approved: { emoji: "✅", label: "Approved", color: "bg-blue-500 text-white border-blue-500", inactive: "bg-blue-500/15 text-blue-300 border-blue-400/40 hover:bg-blue-500/30" },
    generated: { emoji: "🎉", label: "Generated", color: "bg-emerald-500 text-white border-emerald-500", inactive: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30" },
    rejected: { emoji: "❌", label: "Rejected", color: "bg-rose-500 text-white border-rose-500", inactive: "bg-rose-500/15 text-rose-300 border-rose-400/40 hover:bg-rose-500/30" },
};

export default function ApplicationsModal(props) {
    const {
        open, row, onClose, onSave, saving,
        onUploadCertificate, uploadingCert,
        pdfViewerUrl, setPdfViewerUrl,
        loadDocs, docs, docsLoading,
    } = props;

    const [status, setStatus] = useState("pending");
    const [note, setNote] = useState("");
    const [tab, setTab] = useState("details");
    const [downloadingZip, setDownloadingZip] = useState(false);
    const [certUrl, setCertUrl] = useState(null);
    const [certLoading, setCertLoading] = useState(false);

    // ✅ Update local state whenever row changes
    useEffect(() => {
        if (row) {
            setStatus(row.status || "pending");
            setNote(row.admin_note || "");
            setCertUrl(row.certificate_url || null);
        }
    }, [row]);

    // ✅ Load docs when modal opens
    useEffect(() => {
        if (row?.application_id && open) {
            loadDocs(row.application_id);
        }
    }, [row?.application_id, open]);

    // ✅ Reset tab when modal closes
    useEffect(() => {
        if (!open) {
            setTab("details");
        }
    }, [open]);

    async function resolveUrl(fileUrl) {
        if (!fileUrl) return null;
        if (fileUrl.startsWith("http")) return fileUrl;
        const { data, error } = await supabase.storage
            .from("application-docs")
            .createSignedUrl(fileUrl, 60 * 60);
        return error || !data?.signedUrl ? null : data.signedUrl;
    }

    async function handleViewCert() {
        setCertLoading(true);
        const url = await resolveUrl(certUrl);
        if (url) setPdfViewerUrl(url);
        else alert("Could not load certificate URL.");
        setCertLoading(false);
    }

    // ✅ FIX: ZIP document list shows requirement name not ID
    async function handleDownloadZip() {
        const docsToDownload = docs.filter((d) => d.file_name);
        if (docsToDownload.length === 0) { alert("No documents to download."); return; }
        setDownloadingZip(true);
        try {
            const zip = new JSZip();
            const appId = row.application_id;
            const details = [
                `Application ID  : ${appId}`,
                `Certificate     : ${row.certificate_name || "—"}`,
                `Applicant       : ${row.applicant_name || "—"}`,
                `Phone           : ${row.phone || "—"}`,
                `Email           : ${row.email || "—"}`,
                `Taluka          : ${row.taluka || "—"}`,
                `Village         : ${row.village || "—"}`,
                `Status          : ${row.status || "—"}`,
                `Submitted       : ${row.submitted_at ? new Date(row.submitted_at).toLocaleString("en-IN") : "—"}`,
                `Admin Note      : ${row.admin_note || "—"}`,
                ``, `--- Documents ---`,
                ...docsToDownload.map((d, i) => `${i + 1}. ${d.file_name}`),
            ].join("\n");
            zip.file("details.txt", details);

            for (const doc of docsToDownload) {
                const url = await resolveUrl(doc.file_url);
                if (!url) continue;
                try {
                    const res = await fetch(url);
                    if (!res.ok) continue;
                    const blob = await res.blob();

                    // ✅ FIX: Get the correct extension from the actual file URL
                    // The file_url contains the original uploaded filename with extension
                    let fileName = doc.file_name; // requirement name e.g. "Mill Workers Proof"

                    // Extract extension from the file_url path
                    const urlPath = doc.file_url.split("?")[0]; // remove query params
                    const originalName = urlPath.split("/").pop(); // get filename from path
                    const ext = originalName.includes(".")
                        ? "." + originalName.split(".").pop().toLowerCase()
                        : "";

                    // ✅ Combine requirement name + original extension
                    // e.g. "Mill Workers Proof.pdf"
                    const zipFileName = ext && !fileName.toLowerCase().endsWith(ext)
                        ? fileName + ext
                        : fileName;

                    zip.file(zipFileName, blob);
                } catch (err) { console.error("Failed to fetch:", doc.file_name, err); }
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url; a.download = `${appId}_documents.zip`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        } catch (err) { console.error("ZIP error:", err); alert("Failed to create ZIP."); }
        setDownloadingZip(false);
    }

    if (!open || !row) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.93, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.93, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl flex flex-col"
                    style={{ background: "rgba(30, 58, 95, 0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
                >
                    {/* HEADER */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0"
                        style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div>
                            <div className="text-sm font-bold text-white">Application Details</div>
                            <div className="text-xs text-blue-200/50 mt-0.5">ID: {row.application_id || row.id}</div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 transition-colors"
                        >
                            <X className="w-4 h-4 text-white/80" />
                        </motion.button>
                    </div>

                    {/* TABS */}
                    <div className="flex border-b border-white/10 shrink-0"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        {["details", "documents"].map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-6 py-3 text-sm font-semibold capitalize transition-all relative
                                    ${tab === t ? "text-white" : "text-white/40 hover:text-white/70"}`}
                            >
                                {t}
                                {tab === t && (
                                    <motion.div layoutId="modalTab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-400 rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">

                        {/* DETAILS TAB */}
                        {tab === "details" && (
                            <div className="space-y-5">

                                {/* Info Grid — filter hidden fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(row)
                                        .filter(([key]) => !["certificate_url", "admin_note"].includes(key))
                                        .map(([key, value]) => (
                                            <div key={key} className="p-3 rounded-xl border border-white/10"
                                                style={{ background: "rgba(255,255,255,0.06)" }}>
                                                <div className="text-[10px] text-blue-200/50 mb-1 uppercase tracking-wider font-semibold">
                                                    {key.replace(/_/g, " ")}
                                                </div>
                                                <div className="text-white/90 font-medium break-words text-sm">
                                                    {String(value || "—")}
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* STATUS BUTTONS */}
                                <div>
                                    <div className="text-xs text-blue-200/60 mb-3 font-semibold uppercase tracking-wider">
                                        Update Status
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                                            <motion.button
                                                key={value}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setStatus(value)}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all
                                                    ${status === value ? config.color : config.inactive}`}
                                            >
                                                {config.emoji} {config.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* ADMIN NOTE */}
                                <div>
                                    <div className="text-xs text-blue-200/60 mb-2 font-semibold uppercase tracking-wider">
                                        Admin Note
                                    </div>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={3}
                                        placeholder="Add a note..."
                                        className="w-full p-3 rounded-xl border border-white/10 text-white/90 text-sm
                                                   outline-none focus:border-blue-400/50 resize-none transition-colors
                                                   placeholder:text-white/30"
                                        style={{ background: "rgba(255,255,255,0.06)" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* DOCUMENTS TAB */}
                        {tab === "documents" && (
                            <div className="space-y-4">

                                {/* Top bar + ZIP */}
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-blue-200/60 font-semibold uppercase tracking-wider">
                                        Uploaded Documents ({docs.length})
                                    </div>
                                    {docs.length > 0 && (
                                        <motion.button
                                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                            onClick={handleDownloadZip}
                                            disabled={downloadingZip}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors
                                                ${downloadingZip
                                                    ? "bg-white/10 text-white/40 border-white/10 cursor-not-allowed"
                                                    : "bg-emerald-500/80 hover:bg-emerald-400/80 text-white border-emerald-300/30 shadow-lg shadow-emerald-500/20"}`}
                                        >
                                            {downloadingZip
                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Preparing...</>
                                                : <><Download className="w-3.5 h-3.5" />Download All</>}
                                        </motion.button>
                                    )}
                                </div>

                                {/* Certificate Banner */}
                                {certUrl && (
                                    <div className="p-4 rounded-xl border-2 border-emerald-400/40 flex items-center justify-between gap-3"
                                        style={{ background: "rgba(16,185,129,0.12)" }}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 rounded-lg bg-emerald-500/20 shrink-0">
                                                <Award className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Certificate Uploaded
                                                </div>
                                                <div className="text-xs text-emerald-400/70 mt-0.5">
                                                    User can now download this certificate
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleViewCert}
                                            disabled={certLoading}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shrink-0 transition-colors"
                                            style={{ background: "rgba(16,185,129,0.5)", cursor: certLoading ? "not-allowed" : "pointer" }}
                                        >
                                            {certLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                            View
                                        </button>
                                    </div>
                                )}

                                {/* Document List */}
                                {docsLoading ? (
                                    <div className="py-8 text-center">
                                        <div className="w-6 h-6 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
                                        <div className="text-sm text-white/40">Loading documents...</div>
                                    </div>
                                ) : docs.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <FileText className="w-10 h-10 text-white/20 mx-auto mb-2" />
                                        <div className="text-sm text-white/40">No documents found</div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {docs.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                                                style={{ background: "rgba(255,255,255,0.06)" }}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <FileText className="w-4 h-4 text-blue-300 shrink-0" />
                                                    {/* ✅ Shows requirement name (file_name stored from DocTracker) */}
                                                    <div className="min-w-0">
                                                        <div className="text-sm text-white/80 font-medium truncate">
                                                            {doc.file_name || "Document"}
                                                        </div>
                                                        <div className="text-xs text-white/30 truncate">
                                                            {doc.doc_id || ""}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setPdfViewerUrl(doc.file_url)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-300 hover:text-white text-xs font-semibold shrink-0 transition-colors hover:bg-blue-500/20"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Certificate */}
                                <div className="pt-3 border-t border-white/10">
                                    <div className="text-xs text-blue-200/60 mb-3 font-semibold uppercase tracking-wider">
                                        {certUrl ? "🔄 Replace Certificate" : "📤 Upload Certificate"}
                                    </div>
                                    <label style={{ cursor: uploadingCert ? "not-allowed" : "pointer" }}>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={onUploadCertificate}
                                            className="hidden"
                                            disabled={uploadingCert}
                                        />
                                        <div
                                            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
                                            style={{
                                                background: uploadingCert
                                                    ? "rgba(16,185,129,0.2)"
                                                    : certUrl
                                                        ? "linear-gradient(135deg, #065f46 0%, #059669 100%)"
                                                        : "linear-gradient(135deg, #047857 0%, #10b981 100%)",
                                                boxShadow: uploadingCert ? "none" : "0 4px 15px rgba(16,185,129,0.4)",
                                                opacity: uploadingCert ? 0.6 : 1,
                                                cursor: uploadingCert ? "not-allowed" : "pointer",
                                                border: "1px solid rgba(52,211,153,0.3)",
                                            }}
                                        >
                                            {uploadingCert
                                                ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
                                                : <><Upload className="w-4 h-4" />{certUrl ? "Replace Certificate" : "Upload Certificate"}</>
                                            }
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="p-5 border-t border-white/10 flex justify-end gap-3 shrink-0"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                variant="ghost"
                                onClick={() => onSave({ ...row, status: "rejected", admin_note: note })}
                                disabled={saving}
                                className="border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 rounded-xl"
                            >
                                <XCircle className="w-4 h-4 mr-2" />Reject
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                onClick={() => onSave({ ...row, status, admin_note: note })}
                                disabled={saving}
                                className="bg-emerald-500/80 hover:bg-emerald-400/80 text-white font-semibold rounded-xl border border-emerald-300/30 shadow-lg shadow-emerald-500/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}