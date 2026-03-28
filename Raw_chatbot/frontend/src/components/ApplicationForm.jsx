// src/components/ApplicationForm.jsx
// Shown when user clicks "Apply for Certificate" after 100% document upload.
// Collects: name, phone, email (optional), taluka, village
// On submit: inserts into Supabase applications + application_documents tables,
// uploads files to Supabase Storage, and shows confirmation with Application ID.

import { useState } from "react";
import { supabase } from "../supabaseClient";

function generateAppId() {
  const date = new Date();
  const dd   = String(date.getDate()).padStart(2, "0");
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const yy   = String(date.getFullYear()).slice(2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APP-${yy}${mm}${dd}-${rand}`;
}

const LABELS = {
  en: {
    title:       "Apply for Certificate",
    subtitle:    "Fill your details to submit the application",
    name:        "Full Name *",
    phone:       "Phone Number *",
    email:       "Email Address (optional)",
    taluka:      "Taluka *",
    village:     "Village / Area *",
    submit:      "Submit Application",
    submitting:  "Submitting...",
    namePh:      "e.g. Rahul Sharma",
    phonePh:     "e.g. 9876543210",
    emailPh:     "e.g. rahul@email.com",
    talukaPh:    "e.g. Borivali",
    villagePh:   "e.g. Dahisar East",
    successTitle:"Application Submitted! 🎉",
    successMsg:  "Your application has been received. Save your Application ID.",
    appIdLabel:  "Your Application ID",
    close:       "Close",
    note:        "📋 Note: Documents uploaded in this session are saved with your application.",
  },
  hi: {
    title:       "प्रमाण पत्र के लिए आवेदन करें",
    subtitle:    "आवेदन जमा करने के लिए विवरण भरें",
    name:        "पूरा नाम *",
    phone:       "फोन नंबर *",
    email:       "ईमेल पता (वैकल्पिक)",
    taluka:      "तालुका *",
    village:     "गाँव / क्षेत्र *",
    submit:      "आवेदन जमा करें",
    submitting:  "जमा हो रहा है...",
    namePh:      "जैसे राहुल शर्मा",
    phonePh:     "जैसे 9876543210",
    emailPh:     "जैसे rahul@email.com",
    talukaPh:    "जैसे बोरिवली",
    villagePh:   "जैसे दहिसर पूर्व",
    successTitle:"आवेदन जमा हो गया! 🎉",
    successMsg:  "आपका आवेदन प्राप्त हो गया है। अपना आवेदन ID सुरक्षित रखें।",
    appIdLabel:  "आपका आवेदन ID",
    close:       "बंद करें",
    note:        "📋 नोट: इस सत्र में अपलोड किए गए दस्तावेज़ आपके आवेदन के साथ सहेजे गए हैं।",
  },
  mr: {
    title:       "प्रमाणपत्रासाठी अर्ज करा",
    subtitle:    "अर्ज सादर करण्यासाठी तपशील भरा",
    name:        "पूर्ण नाव *",
    phone:       "फोन नंबर *",
    email:       "ईमेल पत्ता (पर्यायी)",
    taluka:      "तालुका *",
    village:     "गाव / क्षेत्र *",
    submit:      "अर्ज सादर करा",
    submitting:  "सादर होत आहे...",
    namePh:      "उदा. राहुल शर्मा",
    phonePh:     "उदा. 9876543210",
    emailPh:     "उदा. rahul@email.com",
    talukaPh:    "उदा. बोरिवली",
    villagePh:   "उदा. दहिसर पूर्व",
    successTitle:"अर्ज सादर झाला! 🎉",
    successMsg:  "तुमचा अर्ज प्राप्त झाला आहे. तुमचा अर्ज ID जतन करा.",
    appIdLabel:  "तुमचा अर्ज ID",
    close:       "बंद करा",
    note:        "📋 टीप: या सत्रात अपलोड केलेली कागदपत्रे तुमच्या अर्जासोबत जतन केली आहेत.",
  },
};

export default function ApplicationForm({
  open, onClose,
  certName, certId,
  uploadedDocs,   // { doc_id: File } from DocTracker
  lang = "en",
}) {
  const [fields, setFields] = useState({
    name: "", phone: "", email: "", taluka: "", village: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [appId, setAppId]           = useState("");
  const [errors, setErrors]         = useState({});

  const L = LABELS[lang] || LABELS.en;

  if (!open) return null;

  function setField(k, v) {
    setFields(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: false }));
  }

  function validate() {
    const e = {};
    if (!fields.name.trim())   e.name   = true;
    
    const phoneRegex = /^\d{10}$/;
    if (!fields.phone.trim()) e.phone = true;
    else if (!phoneRegex.test(fields.phone.trim())) e.phone = true;
    
    if (fields.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fields.email.trim())) e.email = true;
    }
    
    if (!fields.taluka.trim()) e.taluka = true;
    if (!fields.village.trim()) e.village = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);

    const id = generateAppId();

    // 1. Upload each document file to Supabase Storage
    const docList = [];
    for (const [docId, file] of Object.entries(uploadedDocs || {})) {
      const filePath = `${id}/${docId}_${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from("application-docs")
        .upload(filePath, file, { upsert: true });

      const fileUrl = uploadError
        ? null
        : supabase.storage.from("application-docs").getPublicUrl(filePath).data.publicUrl;

      docList.push({
        application_id: id,
        doc_id:         docId,
        file_name:      file.name,
        file_url:       fileUrl,
        file_type:      file.type,
      });
    }

    // 2. Insert application row
    const { error: appError } = await supabase
      .from("applications")
      .insert({
        application_id:   id,
        certificate_id:   certId,
        certificate_name: certName,
        applicant_name:   fields.name.trim(),
        phone:            fields.phone.trim(),
        email:            fields.email.trim() || null,
        taluka:           fields.taluka.trim(),
        village:          fields.village.trim(),
        status:           "pending",
      });

    if (appError) {
      console.error("Application insert error:", appError);
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    // 3. Insert document rows
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

  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 12px", marginTop: 4,
    border: `1.5px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8, fontFamily: "inherit", fontSize: 13,
    color: "#1C1C2E", background: "#FAFAFA", outline: "none",
    boxSizing: "border-box",
  });

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#374151",
    display: "block", marginTop: 12,
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={!submitted ? undefined : onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)", zIndex: 1300,
      }} />

      {/* Modal box — centered */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 420, maxWidth: "94vw",
        maxHeight: "90vh",
        background: "#fff", zIndex: 1400,
        borderRadius: 16, overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        animation: "scaleIn 0.22s ease",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #16A34A, #15803D)",
          padding: "16px 20px", flexShrink: 0, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
                🎉 {L.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>
                {certName}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
              width: 30, height: 30, borderRadius: "50%", fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* SUCCESS STATE */}
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#16A34A", marginBottom: 8 }}>
                {L.successTitle}
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.6 }}>
                {L.successMsg}
              </div>

              {/* Application ID box */}
              <div style={{
                background: "#F0FDF4", border: "2px solid #86EFAC",
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {L.appIdLabel}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: "#15803D",
                  letterSpacing: 2, fontFamily: "monospace",
                }}>
                  {appId}
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
                  📸 Take a screenshot to save this ID
                </div>
              </div>

              <div style={{ marginTop: 14, fontSize: 11, color: "#6B7280",
                background: "#FFFBEB", padding: "8px 12px", borderRadius: 8,
                textAlign: "left", lineHeight: 1.6 }}>
                {L.note}
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                {L.subtitle}
              </div>

              <label style={labelStyle}>{L.name}</label>
              <input style={inputStyle(errors.name)} value={fields.name}
                onChange={e => setField("name", e.target.value)}
                placeholder={L.namePh} />
              {errors.name && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>Required</div>}

              <label style={labelStyle}>{L.phone}</label>
              <input style={inputStyle(errors.phone)} value={fields.phone}
                onChange={e => setField("phone", e.target.value)}
                placeholder={L.phonePh} type="tel" maxLength={10} />
              {errors.phone && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>
                {!fields.phone.trim() ? "Required" : "Enter valid 10-digit phone number"}
              </div>}

              <label style={labelStyle}>{L.email}</label>
              <input style={inputStyle(errors.email)} value={fields.email}
                onChange={e => setField("email", e.target.value)}
                placeholder={L.emailPh} type="email" />
              {errors.email && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>Enter valid email format</div>}

              <label style={labelStyle}>{L.taluka}</label>
              <input style={inputStyle(errors.taluka)} value={fields.taluka}
                onChange={e => setField("taluka", e.target.value)}
                placeholder={L.talukaPh} />
              {errors.taluka && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>Required</div>}

              <label style={labelStyle}>{L.village}</label>
              <input style={inputStyle(errors.village)} value={fields.village}
                onChange={e => setField("village", e.target.value)}
                placeholder={L.villagePh} />
              {errors.village && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>Required</div>}

              {/* Doc count summary */}
              <div style={{
                marginTop: 14, background: "#F0FDF4",
                border: "1px solid #86EFAC", borderRadius: 8,
                padding: "8px 12px", fontSize: 12, color: "#16A34A", fontWeight: 600,
              }}>
                📂 {Object.keys(uploadedDocs || {}).length} document(s) will be submitted with this application
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: "12px 20px", borderTop: "1px solid #F3F4F6", flexShrink: 0,
        }}>
          {submitted ? (
            <button onClick={onClose} style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #16A34A, #15803D)",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>{L.close}</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} style={{
              width: "100%", padding: "12px",
              background: submitting ? "#E5E7EB" : "linear-gradient(135deg, #16A34A, #15803D)",
              border: "none", borderRadius: 10, color: submitting ? "#9CA3AF" : "#fff",
              fontSize: 14, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}>
              {submitting ? L.submitting : L.submit}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: translate(-50%, -50%) scale(0.92); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}