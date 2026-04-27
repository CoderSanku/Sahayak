import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, ExternalLink } from "lucide-react";

export default function PdfModal({ url, onClose }) {
  if (!url) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal-box"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                padding: 6,
                borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
              }}>
                <FileText style={{ width: 16, height: 16, color: "#fff" }} />
              </div>
              <span className="modal-title">Sample Certificate</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Open in new tab */}
              <motion.a
                href={url}
                target="_blank"
                rel="noreferrer"
                title="Open in new tab"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <ExternalLink style={{ width: 15, height: 15 }} />
              </motion.a>

              {/* Close */}
              <motion.button
                className="modal-close"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Close"
              >
                <X style={{ width: 16, height: 16 }} />
              </motion.button>
            </div>
          </div>

          {/* PDF iframe */}
          <iframe
            className="modal-frame"
            src={url}
            title="Sample PDF"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}