// src/components/PdfModal.jsx
// Opens a PDF inside the chatbot using an iframe — no new browser tab

export default function PdfModal({ url, onClose }) {
  if (!url) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">📄 Sample Certificate</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <iframe className="modal-frame" src={url} title="Sample PDF" />
      </div>
    </div>
  );
}