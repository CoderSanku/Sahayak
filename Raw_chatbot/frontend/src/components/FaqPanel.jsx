// src/components/FaqPanel.jsx
// Slide-in panel from the LEFT.
// Data comes from src/faqs.json (Option A — static JSON, no backend needed).
// Shows only question titles as a list; clicking one expands the answer.
// Categories: chatbot | certificates | location | complaint

import { useState } from "react";
import faqData from "../faqs.json";

const CATEGORY_LABELS = {
  en: { chatbot: "🤖 Using the Chatbot", certificates: "📜 Certificates", location: "📍 Office & Location", complaint: "📝 Complaints" },
  hi: { chatbot: "🤖 चैटबॉट का उपयोग", certificates: "📜 प्रमाण पत्र", location: "📍 कार्यालय और स्थान", complaint: "📝 शिकायतें" },
  mr: { chatbot: "🤖 चॅटबॉट वापर", certificates: "📜 प्रमाणपत्रे", location: "📍 कार्यालय व स्थान", complaint: "📝 तक्रारी" },
};

const PANEL_LABELS = {
  en: { title: "Frequently Asked Questions", subtitle: "Tap any question to see the answer", close: "✕", backToList: "← Back to questions", categories: "Browse by category", all: "All" },
  hi: { title: "अक्सर पूछे जाने वाले प्रश्न", subtitle: "उत्तर देखने के लिए कोई प्रश्न दबाएं", close: "✕", backToList: "← प्रश्नों पर वापस", categories: "श्रेणी के अनुसार देखें", all: "सभी" },
  mr: { title: "वारंवार विचारले जाणारे प्रश्न", subtitle: "उत्तर पाहण्यासाठी कोणताही प्रश्न दाबा", close: "✕", backToList: "← प्रश्नांकडे परत", categories: "श्रेणीनुसार पहा", all: "सर्व" },
};

const CATEGORIES = ["chatbot", "certificates", "location", "complaint"];

export default function FaqPanel({ open, onClose, lang = "en" }) {
  const [activeId, setActiveId]   = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const L  = PANEL_LABELS[lang]  || PANEL_LABELS.en;
  const CL = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
  const faqs = faqData.faqs;

  if (!open) return null;

  const filtered = activeCategory === "all"
    ? faqs
    : faqs.filter((f) => f.category === activeCategory);

  const activeFaq = faqs.find((f) => f.id === activeId);

  function handleClose() {
    setActiveId(null);
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)", zIndex: 1100,
      }} />

      {/* Slide-in from LEFT */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 400, maxWidth: "95vw",
        background: "#fff", zIndex: 1200,
        display: "flex", flexDirection: "column",
        boxShadow: "8px 0 32px rgba(26,35,126,0.18)",
        animation: "slideInLeft 0.25s ease",
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
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>❓ {L.title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                {activeId ? activeFaq?.question[lang] || activeFaq?.question.en : L.subtitle}
              </div>
            </div>
            <button onClick={handleClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              width: 32, height: 32, borderRadius: "50%", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>{L.close}</button>
          </div>

          {/* FAQ count badge */}
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
              background: "#EEF3FF", padding: "14px 18px",
              borderBottom: "1px solid #E5E7EB", flexShrink: 0,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A237E", lineHeight: 1.5 }}>
                {activeFaq.question[lang] || activeFaq.question.en}
              </div>
              <div style={{
                display: "inline-block", marginTop: 6,
                background: "#0048A8", color: "#fff",
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
              }}>
                {CL[activeFaq.category]}
              </div>
            </div>

            {/* Answer body */}
            <div style={{ flex: 1, padding: "18px", fontSize: 14, lineHeight: 1.8,
              color: "#1C1C2E", whiteSpace: "pre-wrap" }}>
              {activeFaq.answer[lang] || activeFaq.answer.en}
            </div>
          </div>
        ) : (
          /* ── QUESTION LIST VIEW ── */
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* Category filter pills */}
            <div style={{
              padding: "10px 14px 8px", borderBottom: "1px solid #F3F4F6",
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                {L.categories}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {/* All pill */}
                <CategoryPill
                  label={L.all}
                  active={activeCategory === "all"}
                  onClick={() => setActiveCategory("all")}
                  color="#1A237E"
                />
                {CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat}
                    label={CL[cat]}
                    active={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                    color={cat === "chatbot" ? "#0048A8" : cat === "certificates" ? "#FF6B00" : cat === "location" ? "#138808" : "#7C3AED"}
                  />
                ))}
              </div>
            </div>

            {/* Question list */}
            <div style={{ padding: "10px 12px" }}>
              {filtered.map((faq, idx) => (
                <button
                  key={faq.id}
                  onClick={() => setActiveId(faq.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 14px", marginBottom: 6,
                    background: "#FAFAFA", border: "1.5px solid #E5E7EB",
                    borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#0048A8";
                    e.currentTarget.style.background = "#EEF3FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.background = "#FAFAFA";
                  }}
                >
                  {/* Number badge */}
                  <span style={{
                    minWidth: 26, height: 26,
                    background: "linear-gradient(135deg, #1A237E, #0048A8)",
                    color: "#fff", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>

                  {/* Question text */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1C2E",
                    lineHeight: 1.4, flex: 1 }}>
                    {faq.question[lang] || faq.question.en}
                  </span>

                  {/* Arrow */}
                  <span style={{ color: "#0048A8", fontSize: 16, flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          padding: "12px 16px", borderTop: "1px solid #F3F4F6", flexShrink: 0,
        }}>
          {activeId ? (
            <button onClick={() => setActiveId(null)} style={{
              width: "100%", padding: "11px",
              background: "#F9FAFB", border: "1.5px solid #E5E7EB",
              borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#374151",
              cursor: "pointer", fontFamily: "inherit",
            }}>{L.backToList}</button>
          ) : (
            <div style={{ textAlign: "center", fontSize: 11, color: "#6B7280" }}>
              {lang === "mr" ? "प्रश्नावर क्लिक करा उत्तर पाहण्यासाठी"
                : lang === "hi" ? "उत्तर देखने के लिए प्रश्न पर क्लिक करें"
                : "Click any question above to read the answer"}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </>
  );
}

function CategoryPill({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 20, cursor: "pointer",
      fontFamily: "inherit", fontSize: 11, fontWeight: 700,
      border: `1.5px solid ${active ? color : "#E5E7EB"}`,
      background: active ? color : "#fff",
      color: active ? "#fff" : "#6B7280",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}