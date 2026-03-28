// src/components/Message.jsx
// Renders a single chat message. Each message has a `type` field:
//   text         → plain text bubble
//   lang_select  → language selection buttons
//   home_menu    → service selection (Certificates / Location)
//   cert_list    → scrollable list of certificates from backend
//   cert_detail  → CertCard with backend data
//   location_card→ LocationCard with office data
//   back_btn     → back navigation button
//   options      → clarification/confirmation options from backend

import CertCard from "./CertCard";
import LocationCard from "./LocationCard";

export default function Message({ msg, handlers, lang }) {
  const { onSelectLang, onSelectService, onSelectCert, onBack, onOptionClick, onViewPdf, onOpenComplaint, onOpenStatus, onOpenComplaintStatus, onGpsLocation } = handlers;
  const backHandler = () => onBack && onBack("cert");

  if (msg.from === "user") {
    return (
      <div className="msg-row user">
        <div className="bubble user">{msg.text}</div>
      </div>
    );
  }

  // BOT message
  const renderContent = () => {
    switch (msg.type) {
      case "text":
        return (
          <div className={`bubble bot ${msg.isError ? "error" : ""}`}>
            {msg.text}
          </div>
        );

      case "lang_select":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 8 }}>{msg.text}</div>
            <div className="options-wrap">
              <button className="opt-btn lang" onClick={() => onSelectLang("en")}>🇬🇧 English</button>
              <button className="opt-btn lang" onClick={() => onSelectLang("hi")}>🇮🇳 हिंदी</button>
              <button className="opt-btn lang" onClick={() => onSelectLang("mr")}>🟠 मराठी</button>
            </div>
          </div>
        );

      case "home_menu":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{msg.text}</div>
            <div className="options-wrap">
              <button className="opt-btn saffron" onClick={() => onSelectService("cert")}>
                📜 {lang === "hi" ? "प्रमाण पत्र" : lang === "mr" ? "प्रमाणपत्रे" : "Certificates"}
              </button>
              <button className="opt-btn green" onClick={() => onSelectService("location")}>
                📍 {lang === "hi" ? "निकटतम कार्यालय" : lang === "mr" ? "जवळचे कार्यालय" : "Nearest Office"}
              </button>
              <button className="opt-btn" onClick={() => onSelectService("status")}
                style={{ borderColor: "#0D9488", color: "#0D9488" }}
                onMouseEnter={(e) => { e.currentTarget.style.background="#0D9488"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background=""; e.currentTarget.style.color="#0D9488"; }}
              >
                📋 {lang === "hi" ? "आवेदन स्थिति जाँचें" : lang === "mr" ? "अर्जाची स्थिती तपासा" : "Check Application Status"}
              </button>
              <button className="opt-btn" onClick={() => onSelectService("complaint")}
                style={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                onMouseEnter={(e) => { e.currentTarget.style.background="#7C3AED"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background=""; e.currentTarget.style.color="#7C3AED"; }}
              >
                📝 {lang === "hi" ? "शिकायत दर्ज करें" : lang === "mr" ? "तक्रार दाखल करा" : "File a Complaint"}
              </button>
              <button className="opt-btn" onClick={onOpenComplaintStatus}
                style={{ borderColor: "#DB2777", color: "#DB2777" }}
                onMouseEnter={(e) => { e.currentTarget.style.background="#DB2777"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background=""; e.currentTarget.style.color="#DB2777"; }}
              >
                🔍 {lang === "hi" ? "शिकायत स्थिति जाँचें" : lang === "mr" ? "तक्रारीची स्थिती तपासा" : "Check Complaint Status"}
              </button>
            </div>
          </div>
        );

      case "cert_list":
        return (
          <div className="bubble bot" style={{ maxWidth: "92%" }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{msg.text}</div>
            <div className="cert-list">
              {(msg.certs || []).map((cert) => (
                <button
                  key={cert.certificate_id}
                  className="cert-list-item"
                  onClick={() => onSelectCert(cert)}
                >
                  📋 {cert.display_name[lang] || cert.display_name.en}
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => onBack("home")}>← Back to Menu</button>
          </div>
        );

      case "cert_detail":
        return (
          <div style={{ maxWidth: "92%" }}>
            <CertCard
              data={msg.data}
              sample={msg.sample}
              lang={lang}
              onViewPdf={onViewPdf}
              onBack={backHandler}
            />
            <button className="back-btn" onClick={backHandler}>← Back to List</button>
          </div>
        );

      case "location_ask":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 10, fontWeight: 600 }}>{msg.text}</div>
            <div className="options-wrap">
              {/* GPS button */}
              <button
                className="opt-btn green"
                onClick={onGpsLocation}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                📍 {lang === "hi" ? "मेरा वर्तमान स्थान उपयोग करें" : lang === "mr" ? "माझे सध्याचे स्थान वापरा" : "Use My Current Location"}
              </button>
              {/* Manual button */}
              <button
                className="opt-btn"
                onClick={() => {
                  // trigger manual flow — send a dummy signal via onOptionClick
                  onOptionClick("__manual_location__");
                }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                ✏️ {lang === "hi" ? "तालुका/गाँव मैन्युअल टाइप करें" : lang === "mr" ? "तालुका/गाव मॅन्युअली टाइप करा" : "Type Taluka / Village Manually"}
              </button>
            </div>
          </div>
        );

      case "location_card":
        return (
          <div style={{ maxWidth: "92%" }}>
            <LocationCard data={msg.data} />
            <button className="back-btn" onClick={() => onBack("home")}>← Back to Menu</button>
          </div>
        );

      // Clarification or confirmation options from backend
      case "options":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 8 }}>{msg.text}</div>
            <div className="options-wrap">
              {(msg.options || []).map((opt, i) => (
                <button key={i} className="opt-btn" onClick={() => onOptionClick(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case "back_btn":
        return (
          <button className="back-btn" onClick={() => onBack(msg.target)}>
            {msg.label || "← Back"}
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="msg-row bot">
      <div className="bot-avatar-sm">🤖</div>
      <div style={{ flex: 1, maxWidth: "88%" }}>{renderContent()}</div>
    </div>
  );
}