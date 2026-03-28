// src/components/StatusModal.jsx
// Reusable modal for updating status + admin_note on any row.
// Used by both ApplicationsPage and ComplaintsPage.

export default function StatusModal({
  open,
  onClose,
  onSave,
  saving,
  row,          // the full record being edited
  statusOptions, // [{ value, label, color }]
  title,
}) {
  if (!open || !row) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 2000, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fff", borderRadius: 16,
        width: 460, maxWidth: "94vw", maxHeight: "90vh",
        overflowY: "auto",
        zIndex: 2100,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        animation: "fadeIn 0.18s ease",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1A237E, #0048A8)",
          padding: "18px 22px", borderRadius: "16px 16px 0 0",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            borderRadius: "16px 16px 0 0",
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{title}</div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", width: 30, height: 30, borderRadius: "50%",
                fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <ModalBody
          row={row}
          statusOptions={statusOptions}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      </div>
    </>
  );
}

// Separate inner component so it has its own state
import { useState } from "react";

function ModalBody({ row, statusOptions, onClose, onSave, saving }) {
  const [status, setStatus]   = useState(row.status || statusOptions[0]?.value);
  const [note, setNote]       = useState(row.admin_note || "");

  const inputStyle = {
    width: "100%", padding: "10px 12px",
    border: "1.5px solid #E5E7EB", borderRadius: 8,
    fontSize: 13, color: "#1C1C2E", background: "#FAFAFA",
    outline: "none", fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#374151",
    display: "block", marginBottom: 6, marginTop: 14,
  };

  // Read-only info rows
  const infoRows = Object.entries({
    ...(row.application_id  ? { "Application ID":  row.application_id  } : {}),
    ...(row.complaint_id    ? { "Complaint ID":     row.complaint_id    } : {}),
    ...(row.certificate_name ? { "Certificate":     row.certificate_name } : {}),
    ...(row.complaint_type  ? { "Complaint Type":   row.complaint_type  } : {}),
    ...(row.applicant_name  ? { "Applicant":        row.applicant_name  } : {}),
    ...(row.phone           ? { "Phone":            row.phone           } : {}),
    ...(row.taluka          ? { "Taluka":           row.taluka          } : {}),
    ...(row.village         ? { "Village":          row.village         } : {}),
    ...(row.issue_details   ? { "Issue":            row.issue_details   } : {}),
  });

  return (
    <div style={{ padding: "20px 22px 22px" }}>
      {/* Info grid */}
      <div style={{
        background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", marginBottom: 4,
      }}>
        {infoRows.map(([k, v]) => (
          <div key={k} style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "5px 0", borderBottom: "1px solid #E5E7EB",
          }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, flexShrink: 0, marginRight: 12 }}>{k}</span>
            <span style={{
              fontSize: 12, color: "#1C1C2E", fontWeight: 600,
              textAlign: "right", wordBreak: "break-word", maxWidth: "65%",
            }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Status selector */}
      <label style={labelStyle}>Update Status</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {statusOptions.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setStatus(value)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `2px solid ${status === value ? color : "#E5E7EB"}`,
              background: status === value ? color : "#fff",
              color: status === value ? "#fff" : "#6B7280",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Admin note */}
      <label style={labelStyle}>Admin Note <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(shown to user)</span></label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note visible to the citizen in their status panel..."
        rows={3}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
      />

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: "11px",
            background: "#F9FAFB", border: "1.5px solid #E5E7EB",
            borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#374151",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ status, admin_note: note.trim() || null })}
          disabled={saving}
          style={{
            flex: 2, padding: "11px",
            background: saving ? "#E5E7EB" : "linear-gradient(135deg, #1A237E, #0048A8)",
            border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 800,
            color: saving ? "#9CA3AF" : "#fff",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "💾 Save Changes"}
        </button>
      </div>
    </div>
  );
}
