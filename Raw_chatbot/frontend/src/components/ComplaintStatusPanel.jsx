// src/components/ComplaintStatusPanel.jsx
// Slide-in panel from right — lets user enter their Complaint ID
// and see the current status fetched from Supabase `complaints` table.
//
// Statuses (set by admin panel later):
//   pending   → received, not yet reviewed
//   reviewed  → admin is looking into it
//   resolved  → complaint has been addressed
//   dismissed → complaint was dismissed

import { useState } from "react";
import { supabase } from "../supabaseClient";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    emoji:  "⏳",
    color:  "#F59E0B",
    bg:     "#FFFBEB",
    border: "#FDE68A",
    en: "Complaint Received",
    hi: "शिकायत प्राप्त हुई",
    mr: "तक्रार प्राप्त झाली",
    descEn: "Your complaint has been received and is waiting to be reviewed by the admin.",
    descHi: "आपकी शिकायत प्राप्त हो गई है और प्रशासन द्वारा समीक्षा की प्रतीक्षा में है।",
    descMr: "तुमची तक्रार प्राप्त झाली आहे आणि प्रशासकाकडून तपासणीची प्रतीक्षा आहे.",
  },
  reviewed: {
    emoji:  "🔍",
    color:  "#2563EB",
    bg:     "#EFF6FF",
    border: "#BFDBFE",
    en: "Under Review",
    hi: "समीक्षाधीन है",
    mr: "तपासणी सुरू आहे",
    descEn: "Your complaint is currently being reviewed by the admin. You will be notified once resolved.",
    descHi: "आपकी शिकायत की समीक्षा की जा रही है। समाधान होने पर आपको सूचित किया जाएगा।",
    descMr: "तुमच्या तक्रारीची तपासणी सुरू आहे. निराकरण झाल्यावर तुम्हाला कळवले जाईल.",
  },
  resolved: {
    emoji:  "✅",
    color:  "#16A34A",
    bg:     "#F0FDF4",
    border: "#86EFAC",
    en: "Complaint Resolved",
    hi: "शिकायत का समाधान हो गया",
    mr: "तक्रारीचे निराकरण झाले",
    descEn: "Your complaint has been resolved. Please contact the Tehsildar office if you need further assistance.",
    descHi: "आपकी शिकायत का समाधान हो गया है। अधिक सहायता के लिए कार्यालय से संपर्क करें।",
    descMr: "तुमच्या तक्रारीचे निराकरण झाले आहे. अधिक मदतीसाठी कार्यालयाशी संपर्क करा.",
  },
  dismissed: {
    emoji:  "❌",
    color:  "#DC2626",
    bg:     "#FEF2F2",
    border: "#FECACA",
    en: "Complaint Dismissed",
    hi: "शिकायत खारिज कर दी गई",
    mr: "तक्रार फेटाळण्यात आली",
    descEn: "Your complaint was dismissed. Please visit the Tehsildar office for more details.",
    descHi: "आपकी शिकायत खारिज कर दी गई। कृपया अधिक जानकारी के लिए कार्यालय जाएं।",
    descMr: "तुमची तक्रार फेटाळण्यात आली. अधिक माहितीसाठी कार्यालयास भेट द्या.",
  },
};

// ── Timeline steps ─────────────────────────────────────────────────────────────
const TIMELINE = [
  { key: "pending",  labelEn: "Received", labelHi: "प्राप्त",      labelMr: "प्राप्त"    },
  { key: "reviewed", labelEn: "Reviewing", labelHi: "समीक्षाधीन",  labelMr: "तपासणी"     },
  { key: "resolved", labelEn: "Resolved",  labelHi: "समाधान",      labelMr: "निराकरण"    },
];
const STATUS_ORDER = { pending: 0, reviewed: 1, resolved: 2, dismissed: -1 };

// ── Labels ─────────────────────────────────────────────────────────────────────
const LABELS = {
  en: {
    title:       "📋 Check Complaint Status",
    inputLabel:  "Enter your Complaint ID",
    placeholder: "e.g. CMP-1748293847263",
    check:       "Check Status",
    checking:    "Checking...",
    notFound:    "Complaint ID not found. Please check and try again.",
    error:       "Could not fetch status. Please try again.",
    complaintType: "Complaint Type",
    name:        "Filed by",
    submittedAt: "Submitted on",
    adminNote:   "Admin Note",
    tryAnother:  "Check Another",
    details:     "Complaint Details",
    progress:    "Progress",
  },
  hi: {
    title:       "📋 शिकायत स्थिति जाँचें",
    inputLabel:  "अपना शिकायत ID दर्ज करें",
    placeholder: "जैसे CMP-1748293847263",
    check:       "स्थिति जाँचें",
    checking:    "जाँच हो रही है...",
    notFound:    "शिकायत ID नहीं मिली। कृपया दोबारा जाँचें।",
    error:       "स्थिति प्राप्त नहीं हो सकी। पुनः प्रयास करें।",
    complaintType: "शिकायत प्रकार",
    name:        "दर्ज किया",
    submittedAt: "जमा की तारीख",
    adminNote:   "प्रशासन टिप्पणी",
    tryAnother:  "दूसरा जाँचें",
    details:     "शिकायत विवरण",
    progress:    "प्रगति",
  },
  mr: {
    title:       "📋 तक्रारीची स्थिती तपासा",
    inputLabel:  "तुमचा तक्रार ID प्रविष्ट करा",
    placeholder: "उदा. CMP-1748293847263",
    check:       "स्थिती तपासा",
    checking:    "तपासत आहे...",
    notFound:    "तक्रार ID सापडला नाही. कृपया पुन्हा तपासा.",
    error:       "स्थिती मिळवता आली नाही. पुन्हा प्रयत्न करा.",
    complaintType: "तक्रारीचा प्रकार",
    name:        "दाखल केले",
    submittedAt: "सादर केल्याची तारीख",
    adminNote:   "प्रशासक टिप्पणी",
    tryAnother:  "दुसरे तपासा",
    details:     "तक्रारीचा तपशील",
    progress:    "प्रगती",
  },
};

export default function ComplaintStatusPanel({ open, onClose, lang = "en" }) {
  const [cmpId, setCmpId]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);   // complaint row
  const [error, setError]     = useState(null);   // "not_found" | "error"

  const L = LABELS[lang] || LABELS.en;

  if (!open) return null;

  function handleClose() {
    setCmpId("");
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  }

  function handleReset() {
    setCmpId("");
    setResult(null);
    setError(null);
  }

  async function handleCheck() {
    const trimmed = cmpId.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: supaErr } = await supabase
        .from("complaints")
        .select("*")
        .eq("complaint_id", trimmed)
        .single();

      if (supaErr || !data) {
        setError("not_found");
      } else {
        setResult(data);
      }
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const statusCfg   = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.pending) : null;
  const statusOrder = result ? (STATUS_ORDER[result.status] ?? 0) : 0;
  const isDismissed = result?.status === "dismissed";

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)", zIndex: 1100,
      }} />

      {/* Slide-in panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 420, maxWidth: "95vw",
        background: "#fff", zIndex: 1200,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
        animation: "slideInRight 0.25s ease",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
          padding: "18px 20px 14px", flexShrink: 0, position: "relative",
        }}>
          {/* Tricolor bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{L.title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {lang === "mr"
                  ? "तक्रारीची सद्यस्थिती तपासा"
                  : lang === "hi"
                  ? "अपनी शिकायत की वर्तमान स्थिति देखें"
                  : "Track your complaint in real-time"}
              </div>
            </div>
            <button onClick={handleClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              width: 32, height: 32, borderRadius: "50%", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

          {/* Search input — shown when no result yet */}
          {!result && (
            <div>
              <label style={{
                fontSize: 12, fontWeight: 700, color: "#374151",
                display: "block", marginBottom: 6,
              }}>{L.inputLabel}</label>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={cmpId}
                  onChange={(e) => { setCmpId(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder={L.placeholder}
                  style={{
                    flex: 1, padding: "11px 14px",
                    border: `1.5px solid ${error ? "#EF4444" : "#E5E7EB"}`,
                    borderRadius: 10, fontFamily: "inherit", fontSize: 13,
                    color: "#1C1C2E", background: "#FAFAFA", outline: "none",
                    letterSpacing: 0.5,
                  }}
                />
                <button
                  onClick={handleCheck}
                  disabled={loading || !cmpId.trim()}
                  style={{
                    padding: "11px 18px",
                    background: loading || !cmpId.trim()
                      ? "#E5E7EB"
                      : "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    border: "none", borderRadius: 10,
                    color: loading || !cmpId.trim() ? "#9CA3AF" : "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: loading || !cmpId.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit", whiteSpace: "nowrap",
                  }}
                >
                  {loading ? L.checking : L.check}
                </button>
              </div>

              {/* Error messages */}
              {error === "not_found" && (
                <div style={{
                  marginTop: 10, padding: "10px 14px",
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 8, fontSize: 13, color: "#DC2626",
                }}>
                  ❌ {L.notFound}
                </div>
              )}
              {error === "error" && (
                <div style={{
                  marginTop: 10, padding: "10px 14px",
                  background: "#FFF7ED", border: "1px solid #FED7AA",
                  borderRadius: 8, fontSize: 13, color: "#EA580C",
                }}>
                  ⚠️ {L.error}
                </div>
              )}

              {/* Hint */}
              <div style={{
                marginTop: 16, padding: "12px 14px",
                background: "#FAF5FF", border: "1px solid #DDD6FE",
                borderRadius: 10, fontSize: 12, color: "#7C3AED", lineHeight: 1.7,
              }}>
                💡 {lang === "mr"
                  ? "तुमचा Complaint ID तक्रार सादर केल्यावर दाखवला जातो. उदा: CMP-1748293847263"
                  : lang === "hi"
                  ? "आपका Complaint ID शिकायत जमा करने के बाद प्रदर्शित होता है। जैसे: CMP-1748293847263"
                  : "Your Complaint ID was shown when you submitted the complaint. e.g. CMP-1748293847263"}
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {result && statusCfg && (
            <div>
              {/* Status badge */}
              <div style={{
                background: statusCfg.bg,
                border: `2px solid ${statusCfg.border}`,
                borderRadius: 14, padding: "18px 20px",
                textAlign: "center", marginBottom: 16,
              }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>{statusCfg.emoji}</div>
                <div style={{
                  fontSize: 18, fontWeight: 800, color: statusCfg.color, marginBottom: 6,
                }}>
                  {statusCfg[lang] || statusCfg.en}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                  {statusCfg[`desc${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || statusCfg.descEn}
                </div>
              </div>

              {/* Timeline — only for non-dismissed */}
              {!isDismissed && (
                <div style={{
                  background: "#F9FAFB", borderRadius: 12,
                  padding: "14px 16px", marginBottom: 14,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#6B7280",
                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
                  }}>
                    {L.progress}
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {TIMELINE.map((step, i) => {
                      const done   = STATUS_ORDER[result.status] >= i;
                      const active = STATUS_ORDER[result.status] === i;
                      const label  = lang === "hi" ? step.labelHi : lang === "mr" ? step.labelMr : step.labelEn;
                      return (
                        <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                            {i > 0 && (
                              <div style={{
                                flex: 1, height: 3,
                                background: STATUS_ORDER[result.status] >= i ? "#7C3AED" : "#E5E7EB",
                                transition: "background 0.3s",
                              }} />
                            )}
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: done ? "#7C3AED" : "#E5E7EB",
                              border: active ? "3px solid #6D28D9" : "none",
                              fontSize: 13, color: done ? "#fff" : "#9CA3AF",
                              fontWeight: 800,
                              boxShadow: active ? "0 0 0 3px rgba(124,58,237,0.2)" : "none",
                              transition: "all 0.3s",
                            }}>
                              {done ? "✓" : i + 1}
                            </div>
                            {i < TIMELINE.length - 1 && (
                              <div style={{
                                flex: 1, height: 3,
                                background: STATUS_ORDER[result.status] > i ? "#7C3AED" : "#E5E7EB",
                                transition: "background 0.3s",
                              }} />
                            )}
                          </div>
                          <div style={{
                            marginTop: 6, fontSize: 10,
                            fontWeight: active ? 800 : 600,
                            color: done ? "#6D28D9" : "#9CA3AF",
                            textAlign: "center",
                          }}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Complaint details */}
              <div style={{
                background: "#F9FAFB", borderRadius: 12,
                padding: "14px 16px", marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#6B7280",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
                }}>
                  {L.details}
                </div>
                {[
                  { label: "Complaint ID",    value: result.complaint_id,   mono: true },
                  { label: L.complaintType,   value: result.complaint_type, mono: false },
                  { label: L.name,            value: result.applicant_name, mono: false },
                  { label: L.submittedAt,     value: formatDate(result.submitted_at || result.created_at), mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "6px 0", borderBottom: "1px solid #E5E7EB",
                  }}>
                    <span style={{ fontSize: 12, color: "#6B7280", flexShrink: 0, marginRight: 8 }}>{label}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: "#1C1C2E",
                      fontFamily: mono ? "monospace" : "inherit",
                      textAlign: "right",
                    }}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Admin note — shown only if set by admin */}
              {result.admin_note && (
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 14,
                  fontSize: 12, color: "#92400E", lineHeight: 1.6,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📌 {L.adminNote}</div>
                  {result.admin_note}
                </div>
              )}

              {/* Check another */}
              <button onClick={handleReset} style={{
                width: "100%", padding: "11px",
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}>
                🔍 {L.tryAnother}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}