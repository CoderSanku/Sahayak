import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, Bot, FileText, MapPin,
  MessageSquare, ChevronRight, ArrowLeft, HelpCircle,
} from "lucide-react";
import faqData from "../faqs.json";

const CATEGORY_META = {
  chatbot: { icon: Bot, color: "#2563eb" },
  certificates: { icon: FileText, color: "#f59e0b" },
  location: { icon: MapPin, color: "#10b981" },
  complaint: { icon: MessageSquare, color: "#8b5cf6" },
};

const CATEGORY_LABELS = {
  en: { chatbot: "Using the Chatbot", certificates: "Certificates", location: "Office & Location", complaint: "Complaints" },
  hi: { chatbot: "चैटबॉट का उपयोग", certificates: "प्रमाण पत्र", location: "कार्यालय और स्थान", complaint: "शिकायतें" },
  mr: { chatbot: "चॅटबॉट वापर", certificates: "प्रमाणपत्रे", location: "कार्यालय व स्थान", complaint: "तक्रारी" },
};

const PANEL_LABELS = {
  en: { title: "Frequently Asked Questions", subtitle: "Tap any question to see the answer", backToList: "Back to questions", categories: "Browse by category", all: "All" },
  hi: { title: "अक्सर पूछे जाने वाले प्रश्न", subtitle: "उत्तर देखने के लिए प्रश्न दबाएं", backToList: "प्रश्नों पर वापस", categories: "श्रेणी देखें", all: "सभी" },
  mr: { title: "वारंवार विचारले जाणारे प्रश्न", subtitle: "उत्तर पाहण्यासाठी प्रश्न दाबा", backToList: "प्रश्नांकडे परत", categories: "श्रेणीनुसार पहा", all: "सर्व" },
};

const CATEGORIES = ["chatbot", "certificates", "location", "complaint"];

export default function FaqPanel({ open, onClose, lang = "en" }) {
  const [activeId, setActiveId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const L = PANEL_LABELS[lang] || PANEL_LABELS.en;
  const CL = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
  const faqs = faqData.faqs;

  if (!open) return null;

  const filtered = activeCategory === "all"
    ? faqs
    : faqs.filter((f) => f.category === activeCategory);

  const activeFaq = faqs.find((f) => f.id === activeId);

  function handleClose() { setActiveId(null); onClose(); }

  return (
    <>
      {/* ── OVERLAY ── */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 1100,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* ── PANEL ── */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 400, maxWidth: "95vw",
          background: "#fff", zIndex: 1200,
          display: "flex", flexDirection: "column",
          boxShadow: "8px 0 40px rgba(37,99,235,0.2)",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a6e 0%, #2563eb 100%)",
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
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle style={{ width: 18, height: 18 }} />
                {L.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {activeId
                  ? (activeFaq?.question[lang] || activeFaq?.question.en)
                  : L.subtitle}
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

          {!activeId && (
            <div style={{
              display: "inline-block", marginTop: 10,
              background: "rgba(255,255,255,0.15)", color: "#fff",
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            }}>
              {filtered.length} {lang === "mr" ? "प्रश्न" : lang === "hi" ? "प्रश्न" : "questions"}
            </div>
          )}
        </div>

        {/* ── ANSWER VIEW ── */}
        {activeId && activeFaq ? (
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* Question header */}
            <div style={{
              background: "#eff6ff", padding: "14px 18px",
              borderBottom: "2px solid #bfdbfe", flexShrink: 0,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e3a6e", lineHeight: 1.5 }}>
                {activeFaq.question[lang] || activeFaq.question.en}
              </div>

              {/* Category badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                background: CATEGORY_META[activeFaq.category]?.color || "#2563eb",
                color: "#fff", fontSize: 10, fontWeight: 700,
                padding: "2px 10px", borderRadius: 10,
              }}>
                {(() => {
                  const meta = CATEGORY_META[activeFaq.category];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return <Icon style={{ width: 10, height: 10 }} />;
                })()}
                {CL[activeFaq.category]}
              </div>
            </div>

            {/* Answer body */}
            <div style={{
              flex: 1, padding: "18px",
              fontSize: 14, lineHeight: 1.9,
              color: "#334155", whiteSpace: "pre-wrap",
            }}>
              {activeFaq.answer[lang] || activeFaq.answer.en}
            </div>
          </div>

        ) : (
          /* ── QUESTION LIST ── */
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* Category pills */}
            <div style={{
              padding: "12px 14px 10px",
              borderBottom: "2px solid #eff6ff",
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
              }}>
                {L.categories}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {/* ✅ All — slate gray so it doesn't clash with Chatbot blue */}
                <CategoryPill
                  label={L.all}
                  active={activeCategory === "all"}
                  onClick={() => setActiveCategory("all")}
                  color="#475569"
                />

                {CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <CategoryPill
                      key={cat}
                      label={CL[cat]}
                      active={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)}
                      color={meta?.color || "#2563eb"}
                      icon={meta?.icon}
                    />
                  );
                })}
              </div>
            </div>

            {/* ✅ FAQ list — plain buttons, NO framer motion = no lag */}
            <div style={{ padding: "10px 12px", overflowY: "auto" }}>
              {filtered.map((faq, idx) => (
                <button
                  key={faq.id}
                  onClick={() => setActiveId(faq.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", marginBottom: 6,
                    background: "#eff6ff", border: "2px solid #bfdbfe",
                    borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(37,99,235,0.15)";
                    e.currentTarget.style.borderColor = "#93c5fd";
                    e.currentTarget.style.background = "#dbeafe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#bfdbfe";
                    e.currentTarget.style.background = "#eff6ff";
                  }}
                >
                  {/* Number badge */}
                  <span style={{
                    minWidth: 28, height: 28,
                    background: "linear-gradient(135deg, #1e3a6e, #2563eb)",
                    color: "#fff", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>

                  {/* Question text */}
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: "#334155", lineHeight: 1.4, flex: 1,
                  }}>
                    {faq.question[lang] || faq.question.en}
                  </span>

                  {/* Arrow */}
                  <ChevronRight style={{ width: 16, height: 16, color: "#2563eb", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ padding: "12px 16px", borderTop: "2px solid #eff6ff", flexShrink: 0 }}>
          {activeId ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveId(null)}
              style={{
                width: "100%", padding: "11px",
                background: "#eff6ff", border: "2px solid #bfdbfe",
                borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#2563eb",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              {L.backToList}
            </motion.button>
          ) : (
            <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
              {lang === "mr"
                ? "प्रश्नावर क्लिक करा उत्तर पाहण्यासाठी"
                : lang === "hi"
                  ? "उत्तर देखने के लिए प्रश्न पर क्लिक करें"
                  : "Click any question to read the answer"}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Category Pill ──
function CategoryPill({ label, active, onClick, color, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 20, cursor: "pointer",
        fontFamily: "inherit", fontSize: 11, fontWeight: 700,
        border: `2px solid ${active ? color : "#bfdbfe"}`,
        background: active ? color : "#eff6ff",
        color: active ? "#fff" : "#64748b",
        display: "flex", alignItems: "center", gap: 4,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = color + "22"; // 13% opacity tint
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.color = color;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#eff6ff";
          e.currentTarget.style.borderColor = "#bfdbfe";
          e.currentTarget.style.color = "#64748b";
        }
      }}
    >
      {Icon && <Icon style={{ width: 11, height: 11 }} />}
      {label}
    </button>
  );
}