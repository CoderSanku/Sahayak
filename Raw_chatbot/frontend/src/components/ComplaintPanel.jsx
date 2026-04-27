import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, Copy, Download, Send,
  CheckCircle, Clock, AlertCircle, FileText,
  MessageSquare, Monitor, Pencil, Ban,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const TEMPLATES = {
  en: [
    {
      code: "C1", icon: Clock,
      title: "Delay in Certificate Issuance",
      needsCert: true, needsDate: true, needsOffice: true, needsIssue: false,
      subject: "Regarding delay in issuance of {certificate_name}",
      body: `To,\nThe Tehsildar,\n{office_address}\n\nRespected Sir/Madam,\n\nI would like to inform you that I applied for {certificate_name} on {application_date}. However, the certificate has not been issued till date.\n\nI kindly request you to look into the matter and take necessary action at the earliest.\n\nThanking you,\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C2", icon: Ban,
      title: "Rejection Without Proper Reason",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "Regarding rejection of {certificate_name}",
      body: `Respected Sir/Madam,\n\nMy application for {certificate_name} has been rejected without a clear explanation.\n\nI request clarification and reconsideration of my application.\n\nYours sincerely,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C3", icon: Pencil,
      title: "Incorrect Details in Certificate",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "Correction required in {certificate_name}",
      body: `Respected Sir/Madam,\n\nThere are incorrect details in my issued {certificate_name}.\n\nI request correction at the earliest.\n\nYours sincerely,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C4", icon: AlertCircle,
      title: "Staff Misconduct",
      needsCert: false, needsDate: false, needsOffice: true, needsIssue: true,
      subject: "Complaint regarding staff behavior",
      body: `To,\nThe Tehsildar,\n{office_address}\n\nRespected Sir/Madam,\n\nI wish to report inappropriate behavior by office staff.\n\n{issue_details}\n\nI request appropriate action at the earliest.\n\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C5", icon: Monitor,
      title: "Online Portal Issue",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "Issue faced on online portal",
      body: `Respected Sir/Madam,\n\nI am facing technical issues while using the online portal.\n\n{issue_details}\n\nKindly look into the matter and resolve it at the earliest.\n\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C6", icon: FileText,
      title: "General Grievance",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "General Grievance",
      body: `Respected Sir/Madam,\n\n{issue_details}\n\nKindly take necessary action.\n\nYours faithfully,\n{applicant_name}\n{contact_number}`,
    },
  ],
  hi: [
    {
      code: "C1", icon: Clock,
      title: "प्रमाण पत्र जारी करने में विलंब",
      needsCert: true, needsDate: true, needsOffice: true, needsIssue: false,
      subject: "{certificate_name} जारी करने में विलंब के संबंध में",
      body: `सेवा में,\nतहसीलदार महोदय/महोदया,\n{office_address}\n\nसादर निवेदन है कि मैंने {application_date} को {certificate_name} के लिए आवेदन किया था। लेकिन अभी तक प्रमाण पत्र जारी नहीं किया गया है।\n\nकृपया इस विषय पर आवश्यक कार्रवाई करने की कृपा करें।\n\nधन्यवाद।\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C2", icon: Ban,
      title: "बिना उचित कारण के आवेदन अस्वीकृत",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} आवेदन अस्वीकृति के संबंध में",
      body: `सादर निवेदन है कि मेरा {certificate_name} आवेदन बिना उचित कारण के अस्वीकृत कर दिया गया है।\n\nकृपया स्पष्टीकरण प्रदान करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C3", icon: Pencil,
      title: "प्रमाण पत्र में गलत विवरण",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} में सुधार हेतु",
      body: `मेरे {certificate_name} में गलत जानकारी है।\n\nकृपया सुधार करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C4", icon: AlertCircle,
      title: "कार्यालय स्टाफ का दुर्व्यवहार",
      needsCert: false, needsDate: false, needsOffice: true, needsIssue: true,
      subject: "कार्यालय स्टाफ के व्यवहार के संबंध में",
      body: `सेवा में,\nतहसीलदार महोदय,\n{office_address}\n\nमैं कार्यालय स्टाफ के अनुचित व्यवहार की शिकायत करना चाहता/चाहती हूँ।\n\n{issue_details}\n\nकृपया आवश्यक कार्रवाई करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C5", icon: Monitor,
      title: "ऑनलाइन पोर्टल समस्या",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "ऑनलाइन पोर्टल समस्या",
      body: `ऑनलाइन पोर्टल का उपयोग करते समय समस्या आ रही है।\n\n{issue_details}\n\nकृपया आवश्यक कार्रवाई करें।\n\nसादर,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C6", icon: FileText,
      title: "सामान्य शिकायत",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "सामान्य शिकायत",
      body: `{issue_details}\n\nकृपया आवश्यक कार्रवाई करें।\n\nभवदीय,\n{applicant_name}\n{contact_number}`,
    },
  ],
  mr: [
    {
      code: "C1", icon: Clock,
      title: "प्रमाणपत्र देण्यात विलंब",
      needsCert: true, needsDate: true, needsOffice: true, needsIssue: false,
      subject: "{certificate_name} देण्यात विलंबाबाबत",
      body: `प्रति,\nतहसीलदार साहेब/साहेबा,\n{office_address}\n\nमहोदय/महोदया,\n\nमी {application_date} रोजी {certificate_name} साठी अर्ज केला आहे. तथापि अद्याप प्रमाणपत्र मिळालेले नाही.\n\nकृपया या बाबीकडे लक्ष देऊन आवश्यक कार्यवाही करावी.\n\nधन्यवाद.\nआपला विश्वासू,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C2", icon: Ban,
      title: "अर्ज अयोग्य कारणामुळे नामंजूर",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} अर्ज नामंजुरी बाबत",
      body: `माझा {certificate_name} अर्ज कोणतेही स्पष्ट कारण न देता नामंजूर करण्यात आला आहे.\n\nकृपया पुनर्विचार करावा.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C3", icon: Pencil,
      title: "प्रमाणपत्रातील चुकीची माहिती",
      needsCert: true, needsDate: false, needsOffice: false, needsIssue: false,
      subject: "{certificate_name} दुरुस्ती बाबत",
      body: `माझ्या {certificate_name} मध्ये चुकीची माहिती आहे.\n\nकृपया दुरुस्ती करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C4", icon: AlertCircle,
      title: "कार्यालयीन कर्मचाऱ्यांचे गैरवर्तन",
      needsCert: false, needsDate: false, needsOffice: true, needsIssue: true,
      subject: "कर्मचारी गैरवर्तन बाबत",
      body: `प्रति,\nतहसीलदार साहेब/साहेबा,\n{office_address}\n\nकार्यालयीन कर्मचाऱ्यांच्या गैरवर्तनाबाबत तक्रार करीत आहे.\n\n{issue_details}\n\nकृपया आवश्यक कार्यवाही करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C5", icon: Monitor,
      title: "ऑनलाइन पोर्टल समस्या",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "ऑनलाइन पोर्टल अडचण",
      body: `ऑनलाइन पोर्टल वापरताना अडचण येत आहे.\n\n{issue_details}\n\nकृपया आवश्यक कार्यवाही करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
    {
      code: "C6", icon: FileText,
      title: "सामान्य तक्रार",
      needsCert: false, needsDate: false, needsOffice: false, needsIssue: true,
      subject: "सामान्य तक्रार",
      body: `{issue_details}\n\nकृपया आवश्यक कार्यवाही करावी.\n\nआपला,\n{applicant_name}\n{contact_number}`,
    },
  ],
};

const LABELS = {
  en: { title: "File a Complaint", step1: "Select Type", step2: "Fill Details", step3: "Your Letter", name: "Your Full Name *", phone: "Contact Number *", certName: "Certificate Name *", date: "Application Date *", office: "Tehsildar Office Address *", issue: "Describe your Issue *", generate: "Generate Letter", back: "Back", copyLetter: "Copy Letter", download: "Download", copied: "Copied!", letterTitle: "Generated Letter", submit: "Submit to Admin Panel", submitting: "Submitting...", submitted: "✅ Submitted" },
  hi: { title: "शिकायत दर्ज करें", step1: "प्रकार चुनें", step2: "विवरण भरें", step3: "आपका पत्र", name: "पूरा नाम *", phone: "संपर्क नंबर *", certName: "प्रमाण पत्र *", date: "आवेदन तारीख *", office: "कार्यालय पता *", issue: "समस्या का विवरण *", generate: "पत्र तैयार करें", back: "वापस", copyLetter: "कॉपी करें", download: "डाउनलोड", copied: "कॉपी हो गया!", letterTitle: "तैयार पत्र", submit: "Admin को भेजें", submitting: "भेज रहे हैं...", submitted: "✅ भेजा गया" },
  mr: { title: "तक्रार दाखल करा", step1: "प्रकार निवडा", step2: "तपशील भरा", step3: "आपले पत्र", name: "पूर्ण नाव *", phone: "संपर्क क्रमांक *", certName: "प्रमाणपत्र *", date: "अर्जाची तारीख *", office: "कार्यालयाचा पत्ता *", issue: "समस्येचे वर्णन *", generate: "पत्र तयार करा", back: "मागे", copyLetter: "कॉपी करा", download: "डाउनलोड", copied: "कॉपी झाले!", letterTitle: "तयार पत्र", submit: "Admin ला पाठवा", submitting: "पाठवत आहे...", submitted: "✅ पाठवले" },
};

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "2px solid #bfdbfe", borderRadius: 10,
  fontFamily: "inherit", fontSize: 13, color: "#334155",
  background: "#eff6ff", outline: "none",
  marginTop: 4, boxSizing: "border-box", transition: "border-color 0.2s",
};

const labelStyle = {
  fontSize: 12, fontWeight: 700,
  color: "#475569", display: "block", marginTop: 12,
};

export default function ComplaintPanel({ open, onClose, lang = "en" }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [fields, setFields] = useState({ applicant_name: "", contact_number: "", certificate_name: "", application_date: "", office_address: "", issue_details: "" });
  const [generatedLetter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [errors, setErrors] = useState({});

  const L = LABELS[lang] || LABELS.en;
  const templates = TEMPLATES[lang] || TEMPLATES.en;

  if (!open) return null;

  function validateFields() {
    const e = {};
    if (!fields.applicant_name.trim()) e.applicant_name = true;
    if (!fields.contact_number.trim() || !/^\d{10}$/.test(fields.contact_number.trim())) e.contact_number = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function resetAll() {
    setStep(1); setSelected(null);
    setFields({ applicant_name: "", contact_number: "", certificate_name: "", application_date: "", office_address: "", issue_details: "" });
    setLetter(""); setCopied(false); setSubmitted(false); setSubmitting(false); setSubmittedId("");
  }

  function handleClose() { resetAll(); onClose(); }

  function handleGenerate() {
    if (!validateFields()) return;
    let letter = selected.body;
    letter = letter.replace(/{applicant_name}/g, fields.applicant_name || "___");
    letter = letter.replace(/{contact_number}/g, fields.contact_number || "___");
    letter = letter.replace(/{certificate_name}/g, fields.certificate_name || "___");
    letter = letter.replace(/{application_date}/g, fields.application_date || "___");
    letter = letter.replace(/{office_address}/g, fields.office_address || "___");
    letter = letter.replace(/{issue_details}/g, fields.issue_details || "___");
    setLetter(letter);
    setStep(3);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generatedLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `complaint_${selected?.code}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const cid = "CMP-" + Date.now();
    const { error } = await supabase.from("complaints").insert({
      complaint_id: cid,
      complaint_code: selected?.code,
      complaint_type: selected?.title,
      applicant_name: fields.applicant_name,
      phone: fields.contact_number,
      certificate_name: fields.certificate_name || null,
      application_date: fields.application_date || null,
      office_address: fields.office_address || null,
      issue_details: fields.issue_details || null,
      letter_text: generatedLetter,
      language: lang,
      status: "pending",
    });
    if (error) { alert("Failed to submit. Please try again."); setSubmitting(false); return; }
    setSubmittedId(cid);
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
          background: "linear-gradient(135deg, #1e3a6e 0%, #2563eb 100%)",
          padding: "18px 20px 14px", flexShrink: 0, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #ff6b00 33%, #fff 33% 66%, #10b981 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare style={{ width: 18, height: 18 }} />
                {L.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {step === 1 ? L.step1 : step === 2 ? L.step2 : L.step3}
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

          {/* Step progress */}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                animate={{ background: step >= s ? "#ff6b00" : "rgba(255,255,255,0.25)" }}
                style={{ flex: 1, height: 4, borderRadius: 2 }}
              />
            ))}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
                {lang === "mr" ? "तक्रारीचा प्रकार निवडा:" : lang === "hi" ? "शिकायत का प्रकार चुनें:" : "Choose your complaint type:"}
              </div>
              {templates.map((tpl, i) => {
                const Icon = tpl.icon;
                return (
                  <motion.button
                    key={tpl.code}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ x: 4, boxShadow: "0 4px 20px rgba(37,99,235,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelected(tpl); setStep(2); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", marginBottom: 8,
                      background: "#eff6ff", border: "2px solid #bfdbfe",
                      borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                      textAlign: "left", transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "linear-gradient(135deg, #1e3a6e, #2563eb)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon style={{ width: 18, height: 18, color: "#fff" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a6e" }}>{tpl.title}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Code: {tpl.code}</div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: "#2563eb" }} />
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div style={{
                background: "#eff6ff", borderRadius: 12, padding: "12px 16px",
                marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
                border: "2px solid #bfdbfe",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg, #1e3a6e, #2563eb)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {(() => { const Icon = selected.icon; return <Icon style={{ width: 16, height: 16, color: "#fff" }} />; })()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e3a6e" }}>{selected.title}</span>
              </div>

              <label style={labelStyle}>{L.name}</label>
              <input style={{ ...inputStyle, borderColor: errors.applicant_name ? "#f87171" : "#bfdbfe" }}
                value={fields.applicant_name}
                onChange={(e) => setFields(p => ({ ...p, applicant_name: e.target.value }))}
                placeholder="e.g. Rahul Sharma"
              />

              <label style={labelStyle}>{L.phone}</label>
              <input style={{ ...inputStyle, borderColor: errors.contact_number ? "#f87171" : "#bfdbfe" }}
                value={fields.contact_number}
                onChange={(e) => setFields(p => ({ ...p, contact_number: e.target.value }))}
                placeholder="10-digit number" type="tel" maxLength={10}
              />
              {errors.contact_number && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>
                  Enter valid 10-digit number
                </div>
              )}

              {selected.needsCert && (
                <>
                  <label style={labelStyle}>{L.certName}</label>
                  <input style={inputStyle}
                    value={fields.certificate_name}
                    onChange={(e) => setFields(p => ({ ...p, certificate_name: e.target.value }))}
                    placeholder="e.g. Caste Certificate"
                  />
                </>
              )}

              {selected.needsDate && (
                <>
                  <label style={labelStyle}>{L.date}</label>
                  <input style={inputStyle} type="date"
                    value={fields.application_date}
                    onChange={(e) => setFields(p => ({ ...p, application_date: e.target.value }))}
                  />
                </>
              )}

              {selected.needsOffice && (
                <>
                  <label style={labelStyle}>{L.office}</label>
                  <input style={inputStyle}
                    value={fields.office_address}
                    onChange={(e) => setFields(p => ({ ...p, office_address: e.target.value }))}
                    placeholder="e.g. Tehsildar Office, Borivali"
                  />
                </>
              )}

              {selected.needsIssue && (
                <>
                  <label style={labelStyle}>{L.issue}</label>
                  <textarea style={{ ...inputStyle, height: 90, resize: "vertical" }}
                    value={fields.issue_details}
                    onChange={(e) => setFields(p => ({ ...p, issue_details: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                  />
                </>
              )}
              <div style={{ height: 16 }} />
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{
                background: "#f0fdf4", border: "2px solid #86efac",
                borderRadius: 10, padding: "10px 14px", marginBottom: 14,
                fontSize: 12, fontWeight: 700, color: "#16a34a",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <CheckCircle style={{ width: 14, height: 14 }} />
                Letter generated! Copy or download below.
              </div>

              <div style={{
                background: "#eff6ff", border: "2px solid #bfdbfe",
                borderRadius: 12, padding: "16px",
                fontSize: 13, lineHeight: 1.8, color: "#334155",
                whiteSpace: "pre-wrap", fontFamily: "inherit",
              }}>
                {generatedLetter}
              </div>

              {/* Submitted ID */}
              {submitted && submittedId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: 14, background: "#f0fdf4",
                    border: "2px solid #86efac", borderRadius: 14,
                    padding: "16px", textAlign: "center",
                  }}
                >
                  <CheckCircle style={{ width: 28, height: 28, color: "#16a34a", margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>
                    {lang === "mr" ? "तक्रार यशस्वीरित्या सादर झाली!" : lang === "hi" ? "शिकायत सफलतापूर्वक जमा हुई!" : "Complaint Submitted Successfully!"}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#15803d", letterSpacing: 2, background: "#fff", border: "1.5px solid #86efac", borderRadius: 8, padding: "8px 16px", display: "inline-block", marginTop: 4 }}>
                    {submittedId}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                    {lang === "mr" ? "स्थिती तपासण्यासाठी हा ID वापरा" : lang === "hi" ? "स्थिति जाँचने के लिए यह ID उपयोग करें" : "Use this ID to track your complaint"}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "12px 16px", borderTop: "2px solid #eff6ff", flexShrink: 0 }}>
          {step === 1 && (
            <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
              {lang === "mr" ? "वरीलपैकी एक प्रकार निवडा" : lang === "hi" ? "ऊपर से एक प्रकार चुनें" : "Select a type above to continue"}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", gap: 8 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                style={{ flex: 1, padding: "11px", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#2563eb", cursor: "pointer", fontFamily: "inherit" }}
              >
                ← {L.back}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg, #1e3a6e, #2563eb)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 15px rgba(37,99,235,0.3)" }}
              >
                {L.generate}
              </motion.button>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  style={{ flex: 1, padding: "10px", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#2563eb", cursor: "pointer", fontFamily: "inherit" }}
                >
                  ← {L.back}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  style={{ flex: 1, padding: "10px", background: copied ? "#f0fdf4" : "linear-gradient(135deg, #1e3a6e, #2563eb)", border: copied ? "2px solid #86efac" : "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: copied ? "#16a34a" : "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Copy style={{ width: 13, height: 13 }} />
                  {copied ? L.copied : L.copyLetter}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #059669, #10b981)", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Download style={{ width: 13, height: 13 }} />
                  {L.download}
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting || submitted}
                style={{ width: "100%", padding: "12px", background: submitted ? "#f0fdf4" : submitting ? "#e2e8f0" : "linear-gradient(135deg, #ff6b00, #e05500)", border: submitted ? "2px solid #86efac" : "none", borderRadius: 10, fontSize: 13, fontWeight: 800, color: submitted ? "#16a34a" : submitting ? "#94a3b8" : "#fff", cursor: submitted || submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: submitted || submitting ? "none" : "0 4px 15px rgba(255,107,0,0.3)" }}
              >
                <Send style={{ width: 15, height: 15 }} />
                {submitted ? L.submitted : submitting ? L.submitting : L.submit}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}