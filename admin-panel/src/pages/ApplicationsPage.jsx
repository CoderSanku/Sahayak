// src/pages/ApplicationsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import PdfModal from "../components/PdfModal.jsx";
import JSZip from "jszip";

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

async function exportAllApplications() {
  const { data, error } = await supabase
    .from("applications")
    .select("application_id, certificate_name, applicant_name, phone, email, taluka, village, status, submitted_at")
    .order("submitted_at", { ascending: false });
  
  if (!error && data) {
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(data, `applications_${date}.csv`);
  }
}

const STATUS_OPTIONS = [
  { value: "pending",   label: "⏳ Pending",   color: "#F59E0B" },
  { value: "approved",  label: "✅ Approved",  color: "#2563EB" },
  { value: "generated", label: "🎉 Generated", color: "#16A34A" },
  { value: "rejected",  label: "❌ Rejected",  color: "#DC2626" },
];

const PAGE_SIZE = 15;

export default function ApplicationsPage() {
  const [searchParams] = useSearchParams();

  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [sortDesc, setSortDesc]   = useState(true);

  // Modal state
  const [modalRow, setModalRow]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
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
      .select(
        "application_id, certificate_name, applicant_name, phone, email, taluka, village, status, admin_note, submitted_at",
        { count: "exact" }
      )
      .order("submitted_at", { ascending: !sortDesc })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search.trim()) {
      q = q.or(
        `application_id.ilike.%${search}%,applicant_name.ilike.%${search}%,certificate_name.ilike.%${search}%`
      );
    }

    const { data, count, error } = await q;
    if (!error) { setRows(data || []); setTotal(count || 0); }
    setLoading(false);
  }, [page, search, statusFilter, sortDesc]);

  useEffect(() => { setPage(0); }, [search, statusFilter]);
  useEffect(() => { load(); }, [load]);

  async function handleSave({ status, admin_note }) {
    setSaving(true);
    const idField = "application_id";
    const { error } = await supabase
      .from("applications")
      .update({ status, admin_note })
      .eq(idField, modalRow[idField]);

    if (error) {
      showToast("❌ Failed to update. Check Supabase RLS policies.", false);
    } else {
      showToast("✅ Application updated successfully.");
      setModalRow(null);
      load();
    }
    setSaving(false);
  }

  async function handleUploadCertificate(e) {
    const file = e.target.files?.[0];
    // Reset input so re-selecting the same file fires onChange again
    e.target.value = "";
    if (!file || !modalRow) return;

    setUploadingCert(true);
    const filePath = `certificates/${modalRow.application_id}/${file.name}`;

    const { error: uploadError } = await supabase
      .storage
      .from("application-docs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      showToast("❌ Failed to upload: " + uploadError.message, false);
      setUploadingCert(false);
      return;
    }

    // Use a signed URL so it works even if the bucket is private
    const { data: signedData, error: signError } = await supabase
      .storage
      .from("application-docs")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    const fileUrl = signError
      ? supabase.storage.from("application-docs").getPublicUrl(filePath).data.publicUrl
      : signedData.signedUrl;

    const { error: dbError } = await supabase
      .from("applications")
      .update({ status: "generated", certificate_url: fileUrl })
      .eq("application_id", modalRow.application_id);

    if (dbError) {
      console.error("DB update error:", dbError);
      showToast("⚠️ Uploaded but failed to save URL: " + dbError.message, false);
    } else {
      showToast("✅ Certificate uploaded and status set to Generated");
      setModalRow(null);
      load();
    }
    setUploadingCert(false);
  }

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 3000,
          background: toast.ok ? "#F0FDF4" : "#FEF2F2",
          border: `1px solid ${toast.ok ? "#86EFAC" : "#FECACA"}`,
          color: toast.ok ? "#15803D" : "#B91C1C",
          padding: "12px 18px", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A237E" }}>Applications</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {total} total · click any row to update status
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={exportAllApplications}
            style={{
              padding: "9px 16px", background: "linear-gradient(135deg, #16A34A, #15803D)",
              border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            📥 Download Excel
          </button>
          <button
            onClick={load}
            style={{
              padding: "9px 16px", background: "#F9FAFB",
              border: "1.5px solid #E5E7EB", borderRadius: 10,
              fontSize: 12, fontWeight: 700, color: "#374151",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, name, certificate…"
          style={{
            flex: 1, minWidth: 200, padding: "9px 14px",
            border: "1.5px solid #E5E7EB", borderRadius: 10,
            fontSize: 13, color: "#1C1C2E", background: "#fff", outline: "none",
          }}
        />
        {/* Status filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${statusFilter === value ? "#0048A8" : "#E5E7EB"}`,
                background: statusFilter === value ? "#0048A8" : "#fff",
                color: statusFilter === value ? "#fff" : "#6B7280",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Sort toggle */}
        <button
          onClick={() => setSortDesc((p) => !p)}
          style={{
            padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
            border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280",
          }}
        >
          {sortDesc ? "⬇ Newest" : "⬆ Oldest"}
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: 14,
        border: "1.5px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
            No applications found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                  {["Application ID", "Certificate", "Applicant", "Phone", "Taluka", "Date", "Status", ""].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 12px",
                      fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                      textTransform: "uppercase", letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.application_id}
                    style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 700, color: "#0048A8", fontSize: 11, whiteSpace: "nowrap" }}>
                      {r.application_id}
                    </td>
                    <td style={{ padding: "11px 12px", color: "#374151", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.certificate_name || "—"}
                    </td>
                    <td style={{ padding: "11px 12px", color: "#374151", whiteSpace: "nowrap" }}>
                      {r.applicant_name || "—"}
                    </td>
                    <td style={{ padding: "11px 12px", color: "#6B7280", whiteSpace: "nowrap" }}>
                      {r.phone || "—"}
                    </td>
                    <td style={{ padding: "11px 12px", color: "#6B7280", whiteSpace: "nowrap" }}>
                      {r.taluka || "—"}
                    </td>
                    <td style={{ padding: "11px 12px", color: "#6B7280", whiteSpace: "nowrap" }}>
                      {fmt(r.submitted_at)}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span className={`pill ${r.status}`}>{r.status}</span>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <button
                        onClick={() => setModalRow(r)}
                        style={{
                          padding: "5px 12px", borderRadius: 8,
                          background: "linear-gradient(135deg, #1A237E, #0048A8)",
                          border: "none", color: "#fff",
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Edit ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderTop: "1px solid #F3F4F6",
          }}>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              Page {page + 1} of {totalPages} · {total} records
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: "1.5px solid #E5E7EB",
                  background: page === 0 ? "#F9FAFB" : "#fff",
                  color: page === 0 ? "#D1D5DB" : "#374151",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                }}
              >← Prev</button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: "1.5px solid #E5E7EB",
                  background: page >= totalPages - 1 ? "#F9FAFB" : "#fff",
                  color: page >= totalPages - 1 ? "#D1D5DB" : "#374151",
                  cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>

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
      />

      <PdfModal
        url={pdfViewerUrl}
        title="📄 Document Viewer"
        onClose={() => setPdfViewerUrl(null)}
      />
    </div>
  );
}

function ApplicationsModal(props) {
  const { open, row, onClose, onSave, saving, onUploadCertificate, uploadingCert, pdfViewerUrl, setPdfViewerUrl } = props;
  const [status, setStatus] = useState(row ? row.status : "pending");
  const [note, setNote] = useState(row ? row.admin_note : "");
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    if (row) {
      setStatus(row.status || "pending");
      setNote(row.admin_note || "");
    }
  }, [row]);

  useEffect(() => {
    if (row?.application_id && open) {
      loadDocs(row.application_id);
    }
  }, [row?.application_id, open]);

  // Download all documents as a ZIP
  async function handleDownloadAllDocs() {
    const docsToDownload = docs.filter(d => d.file_name);
    if (docsToDownload.length === 0) { alert("No documents to download"); return; }
    
    setDownloadingAll(true);
    
    try {
      const zip = new JSZip();
      const appId = row.application_id;
      
      // Create info content
      let content = `Application ID: ${appId}\n`;
      content += `Applicant: ${row.applicant_name}\n`;
      content += `Certificate: ${row.certificate_name}\n`;
      content += `Phone: ${row.phone}\n`;
      content += `Taluka: ${row.taluka}\n`;
      content += `Village: ${row.village}\n`;
      content += `\n--- Document List ---\n`;
      
      // Fetch all documents
      for (const doc of docsToDownload) {
        content += `\nDocument: ${doc.doc_id}\nFile: ${doc.file_name}\n`;
        
        let downloadUrl = doc.file_url;
        
        if (!downloadUrl || !downloadUrl.startsWith("http")) {
          const storagePath = `${appId}/${doc.doc_id}_${doc.file_name}`;
          try {
            const { data } = await supabase.storage
              .from("application-docs")
              .createSignedUrl(storagePath, 300);
            if (data?.signedUrl) downloadUrl = data.signedUrl;
          } catch (e) {
            console.log("Could not get URL:", storagePath);
          }
        }
        
        if (downloadUrl) {
          content += `URL: ${downloadUrl}\n`;
          try {
            const res = await fetch(downloadUrl);
            if (res.ok) {
              const blob = await res.blob();
              zip.file(doc.file_name, blob);
            }
          } catch (e) {
            console.error("Failed to add:", doc.file_name, e);
          }
        }
      }
      
      // Add details.txt to zip
      zip.file("details.txt", content);
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appId}_documents.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (e) {
      console.error("Download error:", e);
      alert("Failed to create ZIP");
    }
    
    setDownloadingAll(false);
  }

  // View single document in modal
  async function handleViewDoc(doc) {
    let viewUrl = doc.file_url;
    
    if (!viewUrl || !viewUrl.startsWith("http")) {
      const storagePath = `${row.application_id}/${doc.doc_id}_${doc.file_name}`;
      try {
        const { data } = await supabase.storage
          .from("application-docs")
          .createSignedUrl(storagePath, 300);
        if (data?.signedUrl) {
          viewUrl = data.signedUrl;
        }
      } catch (e) {
        console.error("Could not get view URL:", e);
      }
    }
    
    if (viewUrl) {
      setPdfViewerUrl(viewUrl);
    } else {
      alert("Cannot view this document");
    }
  }

  async function loadDocs(applicationId) {
    setDocsLoading(true);
    const { data, error } = await supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId);

    if (error) {
      console.error("Error loading docs:", error);
      setDocs([]);
    } else {
      setDocs(data || []);
    }
    setDocsLoading(false);
  }

  // Resolve a file_url to a usable URL (generate signed URL if it's a path)
  async function resolveUrl(fileUrl) {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http")) return fileUrl;
    const { data, error } = await supabase.storage
      .from("application-docs")
      .createSignedUrl(fileUrl, 60 * 60);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  // Force-download a file as a blob
  async function handleDownloadDoc(doc) {
    const url = await resolveUrl(doc.file_url);
    if (!url) { alert("❌ Could not resolve download link."); return; }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = doc.file_name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch { window.open(url, "_blank"); }
  }

  // Open PDF in inline viewer
  async function handleViewPdf(doc) {
    const url = await resolveUrl(doc.file_url);
    if (!url) { alert("❌ Could not generate view link."); return; }
    setPdfViewerUrl(url);
  }

  // Download all docs + application summary
  async function handleDownloadAll() {
    setDownloadingAll(true);
    // 1. Download each doc
    for (const doc of docs) {
      if (!doc.file_url) continue;
      await handleDownloadDoc(doc);
      await new Promise(r => setTimeout(r, 300)); // small delay between files
    }
    // 2. Download application details as a .txt summary
    const summary = [
      `Application ID : ${row.application_id}`,
      `Certificate    : ${row.certificate_name || "-"}`,
      `Applicant      : ${row.applicant_name || "-"}`,
      `Phone          : ${row.phone || "-"}`,
      `Email          : ${row.email || "-"}`,
      `Taluka         : ${row.taluka || "-"}`,
      `Village        : ${row.village || "-"}`,
      `Status         : ${row.status || "-"}`,
      `Submitted      : ${row.submitted_at ? new Date(row.submitted_at).toLocaleString("en-IN") : "-"}`,
      `Admin Note     : ${row.admin_note || "-"}`,
    ].join("\n");
    const blob = new Blob([summary], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${row.application_id}_details.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    setDownloadingAll(false);
  }

  if (!open || !row) return null;

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#1C1C2E", background: "#FAFAFA", outline: "none" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, marginTop: 14 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#fff", borderRadius: 16, width: 600, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto", zIndex: 2100, boxShadow: "0 24px 60px rgba(0,0,0,0.22)" }}>
        <div style={{ background: "linear-gradient(135deg, #1A237E, #0048A8)", padding: "18px 22px", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>📄 Application Details</div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "20px 22px" }}>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", marginBottom: 4 }}>
            {[["Application ID", row.application_id], ["Certificate", row.certificate_name], ["Applicant", row.applicant_name], ["Phone", row.phone], ["Taluka", row.taluka], ["Village", row.village], ["Submitted", row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("en-IN") : "—"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700 }}>{k}</span>
                <span style={{ fontSize: 12, color: "#1C1C2E", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A237E" }}>📎 Uploaded Documents</div>
              {docs.length > 0 && (
                <button 
                  onClick={handleDownloadAllDocs}
                  disabled={downloadingAll}
                  style={{ 
                    padding: "6px 12px", 
                    background: "linear-gradient(135deg, #7C3AED, #5B21B6)", 
                    color: "#fff", 
                    borderRadius: 8, 
                    fontSize: 11, fontWeight: 700, 
                    border: "none", 
                    cursor: downloadingAll ? "not-allowed" : "pointer",
                  }}
                >
                  {downloadingAll ? "⬇ Downloading..." : "⬇ Download All"}
                </button>
              )}
            </div>
            {docsLoading ? <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF" }}>Loading...</div> : docs.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", background: "#F9FAFB", borderRadius: 10 }}>No documents uploaded yet</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {docs.map((doc) => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{doc.doc_id.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>{doc.file_name}</div>
                    </div>
                    {doc.file_url ? (
                      <button onClick={() => handleViewDoc(doc)} style={{ padding: "5px 12px", background: "linear-gradient(135deg, #0048A8, #1A237E)", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>View 📄</button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>⏳ Pending upload</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {status === "generated" && (
            <div style={{ marginTop: 16, padding: 14, background: "#F0FDF4", borderRadius: 10, border: "1px solid #86EFAC" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", marginBottom: 8 }}>📜 Upload Generated Certificate</div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" id="cert-upload" style={{ display: "none" }} onChange={onUploadCertificate} />
              <label htmlFor="cert-upload" style={{ display: "inline-block", padding: "8px 16px", background: "linear-gradient(135deg, #16A34A, #15803D)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {uploadingCert ? "Uploading..." : "📤 Upload Certificate"}
              </label>
            </div>
          )}

          <label style={labelStyle}>Update Status</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(({ value, label, color }) => (
              <button key={value} onClick={() => setStatus(value)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: `2px solid ${status === value ? color : "#E5E7EB"}`, background: status === value ? color : "#fff", color: status === value ? "#fff" : "#6B7280" }}>{label}</button>
            ))}
          </div>

          <label style={labelStyle}>Admin Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#374151" }}>Cancel</button>
            <button onClick={() => onSave({ status, admin_note: note.trim() || null })} disabled={saving} style={{ flex: 2, padding: "11px", background: saving ? "#E5E7EB" : "linear-gradient(135deg, #1A237E, #0048A8)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, color: saving ? "#9CA3AF" : "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "💾 Save Changes"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
