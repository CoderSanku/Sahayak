import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, ClipboardCheck, Clock, CheckCircle,
  AlertCircle, Download, RefreshCw, Info,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const STATUS_CONFIG = {
  pending: {
    icon: Clock, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a",
    en: "Application Pending", hi: "आवेदन लंबित", mr: "अर्ज प्रलंबित",
    descEn: "Your application has been received and is waiting to be reviewed.",
    descHi: "आपका आवेदन प्राप्त हो गया है और समीक्षा की प्रतीक्षा में है।",
    descMr: "तुमचा अर्ज प्राप्त झाला आहे आणि तपासणीची प्रतीक्षा आहे.",
  },
  approved: {
    icon: CheckCircle, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
    en: "Application Approved", hi: "आवेदन स्वीकृत", mr: "अर्ज मंजूर",
    descEn: "Your application has been approved. Certificate is being processed.",
    descHi: "आपका आवेदन स्वीकृत कर दिया गया है। प्रमाण पत्र तैयार हो रहा है।",
    descMr: "तुमचा अर्ज मंजूर झाला आहे. प्रमाणपत्र तयार होत आहे.",
  },
  generated: {
    icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", border: "#86efac",
    en: "Certificate Generated", hi: "प्रमाण पत्र जारी", mr: "प्रमाणपत्र तयार",
    descEn: "Your certificate is ready! Visit the Tehsildar office to collect it.",
    descHi: "आपका प्रमाण पत्र तैयार है! कार्यालय जाकर प्राप्त करें।",
    descMr: "तुमचे प्रमाणपत्र तयार आहे! कार्यालयात जाऊन घ्या.",
  },
  rejected: {
    icon: AlertCircle, color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
    en: "Application Rejected", hi: "आवेदन अस्वीकृत", mr: "अर्ज नामंजूर",
    descEn: "Your application was rejected. Please contact the Tehsildar office.",
    descHi: "आपका आवेदन अस्वीकृत हो गया। कृपया कार्यालय से संपर्क करें।",
    descMr: "तुमचा अर्ज नामंजूर झाला. कार्यालयाशी संपर्क करा.",
  },
};

const TIMELINE = [
  { key: "pending", en: "Submitted", hi: "जमा हुआ", mr: "सादर केले" },
  { key: "approved", en: "Approved", hi: "स्वीकृत", mr: "मंजूर" },
  { key: "generated", en: "Ready", hi: "तैयार", mr: "तयार" },
];
const STATUS_ORDER = { pending: 0, approved: 1, generated: 2, rejected: -1 };

const LABELS = {
  en: { title: "Check Application Status", inputLabel: "Enter your Application ID", placeholder: "e.g. APP-260323-4821", check: "Check", checking: "Checking...", notFound: "Application ID not found.", error: "Could not fetch status.", certName: "Certificate", name: "Applicant", submittedAt: "Submitted", adminNote: "Admin Note", tryAnother: "Check Another", downloadCert: "Download Certificate" },
  hi: { title: "आवेदन स्थिति जाँचें", inputLabel: "आवेदन ID दर्ज करें", placeholder: "जैसे APP-260323-4821", check: "जाँचें", checking: "जाँच हो रही है...", notFound: "आवेदन ID नहीं मिली।", error: "स्थिति प्राप्त नहीं हो सकी।", certName: "प्रमाण पत्र", name: "आवेदक", submittedAt: "जमा तारीख", adminNote: "Admin टिप्पणी", tryAnother: "दूसरा जाँचें", downloadCert: "प्रमाण पत्र डाउनलोड" },
  mr: { title: "अर्जाची स्थिती तपासा", inputLabel: "अर्ज ID प्रविष्ट करा", placeholder: "उदा. APP-260323-4821", check: "तपासा", checking: "तपासत आहे...", notFound: "अर्ज ID सापडला नाही.", error: "स्थिती मिळवता आली नाही.", certName: "प्रमाणपत्र", name: "अर्जदार", submittedAt: "सादर तारीख", adminNote: "Admin टिप्पणी", tryAnother: "दुसरे तपासा", downloadCert: "प्रमाणपत्र डाउनलोड" },
};

export default function StatusPanel({ open, onClose, lang = "en" }) {
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const L = LABELS[lang] || LABELS.en;
  if (!open) return null;

  function handleClose() { setAppId(""); setResult(null); setError(null); setLoading(false); onClose(); }
  function handleReset() { setAppId(""); setResult(null); setError(null); }

  async function handleCheck() {
    const trimmed = appId.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data, error: supaErr } = await supabase.from("applications").select("*").eq("application_id", trimmed).single();
      if (supaErr || !data) setError("not_found");
      else setResult(data);
    } catch { setError("error"); }
    finally { setLoading(false); }
  }

  const statusCfg = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.pending) : null;
  const statusOrder = result ? (STATUS_ORDER[result.status] ?? 0) : 0;
  const isRejected = result?.status === "rejected";
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1100, backdropFilter: "blur(4px)" }}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 420, maxWidth: "95vw",
          background: "#fff", zIndex: 1200,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(37,99,235,0.2)",
        }}
      >
        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
          padding: "18px 20px 14px", flexShrink: 0, position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #ff6b00 33%, #fff 33% 66%, #10b981 66%)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardCheck style={{ width: 18, height: 18 }} />
                {L.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {lang === "mr" ? "अर्जाची सद्यस्थिती तपासा" : lang === "hi" ? "वर्तमान स्थिति देखें" : "Track your application in real-time"}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X style={{ width: 16, height: 16 }} />
            </motion.button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

          {/* SEARCH */}
          {!result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                {L.inputLabel}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={appId}
                  onChange={(e) => { setAppId(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                  placeholder={L.placeholder}
                  style={{
                    flex: 1, padding: "11px 14px",
                    border: `2px solid ${error ? "#f87171" : "#bfdbfe"}`,
                    borderRadius: 10, fontFamily: "inherit", fontSize: 14,
                    color: "#334155", background: "#eff6ff", outline: "none", letterSpacing: 1,
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleCheck}
                  disabled={loading || !appId.trim()}
                  style={{
                    padding: "11px 16px",
                    background: loading || !appId.trim() ? "#e2e8f0" : "linear-gradient(135deg, #0f766e, #0d9488)",
                    border: "none", borderRadius: 10,
                    color: loading || !appId.trim() ? "#94a3b8" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: loading || !appId.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <Search style={{ width: 15, height: 15 }} />
                  {loading ? L.checking : L.check}
                </motion.button>
              </div>

              {error === "not_found" && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 10, padding: "10px 14px", background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle style={{ width: 14, height: 14 }} />
                  {L.notFound}
                </motion.div>
              )}

              {error === "error" && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 10, padding: "10px 14px", background: "#fff7ed", border: "2px solid #fed7aa", borderRadius: 10, fontSize: 13, color: "#ea580c", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle style={{ width: 14, height: 14 }} />
                  {L.error}
                </motion.div>
              )}

              <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0fdfa", border: "2px solid #99f6e4", borderRadius: 12, fontSize: 12, color: "#0f766e", lineHeight: 1.7, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Info style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }} />
                <span>
                  {lang === "mr" ? "तुमचा Application ID अर्ज सादर केल्यावर मिळाला होता. उदा: APP-260323-4821"
                    : lang === "hi" ? "आपका Application ID आवेदन जमा करने पर मिला था। जैसे: APP-260323-4821"
                      : "Your Application ID was shown when you submitted. e.g. APP-260323-4821"}
                </span>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {result && statusCfg && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Status badge */}
              <div style={{
                background: statusCfg.bg, border: `2px solid ${statusCfg.border}`,
                borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16,
                boxShadow: `0 4px 20px ${statusCfg.color}25`,
              }}>
                {(() => { const Icon = statusCfg.icon; return <Icon style={{ width: 44, height: 44, color: statusCfg.color, margin: "0 auto 10px", display: "block" }} />; })()}
                <div style={{ fontSize: 18, fontWeight: 800, color: statusCfg.color, marginBottom: 6 }}>
                  {statusCfg[lang] || statusCfg.en}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                  {statusCfg[`desc${lang.charAt(0).toUpperCase() + lang.slice(1)}`] || statusCfg.descEn}
                </div>
              </div>

              {/* Timeline */}
              {!isRejected && (
                <div style={{ background: "#eff6ff", borderRadius: 14, padding: "16px", marginBottom: 14, border: "2px solid #bfdbfe" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                    {lang === "mr" ? "प्रगती" : lang === "hi" ? "प्रगति" : "Progress"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {TIMELINE.map((step, i) => {
                      const done = STATUS_ORDER[result.status] >= i;
                      const active = STATUS_ORDER[result.status] === i;
                      const label = lang === "hi" ? step.hi : lang === "mr" ? step.mr : step.en;
                      return (
                        <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                            {i > 0 && <div style={{ flex: 1, height: 3, background: STATUS_ORDER[result.status] >= i ? "#0d9488" : "#bfdbfe", borderRadius: 2 }} />}
                            <motion.div
                              animate={{ scale: active ? [1, 1.1, 1] : 1 }}
                              transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
                              style={{
                                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: done ? "#0d9488" : "#e2e8f0",
                                border: active ? "3px solid #0f766e" : "none",
                                fontSize: 12, color: done ? "#fff" : "#94a3b8", fontWeight: 800,
                                boxShadow: active ? "0 0 0 4px rgba(13,148,136,0.2)" : "none",
                              }}
                            >
                              {done ? "✓" : i + 1}
                            </motion.div>
                            {i < TIMELINE.length - 1 && <div style={{ flex: 1, height: 3, background: STATUS_ORDER[result.status] > i ? "#0d9488" : "#bfdbfe", borderRadius: 2 }} />}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 10, fontWeight: active ? 800 : 600, color: done ? "#0f766e" : "#94a3b8", textAlign: "center" }}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Details */}
              <div style={{ background: "#eff6ff", borderRadius: 14, padding: "14px 16px", marginBottom: 14, border: "2px solid #bfdbfe" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  {lang === "mr" ? "अर्जाचा तपशील" : lang === "hi" ? "आवेदन विवरण" : "Application Details"}
                </div>
                {[
                  { label: "Application ID", value: result.application_id, mono: true },
                  { label: L.certName, value: result.certificate_name },
                  { label: L.name, value: result.applicant_name },
                  { label: L.submittedAt, value: fmt(result.submitted_at || result.created_at) },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #bfdbfe" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", fontFamily: mono ? "monospace" : "inherit" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Admin note */}
              {result.admin_note && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: "#fffbeb", border: "2px solid #fde68a", borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <Info style={{ width: 14, height: 14, color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>{L.adminNote}</div>
                    <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>{result.admin_note}</div>
                  </div>
                </motion.div>
              )}

              {/* Download Certificate */}
              {result.status === "generated" && (
                result.certificate_url ? (
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(22,163,74,0.45)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        const res = await fetch(result.certificate_url);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        const cleanPath = new URL(result.certificate_url).pathname;
                        a.download = decodeURIComponent(cleanPath.split("/").pop()) || "certificate.pdf";
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch { window.open(result.certificate_url, "_blank"); }
                    }}
                    style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10, padding: "14px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 15px rgba(22,163,74,0.35)" }}
                  >
                    <Download style={{ width: 18, height: 18 }} />
                    {L.downloadCert}
                  </motion.button>
                ) : (
                  <div style={{ marginBottom: 10, padding: "12px 14px", background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 12, fontSize: 12, color: "#15803d", fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <CheckCircle style={{ width: 14, height: 14 }} />
                    {lang === "mr" ? "प्रमाणपत्र तयार आहे, लवकरच उपलब्ध होईल." : lang === "hi" ? "प्रमाण पत्र तैयार है, जल्द उपलब्ध होगा।" : "Certificate ready. Download link coming soon."}
                  </div>
                )
              )}

              {/* Check another */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #0f766e, #0d9488)", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 15px rgba(13,148,136,0.3)" }}
              >
                <RefreshCw style={{ width: 15, height: 15 }} />
                {L.tryAnother}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}