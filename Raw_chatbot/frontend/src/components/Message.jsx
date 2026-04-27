import { motion } from "framer-motion";
import {
  FileText, MapPin, ClipboardCheck, MessageSquare,
  Search, ArrowLeft, Globe, Languages,
} from "lucide-react";
import CertCard from "./CertCard";
import LocationCard from "./LocationCard";

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function Message({ msg, handlers, lang }) {
  const {
    onSelectLang, onSelectService, onSelectCert, onBack,
    onOptionClick, onViewPdf, onOpenComplaint, onOpenStatus,
    onOpenComplaintStatus, onGpsLocation,
  } = handlers;

  const backHandler = () => onBack && onBack("cert");

  if (msg.from === "user") {
    return (
      <motion.div
        className="msg-row user"
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="bubble user">{msg.text}</div>
      </motion.div>
    );
  }

  const renderContent = () => {
    switch (msg.type) {
      case "text":
        return (
          <div
            className={`bubble bot ${msg.isError ? "error" : ""}`}
            style={{ fontWeight: 700, fontSize: 14.5 }}
          >
            {msg.text}
          </div>
        );

      case "lang_select":
        return (
          <div className="bubble bot">
            <div style={{
              marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8,
              fontWeight: 700, fontSize: 14,
              color: "#1e3a6e",
            }}>
              <Languages style={{ width: 16, height: 16, flexShrink: 0 }} />
              {msg.text}
            </div>

            <div className="options-wrap" style={{ gap: 10 }}>
              {/* English */}
              <button
                className="opt-btn lang"
                onClick={() => onSelectLang("en")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  borderColor: "#2563eb", color: "#2563eb",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2563eb"; }}
              >
                <Globe style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>English</span>
              </button>

              {/* Hindi */}
              <button
                className="opt-btn lang"
                onClick={() => onSelectLang("hi")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  borderColor: "#f59e0b", color: "#f59e0b",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#f59e0b"; }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>🇮🇳</span>
                <span>हिंदी</span>
              </button>

              {/* Marathi */}
              <button
                className="opt-btn lang"
                onClick={() => onSelectLang("mr")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  borderColor: "#10b981", color: "#10b981",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#10b981"; }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>🟠</span>
                <span>मराठी</span>
              </button>
            </div>
          </div>
        );

      case "home_menu":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 14 }}>{msg.text}</div>
            <div className="options-wrap">
              <button
                className="opt-btn"
                onClick={() => onSelectService("cert")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#2563eb", color: "#2563eb" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2563eb"; }}
              >
                <FileText style={{ width: 14, height: 14, flexShrink: 0 }} />
                {lang === "hi" ? "प्रमाण पत्र" : lang === "mr" ? "प्रमाणपत्रे" : "Certificates"}
              </button>

              <button
                className="opt-btn"
                onClick={() => onSelectService("location")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#10b981", color: "#10b981" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#10b981"; }}
              >
                <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
                {lang === "hi" ? "निकटतम कार्यालय" : lang === "mr" ? "जवळचे कार्यालय" : "Nearest Office"}
              </button>

              <button
                className="opt-btn"
                onClick={() => onSelectService("status")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#0d9488", color: "#0d9488" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0d9488"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#0d9488"; }}
              >
                <ClipboardCheck style={{ width: 14, height: 14, flexShrink: 0 }} />
                {lang === "hi" ? "आवेदन स्थिति" : lang === "mr" ? "अर्ज स्थिती" : "Check Status"}
              </button>

              <button
                className="opt-btn"
                onClick={() => onSelectService("complaint")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#7c3aed", color: "#7c3aed" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#7c3aed"; }}
              >
                <MessageSquare style={{ width: 14, height: 14, flexShrink: 0 }} />
                {lang === "hi" ? "शिकायत दर्ज करें" : lang === "mr" ? "तक्रार दाखल करा" : "File Complaint"}
              </button>

              <button
                className="opt-btn"
                onClick={onOpenComplaintStatus}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#db2777", color: "#db2777" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#db2777"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#db2777"; }}
              >
                <Search style={{ width: 14, height: 14, flexShrink: 0 }} />
                {lang === "hi" ? "शिकायत स्थिति" : lang === "mr" ? "तक्रार स्थिती" : "Complaint Status"}
              </button>
            </div>
          </div>
        );

      case "cert_list":
        // Define your color rotation array
        const colors = ["cert-blue", "cert-green", "cert-purple", "cert-orange"];

        return (
          <div className="bubble bot" style={{ maxWidth: "92%" }}>
            <div style={{
              marginBottom: 10,
              fontWeight: 700,
              fontSize: "14.5px", // Matching your header font size
              color: "#1e3a6e"
            }}>
              {msg.text}
            </div>
            <div className="cert-list">
              {(msg.certs || []).map((cert, i) => (
                <button
                  key={cert.certificate_id}
                  // This line rotates the color class based on the index
                  className={`cert-list-item ${colors[i % colors.length]}`}
                  onClick={() => onSelectCert(cert)}
                >
                  <FileText
                    className="cert-icon"
                    style={{
                      width: 15,
                      height: 15,
                      flexShrink: 0,
                      transition: "color 0.2s",
                    }}
                  />
                  <span style={{ fontFamily: "inherit" }}>
                    {cert.display_name[lang] || cert.display_name.en}
                  </span>
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => onBack("home")}>
              <ArrowLeft style={{ width: 12, height: 12, flexShrink: 0 }} />
              Back to Menu
            </button>
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
            <button className="back-btn" onClick={backHandler}>
              <ArrowLeft style={{ width: 12, height: 12, flexShrink: 0 }} />
              Back to List
            </button>
          </div>
        );

      case "location_ask":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 10, fontWeight: 700 }}>{msg.text}</div>
            <div className="options-wrap">
              <button
                className="opt-btn"
                onClick={onGpsLocation}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#10b981", color: "#10b981" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#10b981"; }}
              >
                <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
                {lang === "hi" ? "मेरा स्थान" : lang === "mr" ? "माझे स्थान" : "Use My Location"}
              </button>

              <button
                className="opt-btn"
                onClick={() => onOptionClick("__manual_location__")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                ✏️ {lang === "hi" ? "मैन्युअल टाइप" : lang === "mr" ? "मॅन्युअल टाइप" : "Type Manually"}
              </button>
            </div>
          </div>
        );

      case "location_card":
        return (
          <div style={{ maxWidth: "92%" }}>
            <LocationCard data={msg.data} />
            <button className="back-btn" onClick={() => onBack("home")}>
              <ArrowLeft style={{ width: 12, height: 12, flexShrink: 0 }} />
              Back to Menu
            </button>
          </div>
        );

      case "options":
        return (
          <div className="bubble bot">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{msg.text}</div>
            <div className="options-wrap">
              {(msg.options || []).map((opt, i) => (
                <button
                  key={i}
                  className="opt-btn"
                  onClick={() => onOptionClick(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case "back_btn":
        return (
          <button className="back-btn" onClick={() => onBack(msg.target)}>
            <ArrowLeft style={{ width: 12, height: 12, flexShrink: 0 }} />
            {msg.label || "Back"}
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="msg-row bot"
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="bot-avatar-sm">🤖</div>
      <div style={{ flex: 1, maxWidth: "88%" }}>{renderContent()}</div>
    </motion.div>
  );
}