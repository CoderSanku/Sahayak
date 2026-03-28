// src/pages/ComplaintsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import StatusModal from "../components/StatusModal.jsx";

function downloadCSV(data, filename = "complaints.csv") {
  if (!data || data.length === 0) return;
  const headers = ["Complaint ID", "Type", "Code", "Applicant", "Phone", "Issue Details", "Language", "Status", "Submitted Date"];
  const rows = data.map(r => [
    r.complaint_id,
    r.complaint_type || "",
    r.complaint_code || "",
    r.applicant_name || "",
    r.phone || "",
    r.issue_details || "",
    r.language || "",
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

async function exportAllComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select("complaint_id, complaint_type, complaint_code, applicant_name, phone, issue_details, language, status, submitted_at")
    .order("submitted_at", { ascending: false });
  
  if (!error && data) {
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(data, `complaints_${date}.csv`);
  }
}

const STATUS_OPTIONS = [
    { value: "pending",   label: "⏳ Pending",   color: "#F59E0B" },
    { value: "reviewed",  label: "🔍 Reviewed",  color: "#2563EB" },
    { value: "resolved",  label: "✅ Resolved",  color: "#16A34A" },
    { value: "dismissed", label: "❌ Dismissed", color: "#DC2626" },
  ];

  const PAGE_SIZE = 15;

  // Map complaint code → short emoji label
  const CODE_EMOJI = {
    C1: "⏳ Delay",
    C2: "❌ Rejection",
    C3: "✏️ Correction",
    C4: "🚫 Misconduct",
    C5: "💻 Portal Issue",
    C6: "📝 General",
  };

  export default function ComplaintsPage() {
    const [searchParams] = useSearchParams();

    const [rows, setRows]           = useState([]);
    const [loading, setLoading]     = useState(true);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(0);
    const [search, setSearch]       = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [sortDesc, setSortDesc]   = useState(true);
    const [expandedId, setExpandedId] = useState(null); // for letter_text preview

    // Modal
    const [modalRow, setModalRow]   = useState(null);
    const [saving, setSaving]       = useState(false);
    const [toast, setToast]         = useState(null);

    const showToast = (msg, ok = true) => {
      setToast({ msg, ok });
      setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
      setLoading(true);
      let q = supabase
        .from("complaints")
        .select(
          "complaint_id, complaint_code, complaint_type, applicant_name, phone, certificate_name, issue_details, letter_text, language, status, submitted_at",
          { count: "exact" }
        )
        .order("submitted_at", { ascending: !sortDesc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search.trim()) {
        q = q.or(
          `complaint_id.ilike.%${search}%,applicant_name.ilike.%${search}%,complaint_type.ilike.%${search}%`
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
      const { error } = await supabase
        .from("complaints")
        .update({ status, admin_note })
        .eq("complaint_id", modalRow.complaint_id);

      if (error) {
        showToast("❌ Failed to update. Check Supabase RLS policies.", false);
      } else {
        showToast("✅ Complaint updated successfully.");
        setModalRow(null);
        load();
      }
      setSaving(false);
    }

    const fmt = (iso) => iso
      ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const langFlag = { en: "🇬🇧", hi: "🇮🇳", mr: "🟠" };

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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED" }}>Complaints</h1>
            <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {total} total · click Edit to update status or add a note
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={exportAllComplaints}
              style={{
                padding: "9px 16px", background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaint ID, name, type…"
            style={{
              flex: 1, minWidth: 200, padding: "9px 14px",
              border: "1.5px solid #E5E7EB", borderRadius: 10,
              fontSize: 13, color: "#1C1C2E", background: "#fff", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${statusFilter === value ? "#7C3AED" : "#E5E7EB"}`,
                  background: statusFilter === value ? "#7C3AED" : "#fff",
                  color: statusFilter === value ? "#fff" : "#6B7280",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
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
              No complaints found
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                    {["Complaint ID", "Type", "Applicant", "Phone", "Lang", "Date", "Status", ""].map((h) => (
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
                    <>
                      <tr
                        key={r.complaint_id}
                        style={{ borderBottom: expandedId === r.complaint_id ? "none" : "1px solid #F3F4F6", transition: "background 0.1s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                        onMouseLeave={(e) => e.currentTarget.style.background = ""}
                      >
                        <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 700, color: "#7C3AED", fontSize: 11, whiteSpace: "nowrap" }}>
                          {r.complaint_id}
                        </td>
                        <td style={{ padding: "11px 12px", color: "#374151", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span title={r.complaint_type}>
                            {CODE_EMOJI[r.complaint_code] || r.complaint_type || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 12px", color: "#374151", whiteSpace: "nowrap" }}>
                          {r.applicant_name || "—"}
                        </td>
                        <td style={{ padding: "11px 12px", color: "#6B7280", whiteSpace: "nowrap" }}>
                          {r.phone || "—"}
                        </td>
                        <td style={{ padding: "11px 12px", textAlign: "center", fontSize: 14 }}>
                          {langFlag[r.language] || "—"}
                        </td>
                        <td style={{ padding: "11px 12px", color: "#6B7280", whiteSpace: "nowrap" }}>
                          {fmt(r.submitted_at)}
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          <span className={`pill ${r.status}`}>{r.status}</span>
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {/* Letter preview toggle */}
                            {r.letter_text && (
                              <button
                                onClick={() => setExpandedId(expandedId === r.complaint_id ? null : r.complaint_id)}
                                title="Preview letter"
                                style={{
                                  padding: "5px 9px", borderRadius: 8,
                                  background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                                  color: "#6B7280", fontSize: 11, fontWeight: 700,
                                }}
                              >
                                {expandedId === r.complaint_id ? "▲" : "📄"}
                              </button>
                            )}
                            <button
                              onClick={() => setModalRow(r)}
                              style={{
                                padding: "5px 12px", borderRadius: 8,
                                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                                border: "none", color: "#fff",
                                fontSize: 11, fontWeight: 700, cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Edit ✏️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded letter preview row */}
                      {expandedId === r.complaint_id && (
                        <tr key={`${r.complaint_id}-expanded`} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td colSpan={8} style={{ padding: "0 12px 14px 12px" }}>
                            <div style={{
                              background: "#FFFDF7", border: "1px solid #E5E7EB",
                              borderRadius: 10, padding: "14px 16px",
                              fontSize: 12, lineHeight: 1.8, color: "#374151",
                              whiteSpace: "pre-wrap", fontFamily: "monospace",
                              maxHeight: 220, overflowY: "auto",
                            }}>
                              {r.letter_text}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

        {/* Status modal */}
        <StatusModal
          open={!!modalRow}
          onClose={() => setModalRow(null)}
          onSave={handleSave}
          saving={saving}
          row={modalRow}
          statusOptions={STATUS_OPTIONS}
          title="✏️ Update Complaint Status"
        />
      </div>
    );
  }
