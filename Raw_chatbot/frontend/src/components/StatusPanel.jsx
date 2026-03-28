// src/components/StatusPanel.jsx
// Slide-in panel from right — lets user enter their Application ID
// and see the current status fetched from Supabase via backend.
//
// Statuses (set by admin panel later):
//   pending    → submitted, not yet reviewed by admin
//   approved   → admin has approved, processing started
//   generated  → certificate has been generated and is ready

import { useState } from "react";
import { supabase } from "../supabaseClient";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    emoji:    "⏳",
    color:    "#F59E0B",
    bg:       "#FFFBEB",
    border:   "#FDE68A",
    en: "Application Pending",
    hi: "आवेदन लंबित है",
    mr: "अर्ज प्रलंबित आहे",
    descEn: "Your application has been received and is waiting to be reviewed by the admin.",
    descHi: "आपका आवेदन प्राप्त हो गया है और प्रशासन द्वारा समीक्षा की प्रतीक्षा में है।",
    descMr: "तुमचा अर्ज प्राप्त झाला आहे आणि प्रशासकाकडून तपासणीची प्रतीक्षा आहे.",
  },
  approved: {
    emoji:    "✅",
    color:    "#2563EB",
    bg:       "#EFF6FF",
    border:   "#BFDBFE",
    en: "Application Approved",
    hi: "आवेदन स्वीकृत हुआ",
    mr: "अर्ज मंजूर झाला",
    descEn: "Your application has been approved by the admin. The certificate is being processed.",
    descHi: "आपका आवेदन प्रशासन द्वारा स्वीकृत कर दिया गया है। प्रमाण पत्र तैयार किया जा रहा है।",
    descMr: "तुमचा अर्ज प्रशासकाने मंजूर केला आहे. प्रमाणपत्र तयार होत आहे.",
  },
  generated: {
    emoji:    "🎉",
    color:    "#16A34A",
    bg:       "#F0FDF4",
    border:   "#86EFAC",
    en: "Certificate Generated",
    hi: "प्रमाण पत्र जारी हो गया",
    mr: "प्रमाणपत्र तयार झाले",
    descEn: "Your certificate has been generated! Visit the Tehsildar office to collect it.",
    descHi: "आपका प्रमाण पत्र तैयार हो गया है! इसे प्राप्त करने के लिए तहसीलदार कार्यालय जाएं।",
    descMr: "तुमचे प्रमाणपत्र तयार झाले आहे! ते घेण्यासाठी तहसीलदार कार्यालयात जा.",
  },
  rejected: {
    emoji:    "❌",
    color:    "#DC2626",
    bg:       "#FEF2F2",
    border:   "#FECACA",
    en: "Application Rejected",
    hi: "आवेदन अस्वीकृत हुआ",
    mr: "अर्ज नामंजूर झाला",
    descEn: "Your application was rejected. Please check with the Tehsildar office for more details.",
    descHi: "आपका आवेदन अस्वीकृत कर दिया गया। कृपया अधिक जानकारी के लिए कार्यालय से संपर्क करें।",
    descMr: "तुमचा अर्ज नामंजूर करण्यात आला. अधिक माहितीसाठी कार्यालयाशी संपर्क करा.",
  },
};

// ── Timeline steps ────────────────────────────────────────────────────────────
const TIMELINE = [
  { key: "pending",   labelEn: "Submitted",  labelHi: "जमा हुआ",    labelMr: "सादर केले"   },
  { key: "approved",  labelEn: "Approved",   labelHi: "स्वीकृत",   labelMr: "मंजूर"        },
  { key: "generated", labelEn: "Ready",      labelHi: "तैयार",      labelMr: "तयार"         },
];
const STATUS_ORDER = { pending: 0, approved: 1, generated: 2, rejected: -1 };

const LABELS = {
  en: {
    title:       "📋 Check Application Status",
    inputLabel:  "Enter your Application ID",
    placeholder: "e.g. APP-260323-4821",
    check:       "Check Status",
    checking:    "Checking...",
    notFound:    "Application ID not found. Please check and try again.",
    error:       "Could not fetch status. Please try again.",
    certName:    "Certificate",
    name:        "Applicant",
    submittedAt: "Submitted on",
    adminNote:   "Admin Note",
    tryAnother:  "Check Another",
    downloadCert: "⬇️ Download Certificate",
  },
  hi: {
    title:       "📋 आवेदन स्थिति जाँचें",
    inputLabel:  "अपना आवेदन ID दर्ज करें",
    placeholder: "जैसे APP-260323-4821",
    check:       "स्थिति जाँचें",
    checking:    "जाँच हो रही है...",
    notFound:    "आवेदन ID नहीं मिली। कृपया दोबारा जाँचें।",
    error:       "स्थिति प्राप्त नहीं हो सकी। कृपया पुनः प्रयास करें।",
    certName:    "प्रमाण पत्र",
    name:        "आवेदक",
    submittedAt: "जमा की तारीख",
    adminNote:   "प्रशासन टिप्पणी",
    tryAnother:  "दूसरा जाँचें",
    downloadCert: "⬇️ प्रमाण पत्र डाउनलोड करें",
  },
  mr: {
    title:       "📋 अर्जाची स्थिती तपासा",
    inputLabel:  "तुमचा अर्ज ID प्रविष्ट करा",
    placeholder: "उदा. APP-260323-4821",
    check:       "स्थिती तपासा",
    checking:    "तपासत आहे...",
    notFound:    "अर्ज ID सापडला नाही. कृपया पुन्हा तपासा.",
    error:       "स्थिती मिळवता आली नाही. पुन्हा प्रयत्न करा.",
    certName:    "प्रमाणपत्र",
    name:        "अर्जदार",
    submittedAt: "सादर केल्याची तारीख",
    adminNote:   "प्रशासक टिप्पणी",
    tryAnother:  "दुसरे तपासा",
    downloadCert: "⬇️ प्रमाणपत्र डाउनलोड करा",
  },
};

export default function StatusPanel({ open, onClose, lang = "en" }) {
  const [appId, setAppId]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // application row
  const [error, setError]       = useState(null);   // "not_found" | "error"

  const L = LABELS[lang] || LABELS.en;

  if (!open) return null;

  function handleClose() {
    setAppId("");
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  }

  function handleReset() {
    setAppId("");
    setResult(null);
    setError(null);
  }

  async function handleCheck() {
    const trimmed = appId.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: supaErr } = await supabase
        .from("applications")
        .select("*")
        .eq("application_id", trimmed)
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
  const statusCfg  = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.pending) : null;
  const statusOrder = result ? (STATUS_ORDER[result.status] ?? 0) : 0;
  const isRejected  = result?.status === "rejected";

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
          background: "linear-gradient(135deg, #0F766E, #0D9488)",
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
                {lang === "mr" ? "अर्जाची सद्यस्थिती तपासा" : lang === "hi" ? "अपने आवेदन की वर्तमान स्थिति देखें" : "Track your application in real-time"}
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

          {/* Search input */}
          {!result && (
            <div>
              <label style={{
                fontSize: 12, fontWeight: 700, color: "#374151",
                display: "block", marginBottom: 6,
              }}>{L.inputLabel}</label>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={appId}
                  onChange={(e) => { setAppId(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder={L.placeholder}
                  style={{
                    flex: 1, padding: "11px 14px",
                    border: `1.5px solid ${error ? "#EF4444" : "#E5E7EB"}`,
                    borderRadius: 10, fontFamily: "inherit", fontSize: 14,
                    color: "#1C1C2E", background: "#FAFAFA", outline: "none",
                    letterSpacing: 1,
                  }}
                />
                <button
                  onClick={handleCheck}
                  disabled={loading || !appId.trim()}
                  style={{
                    padding: "11px 18px",
                    background: loading || !appId.trim()
                      ? "#E5E7EB"
                      : "linear-gradient(135deg, #0F766E, #0D9488)",
                    border: "none", borderRadius: 10,
                    color: loading || !appId.trim() ? "#9CA3AF" : "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: loading || !appId.trim() ? "not-allowed" : "pointer",
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
                background: "#F0FDFA", border: "1px solid #99F6E4",
                borderRadius: 10, fontSize: 12, color: "#0F766E", lineHeight: 1.7,
              }}>
                💡 {lang === "mr"
                  ? "तुमचा Application ID अर्ज सादर केल्यावर मिळाला होता. उदा: APP-260323-4821"
                  : lang === "hi"
                  ? "आपका Application ID आवेदन जमा करने के बाद प्राप्त हुआ था। जैसे: APP-260323-4821"
                  : "Your Application ID was shown when you submitted. e.g. APP-260323-4821"}
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

              {/* Timeline — only for non-rejected */}
              {!isRejected && (
                <div style={{
                  background: "#F9FAFB", borderRadius: 12,
                  padding: "14px 16px", marginBottom: 14,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#6B7280",
                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
                  }}>
                    {lang === "mr" ? "प्रगती" : lang === "hi" ? "प्रगति" : "Progress"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    {TIMELINE.map((step, i) => {
                      const done    = STATUS_ORDER[result.status] >= i;
                      const active  = STATUS_ORDER[result.status] === i;
                      const label   = lang === "hi" ? step.labelHi : lang === "mr" ? step.labelMr : step.labelEn;
                      return (
                        <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                            {i > 0 && (
                              <div style={{
                                flex: 1, height: 3,
                                background: STATUS_ORDER[result.status] >= i ? "#0D9488" : "#E5E7EB",
                                transition: "background 0.3s",
                              }} />
                            )}
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: done ? "#0D9488" : "#E5E7EB",
                              border: active ? "3px solid #0F766E" : "none",
                              fontSize: 13, color: done ? "#fff" : "#9CA3AF",
                              fontWeight: 800,
                              boxShadow: active ? "0 0 0 3px rgba(13,148,136,0.2)" : "none",
                              transition: "all 0.3s",
                            }}>
                              {done ? "✓" : i + 1}
                            </div>
                            {i < TIMELINE.length - 1 && (
                              <div style={{
                                flex: 1, height: 3,
                                background: STATUS_ORDER[result.status] > i ? "#0D9488" : "#E5E7EB",
                                transition: "background 0.3s",
                              }} />
                            )}
                          </div>
                          <div style={{
                            marginTop: 6, fontSize: 10, fontWeight: active ? 800 : 600,
                            color: done ? "#0F766E" : "#9CA3AF",
                            textAlign: "center",
                          }}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Application details */}
              <div style={{
                background: "#F9FAFB", borderRadius: 12,
                padding: "14px 16px", marginBottom: 14,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#6B7280",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
                }}>
                  {lang === "mr" ? "अर्जाचा तपशील" : lang === "hi" ? "आवेदन विवरण" : "Application Details"}
                </div>
                {[
                  { label: "Application ID", value: result.application_id },
                  { label: L.certName,        value: result.certificate_name },
                  { label: L.name,            value: result.applicant_name },
                  { label: L.submittedAt,     value: formatDate(result.created_at || result.submitted_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "6px 0", borderBottom: "1px solid #E5E7EB",
                  }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: "#1C1C2E",
                      fontFamily: label === "Application ID" ? "monospace" : "inherit",
                    }}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Admin note — shown only if present (admin panel will set this) */}
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

              {/* ── Download Certificate (generated status only) ── */}
              {result.status === "generated" && (
                result.certificate_url ? (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(result.certificate_url);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        // Strip query string (?token=...) before extracting filename
                        const cleanPath = new URL(result.certificate_url).pathname;
                        const parts = cleanPath.split("/");
                        a.download = decodeURIComponent(parts[parts.length - 1]) || "certificate.pdf";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch {
                        window.open(result.certificate_url, "_blank");
                      }
                    }}
                    style={{
                      display: "block", width: "100%", textAlign: "center",
                      marginBottom: 10, padding: "14px 20px",
                      background: "linear-gradient(135deg, #16A34A, #15803D)",
                      border: "none", borderRadius: 10, color: "#fff",
                      fontSize: 14, fontWeight: 800, cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 14px rgba(22,163,74,0.4)",
                      animation: "pulse 2s infinite",
                    }}
                  >
                    {L.downloadCert}
                  </button>
                ) : (
                  <div style={{
                    marginBottom: 10, padding: "12px 14px",
                    background: "#F0FDF4", border: "1px solid #86EFAC",
                    borderRadius: 10, fontSize: 12, color: "#15803D",
                    fontWeight: 600, textAlign: "center",
                  }}>
                    ✅ {lang === "mr" ? "प्रमाणपत्र तयार आहे, लवकरच उपलब्ध होईल." : lang === "hi" ? "प्रमाण पत्र तैयार है, जल्द उपलब्ध होगा।" : "Certificate is ready. Download link will appear here shortly."}
                  </div>
                )
              )}

              {/* Check another */}
              <button onClick={handleReset} style={{
                width: "100%", padding: "11px",
                background: "linear-gradient(135deg, #0F766E, #0D9488)",
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
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(22,163,74,0.35); }
          50%       { box-shadow: 0 4px 24px rgba(22,163,74,0.65); }
        }
      `}</style>
    </>
  );
}