// src/components/PdfModal.jsx
// Opens a PDF inside the admin panel using an iframe — no new browser tab

export default function PdfModal({ url, title, onClose }) {
  if (!url) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 3000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: "90%", maxWidth: 800, height: "85vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{
          padding: "14px 20px", background: "linear-gradient(135deg, #1A237E, #0048A8)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{title || "📄 Document"}</span>
          <button 
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              width: 32, height: 32, borderRadius: "50%", fontSize: 16, cursor: "pointer",
            }}
          >✕</button>
        </div>
        <iframe 
          src={url} 
          title="Document" 
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }} 
        />
      </div>
    </div>
  );
}
