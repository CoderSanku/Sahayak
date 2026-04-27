import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Phone, Mail, MapPin, Home,
  FileText, Send, Loader2, CheckCircle, Camera,
} from "lucide-react";
import { supabase } from "../supabaseClient";

function generateAppId() {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APP-${yy}${mm}${dd}-${rand}`;
}

const LABELS = {
  en: {
    title: "Apply for Certificate",
    subtitle: "Fill your details to submit",
    name: "Full Name *",
    phone: "Phone Number *",
    email: "Email Address (optional)",
    taluka: "Taluka *",
    village: "Village / Area *",
    submit: "Submit Application",
    submitting: "Submitting...",
    namePh: "e.g. Rahul Sharma",
    phonePh: "e.g. 9876543210",
    emailPh: "e.g. rahul@email.com",
    talukaPh: "e.g. Borivali",
    villagePh: "e.g. Dahisar East",
    successTitle: "Application Submitted!",
    successMsg: "Your application has been received. Save your Application ID.",
    appIdLabel: "Your Application ID",
    close: "Close",
    note: "Documents uploaded in this session are saved with your application.",
  },
  hi: {
    title: "प्रमाण पत्र के लिए आवेदन",
    subtitle: "आवेदन जमा करने के लिए विवरण भरें",
    name: "पूरा नाम *",
    phone: "फोन नंबर *",
    email: "ईमेल पता (वैकल्पिक)",
    taluka: "तालुका *",
    village: "गाँव / क्षेत्र *",
    submit: "आवेदन जमा करें",
    submitting: "जमा हो रहा है...",
    namePh: "जैसे राहुल शर्मा",
    phonePh: "जैसे 9876543210",
    emailPh: "जैसे rahul@email.com",
    talukaPh: "जैसे बोरिवली",
    villagePh: "जैसे दहिसर पूर्व",
    successTitle: "आवेदन जमा हो गया! 🎉",
    successMsg: "आपका आवेदन प्राप्त हो गया है। अपना आवेदन ID सुरक्षित रखें।",
    appIdLabel: "आपका आवेदन ID",
    close: "बंद करें",
    note: "इस सत्र में अपलोड किए गए दस्तावेज़ आवेदन के साथ सहेजे गए हैं।",
  },
  mr: {
    title: "प्रमाणपत्रासाठी अर्ज",
    subtitle: "अर्ज सादर करण्यासाठी तपशील भरा",
    name: "पूर्ण नाव *",
    phone: "फोन नंबर *",
    email: "ईमेल पत्ता (पर्यायी)",
    taluka: "तालुका *",
    village: "गाव / क्षेत्र *",
    submit: "अर्ज सादर करा",
    submitting: "सादर होत आहे...",
    namePh: "उदा. राहुल शर्मा",
    phonePh: "उदा. 9876543210",
    emailPh: "उदा. rahul@email.com",
    talukaPh: "उदा. बोरिवली",
    villagePh: "उदा. दहिसर पूर्व",
    successTitle: "अर्ज सादर झाला! 🎉",
    successMsg: "तुमचा अर्ज प्राप्त झाला आहे. तुमचा अर्ज ID जतन करा.",
    appIdLabel: "तुमचा अर्ज ID",
    close: "बंद करा",
    note: "या सत्रात अपलोड केलेली कागदपत्रे अर्जासोबत जतन केली आहेत.",
  },
};

const inputStyle = (hasError) => ({
  width: "100%", padding: "11px 14px", marginTop: 4,
  border: `2px solid ${hasError ? "#f87171" : "#bfdbfe"}`,
  borderRadius: 10, fontFamily: "inherit", fontSize: 13,
  color: "#334155", background: "#eff6ff", outline: "none",
  boxSizing: "border-box", transition: "border-color 0.2s",
});

const labelStyle = {
  fontSize: 12, fontWeight: 700,
  color: "#475569", display: "block", marginTop: 14,
};

export default function ApplicationForm({
  open, onClose,
  certName, certId,
  uploadedDocs,
  lang = "en",
}) {
  const [fields, setFields] = useState({ name: "", phone: "", email: "", taluka: "", village: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");
  const [errors, setErrors] = useState({});

  const L = LABELS[lang] || LABELS.en;

  if (!open) return null;

  function setField(k, v) {
    setFields(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: false }));
  }

  function validate() {
    const e = {};
    if (!fields.name.trim()) e.name = true;
    if (!fields.phone.trim()) e.phone = true;
    else if (!/^\d{10}$/.test(fields.phone.trim())) e.phone = true;
    if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) e.email = true;
    if (!fields.taluka.trim()) e.taluka = true;
    if (!fields.village.trim()) e.village = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleClose() {
    setFields({ name: "", phone: "", email: "", taluka: "", village: "" });
    setSubmitted(false); setAppId(""); setErrors({});
    onClose();
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    const id = generateAppId();

    // 1. Upload documents
    const docList = [];
    for (const [docId, file] of Object.entries(uploadedDocs || {})) {
      const filePath = `${id}/${docId}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("application-docs")
        .upload(filePath, file, { upsert: true });

      const fileUrl = uploadError
        ? null
        : supabase.storage.from("application-docs").getPublicUrl(filePath).data.publicUrl;

      // ✅ REPLACE:
      docList.push({
        application_id: id,
        doc_id: docId,
        // ✅ Use requirement name if available, fallback to uploaded filename
        file_name: file._docName || file.name,
        file_url: fileUrl,
        file_type: file.type,
      });
    }

    // 2. Insert application
    const { error: appError } = await supabase
      .from("applications")
      .insert({
        application_id: id,
        certificate_id: certId,
        certificate_name: certName,
        applicant_name: fields.name.trim(),
        phone: fields.phone.trim(),
        email: fields.email.trim() || null,
        taluka: fields.taluka.trim(),
        village: fields.village.trim(),
        status: "pending",
      });

    if (appError) {
      console.error("Application insert error:", appError);
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    // 3. Insert documents
    if (docList.length > 0) {
      const { error: docError } = await supabase
        .from("application_documents")
        .insert(docList);
      if (docError) console.error("Document insert error:", docError);
    }

    setSubmitting(false);
    setAppId(id);
    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 1300, backdropFilter: "blur(4px)",
        }}
      />

      {/* Slide-in Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 420, maxWidth: "95vw",
          background: "#fff", zIndex: 1400,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(22,163,74,0.2)",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
          padding: "18px 20px 14px",
          flexShrink: 0, position: "relative",
        }}>
          {/* Tricolor */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #ff6b00 33%, #fff 33% 66%, #10b981 66%)",
          }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                color: "#fff", fontWeight: 800, fontSize: 16,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <FileText style={{ width: 18, height: 18 }} />
                {L.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {certName}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", width: 32, height: 32, borderRadius: "50%",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </motion.button>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <motion.div
              animate={{ background: "#fff" }}
              style={{ flex: 1, height: 4, borderRadius: 2 }}
            />
            <motion.div
              animate={{ background: submitted ? "#fff" : "rgba(255,255,255,0.25)" }}
              style={{ flex: 1, height: 4, borderRadius: 2 }}
            />
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ── SUCCESS STATE ── */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#f0fdf4", border: "3px solid #86efac",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <CheckCircle style={{ width: 32, height: 32, color: "#16a34a" }} />
              </div>

              <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a", marginBottom: 8 }}>
                {L.successTitle}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                {L.successMsg}
              </div>

              {/* Application ID */}
              <div style={{
                background: "#f0fdf4", border: "2px solid #86efac",
                borderRadius: 14, padding: "16px",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#16a34a",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
                }}>
                  {L.appIdLabel}
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 800, color: "#15803d",
                  letterSpacing: 2, fontFamily: "monospace",
                  background: "#fff", border: "1.5px solid #86efac",
                  borderRadius: 8, padding: "10px 16px", display: "inline-block",
                }}>
                  {appId}
                </div>
                <div style={{
                  fontSize: 11, color: "#64748b", marginTop: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <Camera style={{ width: 12, height: 12 }} />
                  Take a screenshot to save this ID
                </div>
              </div>

              {/* Note */}
              <div style={{
                marginTop: 14, fontSize: 12, color: "#065f46",
                background: "#ecfdf5", padding: "10px 14px",
                borderRadius: 10, textAlign: "left", lineHeight: 1.6,
                border: "1px solid #a7f3d0",
                display: "flex", alignItems: "flex-start", gap: 6,
              }}>
                <FileText style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2 }} />
                {L.note}
              </div>
            </motion.div>

          ) : (
            /* ── FORM STATE ── */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                {L.subtitle}
              </div>

              {/* Name */}
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <User style={{ width: 12, height: 12 }} />
                  {L.name}
                </span>
              </label>
              <input style={inputStyle(errors.name)} value={fields.name}
                onChange={e => setField("name", e.target.value)}
                placeholder={L.namePh}
              />
              {errors.name && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</div>}

              {/* Phone */}
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone style={{ width: 12, height: 12 }} />
                  {L.phone}
                </span>
              </label>
              <input style={inputStyle(errors.phone)} value={fields.phone}
                onChange={e => setField("phone", e.target.value)}
                placeholder={L.phonePh} type="tel" maxLength={10}
              />
              {errors.phone && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>
                {!fields.phone.trim() ? "Required" : "Enter valid 10-digit number"}
              </div>}

              {/* Email */}
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Mail style={{ width: 12, height: 12 }} />
                  {L.email}
                </span>
              </label>
              <input style={inputStyle(errors.email)} value={fields.email}
                onChange={e => setField("email", e.target.value)}
                placeholder={L.emailPh} type="email"
              />
              {errors.email && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Enter valid email</div>}

              {/* Taluka */}
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  {L.taluka}
                </span>
              </label>
              <input style={inputStyle(errors.taluka)} value={fields.taluka}
                onChange={e => setField("taluka", e.target.value)}
                placeholder={L.talukaPh}
              />
              {errors.taluka && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</div>}

              {/* Village */}
              <label style={labelStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Home style={{ width: 12, height: 12 }} />
                  {L.village}
                </span>
              </label>
              <input style={inputStyle(errors.village)} value={fields.village}
                onChange={e => setField("village", e.target.value)}
                placeholder={L.villagePh}
              />
              {errors.village && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Required</div>}

              {/* Doc count */}
              <div style={{
                marginTop: 16, background: "#ecfdf5",
                border: "2px solid #a7f3d0", borderRadius: 10,
                padding: "10px 14px", fontSize: 12, color: "#065f46", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <FileText style={{ width: 14, height: 14 }} />
                {Object.keys(uploadedDocs || {}).length} document(s) will be submitted
              </div>

              <div style={{ height: 16 }} />
            </motion.div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: "12px 20px",
          borderTop: "2px solid #ecfdf5",
          flexShrink: 0,
        }}>
          {submitted ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              style={{
                width: "100%", padding: "12px",
                background: "linear-gradient(135deg, #047857, #10b981)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
              }}
            >
              {L.close}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%", padding: "12px",
                background: submitting
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #047857, #10b981)",
                border: "none", borderRadius: 12,
                color: submitting ? "#94a3b8" : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: submitting ? "none" : "0 4px 15px rgba(16,185,129,0.3)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  {L.submitting}
                </>
              ) : (
                <>
                  <Send style={{ width: 16, height: 16 }} />
                  {L.submit}
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}