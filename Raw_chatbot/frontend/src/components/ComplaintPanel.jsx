// src/components/ComplaintPanel.jsx
// Slide-in panel from right for filing complaints.
// All data comes from backend/knowledge_base/T4_documents/complaint_templates.json
// No backend API needed — templates are loaded from the static JSON file served
// by the backend at /static path, OR we embed the template logic in frontend
// since the backend has no complaint route yet.
//
// Flow:
//   Step 1 → Choose complaint type (6 types from T4 JSON)
//   Step 2 → Fill in required fields (name, phone, cert name, date, etc.)
//   Step 3 → View generated letter (formal + email) with copy/download

import { useState } from "react";
import { supabase } from "../supabaseClient";

// ── COMPLAINT TEMPLATES (mirrors T4_documents/complaint_templates.json) ──────
// Loaded here in frontend since backend has no /complaint route yet.
// Variables: {certificate_name} {application_date} {office_address}
//            {applicant_name} {contact_number} {issue_details}

const TEMPLATES = {
  en: [
    {
      code: "C1", emoji: "⏳",
      title: "Delay in Certificate Issuance",
      needsCert: true, needsDate: true, needsOffice: true, needsIssue: false,
      subject: "Regarding delay in issuance of {certificate_name}",
      body: `To,\nThe Tehsildar,\n{office_address}\n\nRespected Sir/Madam,\n\nI would like to inform you that I applied for {certificate_name} on {application_date}. However, the certificate has not been issued till date.\n\nI kindly request you to look into the matter and take necessary action at the earliest.\n\nThanking you,\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C2", emoji: "❌",
      title: "Rejection Without Proper Reason",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "Regarding rejection of {certificate_name}",
      body: `Respected Sir/Madam,\n\nMy application for {certificate_name} has been rejected without a clear explanation.\n\nI request clarification and reconsideration of my application.\n\nYours sincerely,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C3", emoji: "✏️",
      title: "Incorrect Details in Certificate",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "Correction required in {certificate_name}",
      body: `Respected Sir/Madam,\n\nThere are incorrect details in my issued {certificate_name}.\n\nI request correction at the earliest.\n\nYours sincerely,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C4", emoji: "🚫",
      title: "Staff Misconduct",
      needsCert: false, needsDate: false, needsOffice: true, needsIssue: true,
      subject: "Complaint regarding staff behavior",
      body: `To,\nThe Tehsildar,\n{office_address}\n\nRespected Sir/Madam,\n\nI wish to report inappropriate behavior by office staff.\n\n{issue_details}\n\nI request appropriate action at the earliest.\n\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C5", emoji: "💻",
      title: "Online Portal Issue",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "Issue faced on online portal",
      body: `Respected Sir/Madam,\n\nI am facing technical issues while using the online portal.\n\n{issue_details}\n\nKindly look into the matter and resolve it at the earliest.\n\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C6", emoji: "📝",
      title: "General Grievance",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "General Grievance",
      body: `Respected Sir/Madam,\n\n{issue_details}\n\nKindly take necessary action.\n\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
  ],
  hi: [
    {
      code: "C1", emoji: "⏳",
      title: "प्रमाण पत्र जारी करने में विलंब",
      needsCert: true, needsDate: true, needsOffice: true, needsIssue: false,
      subject: "{certificate_name} जारी करने में विलंब के संबंध में",
      body: `सेवा में,\nतहसीलदार महोदय/महोदया,\n{office_address}\n\nसादर निवेदन है कि मैंने {application_date} को {certificate_name} के लिए आवेदन किया था। लेकिन अभी तक प्रमाण पत्र जारी नहीं किया गया है।\n\nकृपया इस विषय पर आवश्यक कार्रवाई करने की कृपा करें।\n\nधन्यवाद।\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C2", emoji: "❌",
      title: "बिना उचित कारण के आवेदन अस्वीकृत",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} आवेदन अस्वीकृति के संबंध में",
      body: `सादर निवेदन है कि मेरा {certificate_name} आवेदन बिना उचित कारण के अस्वीकृत कर दिया गया है।\n\nकृपया स्पष्टीकरण प्रदान करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C3", emoji: "✏️",
      title: "प्रमाण पत्र में गलत विवरण",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} में सुधार हेतु",
      body: `मेरे {certificate_name} में गलत जानकारी है।\n\nकृपया सुधार करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C4", emoji: "🚫",
      title: "कार्यालय स्टाफ का दुर्व्यवहार",
      needsCert: false, needsDate: false, needsOffice: true, needsIssue: true,
      subject: "कार्यालय स्टाफ के व्यवहार के संबंध में",
      body: `सेवा में,\nतहसीलदार महोदय,\n{office_address}\n\nमैं कार्यालय स्टाफ के अनुचित व्यवहार की शिकायत करना चाहता/चाहती हूँ।\n\n{issue_details}\n\nकृपया आवश्यक कार्रवाई करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C5", emoji: "💻",
      title: "ऑनलाइन पोर्टल समस्या",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "ऑनलाइन पोर्टल समस्या",
      body: `ऑनलाइन पोर्टल का उपयोग करते समय समस्या आ रही है।\n\n{issue_details}\n\nकृपया आवश्यक कार्रवाई करें।\n\nसादर,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C6", emoji: "📝",
      title: "सामान्य शिकायत",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "सामान्य शिकायत",
      body: `{issue_details}\n\nकृपया आवश्यक कार्रवाई करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
  ],
  mr: [
    {
      code: "C1", emoji: "⏳",
      title: "प्रमाणपत्र देण्यात विलंब",
      needsCert: true, needsDate: true, needsOffice: true, needsIssue: false,
      subject: "{certificate_name} देण्यात विलंबाबाबत",
      body: `प्रति,\nतहसीलदार साहेब/साहेबा,\n{office_address}\n\nमहोदय/महोदया,\n\nमी {application_date} रोजी {certificate_name} साठी अर्ज केला आहे. तथापि अद्याप प्रमाणपत्र मिळालेले नाही.\n\nकृपया या बाबीकडे लक्ष देऊन आवश्यक कार्यवाही करावी.\n\nधन्यवाद.\nआपला विश्वासू,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C2", emoji: "❌",
      title: "अर्ज अयोग्य कारणामुळे नामंजूर",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} अर्ज नामंजुरी बाबत",
      body: `माझा {certificate_name} अर्ज कोणतेही स्पष्ट कारण न देता नामंजूर करण्यात आला आहे.\n\nकृपया पुनर्विचार करावा.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C3", emoji: "✏️",
      title: "प्रमाणपत्रातील चुकीची माहिती",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} दुरुस्ती बाबत",
      body: `माझ्या {certificate_name} मध्ये चुकीची माहिती आहे.\n\nकृपया दुरुस्ती करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C4", emoji: "🚫",
      title: "कार्यालयीन कर्मचाऱ्यांचे गैरवर्तन",
      needsCert: false, needsDate: false, needsOffice: true, needsIssue: true,
      subject: "कर्मचारी गैरवर्तन बाबत",
      body: `प्रति,\nतहसीलदार साहेब/साहेबा,\n{office_address}\n\nकार्यालयीन कर्मचाऱ्यांच्या गैरवर्तनाबाबत तक्रार करीत आहे.\n\n{issue_details}\n\nकृपया आवश्यक कार्यवाही करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C5", emoji: "💻",
      title: "ऑनलाइन पोर्टल समस्या",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "ऑनलाइन पोर्टल अडचण",
      body: `ऑनलाइन पोर्टल वापरताना अडचण येत आहे.\n\n{issue_details}\n\nकृपया आवश्यक कार्यवाही करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C6", emoji: "📝",
      title: "सामान्य तक्रार",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "सामान्य तक्रार",
      body: `{issue_details}\n\nकृपया आवश्यक कार्यवाही करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
  ],
};

const LABELS = {
  en: {
    title: "📝 File a Complaint",
    subtitle: "Choose complaint type",
    name: "Your Full Name *",
    phone: "Contact Number *",
    certName: "Certificate Name *",
    date: "Application Date *",
    office: "Tehsildar Office Address *",
    issue: "Describe your Issue *",
    generate: "Generate Letter",
    back: "← Back",
    copyLetter: "📋 Copy Letter",
    download: "⬇️ Download",
    copied: "✅ Copied!",
    letterTitle: "Generated Complaint Letter",
    step1: "Select Complaint Type",
    step2: "Fill Details",
    step3: "Your Letter",
  },
  hi: {
    title: "📝 शिकायत दर्ज करें",
    subtitle: "शिकायत का प्रकार चुनें",
    name: "पूरा नाम *",
    phone: "संपर्क नंबर *",
    certName: "प्रमाण पत्र का नाम *",
    date: "आवेदन की तारीख *",
    office: "तहसीलदार कार्यालय का पता *",
    issue: "समस्या का विवरण *",
    generate: "पत्र तैयार करें",
    back: "← वापस",
    copyLetter: "📋 कॉपी करें",
    download: "⬇️ डाउनलोड",
    copied: "✅ कॉपी हो गया!",
    letterTitle: "तैयार शिकायत पत्र",
    step1: "शिकायत प्रकार चुनें",
    step2: "विवरण भरें",
    step3: "आपका पत्र",
  },
  mr: {
    title: "📝 तक्रार दाखल करा",
    subtitle: "तक्रारीचा प्रकार निवडा",
    name: "पूर्ण नाव *",
    phone: "संपर्क क्रमांक *",
    certName: "प्रमाणपत्राचे नाव *",
    date: "अर्जाची तारीख *",
    office: "तहसीलदार कार्यालयाचा पत्ता *",
    issue: "समस्येचे वर्णन *",
    generate: "पत्र तयार करा",
    back: "← मागे",
    copyLetter: "📋 कॉपी करा",
    download: "⬇️ डाउनलोड",
    copied: "✅ कॉपी झाले!",
    letterTitle: "तयार तक्रार पत्र",
    step1: "तक्रार प्रकार निवडा",
    step2: "तपशील भरा",
    step3: "आपले पत्र",
  },
};

export default function ComplaintPanel({ open, onClose, lang = "en" }) {
  const [step, setStep]         = useState(1); // 1=type, 2=form, 3=letter
  const [selected, setSelected] = useState(null);
  const [fields, setFields]     = useState({
    applicant_name: "", contact_number: "",
    certificate_name: "", application_date: "",
    office_address: "", issue_details: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [copied, setCopied]         = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");

  const [errors, setErrors] = useState({});

  const L = LABELS[lang] || LABELS.en;
  const templates = TEMPLATES[lang] || TEMPLATES.en;

  if (!open) return null;

  function validateFields() {
    const e = {};
    if (!fields.applicant_name.trim()) e.applicant_name = true;
    
    const phoneRegex = /^\d{10}$/;
    if (!fields.contact_number.trim()) e.contact_number = true;
    else if (!phoneRegex.test(fields.contact_number.trim())) e.contact_number = true;
    
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function resetAll() {
    setStep(1);
    setSelected(null);
    setFields({ applicant_name: "", contact_number: "",
      certificate_name: "", application_date: "",
      office_address: "", issue_details: "" });
    setGeneratedLetter("");
    setCopied(false);
    setSubmitted(false);
    setSubmitting(false);
    setSubmittedId("");
  }

  function handleClose() { resetAll(); onClose(); }

  function handleSelectType(tpl) {
    setSelected(tpl);
    setStep(2);
  }

  function handleField(k, v) {
    setFields((prev) => ({ ...prev, [k]: v }));
  }

  function handleGenerate() {
    if (!validateFields()) return;
    
    let letter = selected.body;
    letter = letter.replace(/{applicant_name}/g,    fields.applicant_name    || "___");
    letter = letter.replace(/{contact_number}/g,    fields.contact_number    || "___");
    letter = letter.replace(/{certificate_name}/g,  fields.certificate_name  || "___");
    letter = letter.replace(/{application_date}/g,  fields.application_date  || "___");
    letter = letter.replace(/{office_address}/g,    fields.office_address    || "___");
    letter = letter.replace(/{issue_details}/g,     fields.issue_details     || "___");
    setGeneratedLetter(letter);
    setStep(3);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generatedLetter], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `complaint_${selected?.code || "letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmitToDb() {
    setSubmitting(true);

    const complaint = {
      complaint_id:   "CMP-" + Date.now(),
      complaint_code: selected?.code,
      complaint_type: selected?.title,
      applicant_name: fields.applicant_name,
      phone:          fields.contact_number,
      certificate_name: fields.certificate_name || null,
      application_date: fields.application_date || null,
      office_address:   fields.office_address   || null,
      issue_details:    fields.issue_details     || null,
      letter_text:      generatedLetter,
      language:         lang,
      submitted_at:     new Date().toISOString(),
      status:           "pending",
    };

    const { error } = await supabase
      .from("complaints")
      .insert({
        complaint_id:     complaint.complaint_id,
        complaint_code:   complaint.complaint_code,
        complaint_type:   complaint.complaint_type,
        applicant_name:   complaint.applicant_name,
        phone:            complaint.phone,
        certificate_name: complaint.certificate_name,
        application_date: complaint.application_date,
        office_address:   complaint.office_address,
        issue_details:    complaint.issue_details,
        letter_text:      complaint.letter_text,
        language:         complaint.language,
        status:           "pending",
      });

    if (error) {
      console.error("Complaint insert error:", error);
      alert("Failed to submit complaint. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setSubmittedId(complaint.complaint_id);
    setSubmitted(true);
  }

  // ── Shared input style ──
  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: "1.5px solid #E5E7EB", borderRadius: 8,
    fontFamily: "inherit", fontSize: 13, color: "#1C1C2E",
    background: "#FAFAFA", outline: "none",
    marginTop: 4, boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginTop: 10 };

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
        boxShadow: "-8px 0 32px rgba(26,35,126,0.18)",
        animation: "slideInRight 0.25s ease",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #1A237E, #0048A8)",
          padding: "18px 20px 14px", flexShrink: 0, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{L.title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {step === 1 ? L.step1 : step === 2 ? L.step2 : L.step3}
              </div>
            </div>
            <button onClick={handleClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              width: 32, height: 32, borderRadius: "50%", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= s ? "#FF6B00" : "rgba(255,255,255,0.25)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* STEP 1 — Choose complaint type */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>{L.subtitle}</div>
              {templates.map((tpl) => (
                <button key={tpl.code} onClick={() => handleSelectType(tpl)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", marginBottom: 8,
                  background: "#FAFAFA", border: "1.5px solid #E5E7EB",
                  borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0048A8"; e.currentTarget.style.background = "#EEF3FF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#FAFAFA"; }}
                >
                  <span style={{ fontSize: 22 }}>{tpl.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A237E" }}>{tpl.title}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Code: {tpl.code}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "#0048A8", fontSize: 16 }}>→</span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2 — Fill form */}
          {step === 2 && selected && (
            <div>
              <div style={{
                background: "#EEF3FF", borderRadius: 10, padding: "10px 14px",
                marginBottom: 14, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{selected.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A237E" }}>{selected.title}</span>
              </div>

              {/* Always required */}
              <label style={labelStyle}>{L.name}</label>
              <input style={inputStyle} value={fields.applicant_name}
                onChange={(e) => handleField("applicant_name", e.target.value)}
                placeholder="e.g. Rahul Sharma" />

              <label style={labelStyle}>{L.phone}</label>
              <input style={inputStyle} value={fields.contact_number}
                onChange={(e) => handleField("contact_number", e.target.value)}
                placeholder="e.g. 9876543210" type="tel" maxLength={10} />
              {errors.contact_number && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>
                {!fields.contact_number.trim() ? "Required" : "Enter valid 10-digit phone number"}
              </div>}

              {/* Conditional fields */}
              {selected.needsCert && (
                <>
                  <label style={labelStyle}>{L.certName}</label>
                  <input style={inputStyle} value={fields.certificate_name}
                    onChange={(e) => handleField("certificate_name", e.target.value)}
                    placeholder="e.g. Caste Certificate" />
                </>
              )}

              {selected.needsDate && (
                <>
                  <label style={labelStyle}>{L.date}</label>
                  <input style={inputStyle} value={fields.application_date}
                    onChange={(e) => handleField("application_date", e.target.value)}
                    type="date" />
                </>
              )}

              {selected.needsOffice && (
                <>
                  <label style={labelStyle}>{L.office}</label>
                  <input style={inputStyle} value={fields.office_address}
                    onChange={(e) => handleField("office_address", e.target.value)}
                    placeholder="e.g. Tehsildar Office, Borivali, Mumbai - 400092" />
                </>
              )}

              {selected.needsIssue && (
                <>
                  <label style={labelStyle}>{L.issue}</label>
                  <textarea style={{ ...inputStyle, height: 90, resize: "vertical" }}
                    value={fields.issue_details}
                    onChange={(e) => handleField("issue_details", e.target.value)}
                    placeholder="Describe your issue in detail..." />
                </>
              )}

              <div style={{ height: 16 }} />
            </div>
          )}

          {/* STEP 3 — Generated letter */}
          {step === 3 && (
            <div>
              <div style={{
                background: "#F0FDF4", border: "1.5px solid #86EFAC",
                borderRadius: 10, padding: "10px 14px", marginBottom: 12,
                fontSize: 12, fontWeight: 700, color: "#16A34A",
              }}>
                ✅ Letter generated successfully. Copy or download below.
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280",
                marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                {L.letterTitle}
              </div>
              <div style={{
                background: "#FFFDF7", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "14px",
                fontSize: 13, lineHeight: 1.8, color: "#1C1C2E",
                whiteSpace: "pre-wrap", fontFamily: "'Baloo 2', sans-serif",
              }}>
                {generatedLetter}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid #F3F4F6",
          flexShrink: 0, display: "flex", gap: 8,
        }}>
          {/* Back button */}
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{
              flex: 1, padding: "11px", background: "#F9FAFB",
              border: "1.5px solid #E5E7EB", borderRadius: 10,
              fontSize: 13, fontWeight: 700, color: "#374151",
              cursor: "pointer", fontFamily: "inherit",
            }}>{L.back}</button>
          )}

          {/* Generate button (step 2) */}
          {step === 2 && (
            <button onClick={handleGenerate}
              disabled={!fields.applicant_name || !fields.contact_number}
              style={{
                flex: 2, padding: "11px",
                background: !fields.applicant_name || !fields.contact_number
                  ? "#E5E7EB" : "linear-gradient(135deg, #FF6B00, #E05500)",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 800, color: "#fff",
                cursor: !fields.applicant_name || !fields.contact_number ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}>
              {L.generate}
            </button>
          )}

          {/* Copy + Download + Submit buttons (step 3) */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              {/* Submitted ID box — shown after submission */}
              {submitted && submittedId && (
                <div style={{
                  background: "#F0FDF4", border: "2px solid #86EFAC",
                  borderRadius: 12, padding: "14px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A",
                    textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {lang === "mr" ? "✅ तक्रार यशस्वीरित्या सादर झाली" : lang === "hi" ? "✅ शिकायत सफलतापूर्वक जमा हुई" : "✅ Complaint Submitted Successfully"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>
                    {lang === "mr" ? "तुमचा तक्रार ID जतन करा:" : lang === "hi" ? "अपना शिकायत ID सुरक्षित रखें:" : "Save your Complaint ID:"}
                  </div>
                  <div style={{
                    fontSize: 20, fontWeight: 800, color: "#15803D",
                    letterSpacing: 2, fontFamily: "monospace",
                    background: "#fff", border: "1.5px solid #86EFAC",
                    borderRadius: 8, padding: "8px 12px", display: "inline-block",
                  }}>
                    {submittedId}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
                    {lang === "mr" ? "स्थिती तपासण्यासाठी हा ID वापरा" : lang === "hi" ? "स्थिति जाँचने के लिए इस ID का उपयोग करें" : "Use this ID to track your complaint status"}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCopy} style={{
                  flex: 1, padding: "10px",
                  background: copied ? "#F0FDF4" : "linear-gradient(135deg, #0048A8, #1A237E)",
                  border: copied ? "1.5px solid #86EFAC" : "none",
                  borderRadius: 10, fontSize: 12, fontWeight: 700,
                  color: copied ? "#16A34A" : "#fff",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                }}>
                  {copied ? L.copied : L.copyLetter}
                </button>
                <button onClick={handleDownload} style={{
                  flex: 1, padding: "10px",
                  background: "linear-gradient(135deg, #138808, #0F6B06)",
                  border: "none", borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  {L.download}
                </button>
              </div>
              {/* Submit to DB button */}
              <button
                onClick={handleSubmitToDb}
                disabled={submitting || submitted}
                style={{
                  width: "100%", padding: "11px",
                  background: submitted
                    ? "#F0FDF4"
                    : submitting
                      ? "#E5E7EB"
                      : "linear-gradient(135deg, #FF6B00, #E05500)",
                  border: submitted ? "1.5px solid #86EFAC" : "none",
                  borderRadius: 10, fontSize: 13, fontWeight: 800,
                  color: submitted ? "#16A34A" : submitting ? "#9CA3AF" : "#fff",
                  cursor: submitted || submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.2s",
                }}
              >
                {submitted
                  ? "✅ Complaint Submitted to Admin"
                  : submitting
                    ? "Submitting..."
                    : "📤 Submit Complaint to Admin Panel"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}