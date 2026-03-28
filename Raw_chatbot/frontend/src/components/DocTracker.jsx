// src/components/DocTracker.jsx
// Slide-in panel from the right — shows all documents for a certificate
// with upload button per doc and a progress bar.
//
// Rules:
//   Mandatory docs  → must ALL be uploaded → 100% required
//   Required docs   → need 70%+ uploaded to be considered sufficient
//   Optional docs   → bonus only, don't affect core %
//
// Score formula:
//   mandatoryScore = (mandatoryUploaded / mandatoryTotal) * 60   [60% weight]
//   requiredScore  = min(requiredUploaded / requiredTotal, 1) * 40 [40% weight]
//   total = mandatoryScore + requiredScore
//   → When total = 100 AND mandatoryUploaded === mandatoryTotal → show Apply button

import { useState, useRef } from "react";
import ApplicationForm from "./ApplicationForm";

// Each doc: { id: string, name: string, type: "mandatory"|"required"|"optional" }
// uploads: { [id]: { file: File, name: string } }

export default function DocTracker({ open, onClose, certName, certId, lang, mandatory, required, optional }) {
  const [uploads, setUploads] = useState({});  // { doc_id: File }
  const [applyOpen, setApplyOpen] = useState(false);
  const fileRefs = useRef({});

  if (!open) return null;

  // ── Build flat doc list with types ──────────────────────────────────────
  const mandatoryDocs = (mandatory || []).map((name, i) => ({
    id: "mandatory_" + i,
    name,
    type: "mandatory",
  }));
  const requiredDocs = (required || []).map((name, i) => ({
    id: "required_" + i,
    name,
    type: "required",
  }));
  const optionalDocs = (optional || []).map((name, i) => ({
    id: "optional_" + i,
    name,
    type: "optional",
  }));

  const allDocs = [...mandatoryDocs, ...requiredDocs, ...optionalDocs];

  // ── Progress calculation ─────────────────────────────────────────────────
  const mandatoryTotal   = mandatoryDocs.length;
  const requiredTotal    = requiredDocs.length;

  const mandatoryUploaded = mandatoryDocs.filter((d) => uploads[d.id]).length;
  const requiredUploaded  = requiredDocs.filter((d) => uploads[d.id]).length;
  const optionalUploaded  = optionalDocs.filter((d) => uploads[d.id]).length;

  // Mandatory = 60% weight, Required = 40% weight
  // Distribute 100% only across categories that actually exist
  const hasMandatory = mandatoryTotal > 0;
  const hasRequired  = requiredTotal  > 0;

  // Weight split: if both exist → 60/40, if only one → 100
  const mandatoryWeight = hasMandatory && hasRequired ? 60
    : hasMandatory ? 100 : 0;
  const requiredWeight  = hasMandatory && hasRequired ? 40
    : hasRequired  ? 100 : 0;

  const mandatoryScore = hasMandatory
    ? (mandatoryUploaded / mandatoryTotal) * mandatoryWeight
    : 0;

  const requiredScore = hasRequired
    ? Math.min(requiredUploaded / requiredTotal, 1) * requiredWeight
    : 0;

  const totalPercent = Math.round(mandatoryScore + requiredScore);

  // Required threshold: 70% of required docs uploaded
  const requiredThresholdMet = requiredTotal === 0 || (requiredUploaded / requiredTotal) >= 0.7;
  const mandatoryComplete    = mandatoryTotal === 0 || mandatoryUploaded === mandatoryTotal;
  const canApply             = mandatoryComplete && requiredThresholdMet && totalPercent === 100;

  // ── Bar color ────────────────────────────────────────────────────────────
  const barColor = totalPercent < 50 ? "#EF4444"
    : totalPercent < 80 ? "#F59E0B"
    : totalPercent < 100 ? "#3B82F6"
    : "#16A34A";

  // ── Upload handler ───────────────────────────────────────────────────────
  function handleFileChange(docId, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploads((prev) => ({ ...prev, [docId]: file }));
  }

  function handleRemove(docId) {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    // reset file input
    if (fileRefs.current[docId]) fileRefs.current[docId].value = "";
  }

  // ── Render a single document row ─────────────────────────────────────────
  function DocRow({ doc }) {
    const uploaded = !!uploads[doc.id];
    const typeColor = doc.type === "mandatory" ? "#FF6B00"
      : doc.type === "required" ? "#0048A8" : "#138808";
    const typeBg = doc.type === "mandatory" ? "#FFF3E8"
      : doc.type === "required" ? "#EEF3FF" : "#E8F5E8";

    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10, marginBottom: 6,
        background: uploaded ? "#F0FDF4" : "#FAFAFA",
        border: uploaded ? "1.5px solid #86EFAC" : "1.5px solid #E5E7EB",
        transition: "all 0.2s",
      }}>
        {/* Status icon */}
        <span style={{ fontSize: 16, flexShrink: 0 }}>
          {uploaded ? "✅" : doc.type === "mandatory" ? "🔴" : doc.type === "required" ? "🔵" : "🟢"}
        </span>

        {/* Doc name + type badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1C2E",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {doc.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: typeColor,
              background: typeBg, padding: "1px 7px", borderRadius: 10 }}>
              {doc.type.toUpperCase()}
            </span>
            {uploaded && (
              <span style={{ fontSize: 10, color: "#16A34A" }}>
                {uploads[doc.id].name.length > 20
                  ? uploads[doc.id].name.slice(0, 20) + "…"
                  : uploads[doc.id].name}
              </span>
            )}
          </div>
        </div>

        {/* Upload / Remove button */}
        {uploaded ? (
          <button onClick={() => handleRemove(doc.id)} style={{
            background: "none", border: "1.5px solid #FCA5A5", color: "#DC2626",
            borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
          }}>Remove</button>
        ) : (
          <>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              ref={(el) => (fileRefs.current[doc.id] = el)}
              onChange={(e) => handleFileChange(doc.id, e)}
            />
            <button onClick={() => fileRefs.current[doc.id]?.click()} style={{
              background: "linear-gradient(135deg, #0048A8, #1A237E)",
              border: "none", color: "#fff",
              borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", flexShrink: 0,
            }}>Upload</button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)", zIndex: 1100,
        animation: "fadeIn 0.2s ease",
      }} />

      {/* Slide-in panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 400, maxWidth: "95vw",
        background: "#fff", zIndex: 1200,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(26,35,126,0.18)",
        animation: "slideInRight 0.25s ease",
      }}>

        {/* ── PANEL HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #1A237E, #0048A8)",
          padding: "18px 20px 14px", flexShrink: 0,
          position: "relative",
        }}>
          {/* India tricolour stripe */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>📋 Document Tracker</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>{certName}</div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              width: 32, height: 32, borderRadius: "50%", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C2E" }}>Documents Ready</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: barColor }}>{totalPercent}%</span>
          </div>

          {/* Bar track */}
          <div style={{ background: "#F3F4F6", borderRadius: 8, height: 10, overflow: "hidden" }}>
            <div style={{
              width: totalPercent + "%", height: "100%",
              background: barColor, borderRadius: 8,
              transition: "width 0.4s ease, background 0.4s ease",
            }} />
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <StatPill color="#FF6B00" bg="#FFF3E8"
              label="Mandatory" value={mandatoryUploaded + "/" + mandatoryTotal} />
            <StatPill color="#0048A8" bg="#EEF3FF"
              label="Required" value={requiredUploaded + "/" + requiredTotal} />
            {optionalDocs.length > 0 && (
              <StatPill color="#138808" bg="#E8F5E8"
                label="Optional" value={optionalUploaded + "/" + optionalDocs.length} />
            )}
          </div>

          {/* Threshold hint */}
          {!requiredThresholdMet && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#D97706",
              background: "#FFFBEB", padding: "5px 10px", borderRadius: 8, fontWeight: 600 }}>
              ⚠️ Upload at least {Math.ceil(requiredTotal * 0.7)} required documents to proceed
            </div>
          )}
          {!mandatoryComplete && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#DC2626",
              background: "#FEF2F2", padding: "5px 10px", borderRadius: 8, fontWeight: 600 }}>
              🔴 All mandatory documents must be uploaded
            </div>
          )}
        </div>

        {/* ── DOCUMENT LIST ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {mandatoryDocs.length > 0 && (
            <SectionHead label="🔴 Mandatory" color="#FF6B00" />
          )}
          {mandatoryDocs.map((doc) => <DocRow key={doc.id} doc={doc} />)}

          {requiredDocs.length > 0 && (
            <SectionHead label="🔵 Required" color="#0048A8" />
          )}
          {requiredDocs.map((doc) => <DocRow key={doc.id} doc={doc} />)}

          {optionalDocs.length > 0 && (
            <SectionHead label="🟢 Optional (Bonus)" color="#138808" />
          )}
          {optionalDocs.map((doc) => <DocRow key={doc.id} doc={doc} />)}
        </div>

        {/* ── APPLY BUTTON (only at 100%) ── */}
        {canApply && (
          <div style={{
            padding: "14px 16px", borderTop: "1px solid #F3F4F6", flexShrink: 0,
            background: "#F0FDF4",
          }}>
            <button
              onClick={() => setApplyOpen(true)}
              style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #16A34A, #15803D)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                letterSpacing: 0.3,
                transition: "opacity 0.18s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              🎉 Apply for Certificate
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "#16A34A",
              marginTop: 6, fontWeight: 600 }}>
              All required documents uploaded — ready to apply!
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <ApplicationForm
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        certName={certName}
        certId={certId}
        uploadedDocs={uploads}
        lang={lang || "en"}
      />
    </>
  );
}

function StatPill({ color, bg, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: bg, padding: "4px 10px", borderRadius: 20,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#1C1C2E" }}>{value}</span>
    </div>
  );
}

function SectionHead({ label, color }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color,
      textTransform: "uppercase", letterSpacing: 1,
      marginBottom: 6, marginTop: 4,
    }}>
      {label}
    </div>
  );
}