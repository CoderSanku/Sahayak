import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, ExternalLink } from "lucide-react";

export default function PdfModal({ url, title, onClose }) {
  if (!url) return null;

  return (
    <AnimatePresence>
      <motion.div
        onClick={onClose}
        className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-[90%] max-w-4xl h-[85vh] flex flex-col overflow-hidden
                     rounded-2xl border border-white/20 shadow-2xl"
          style={{
            background: "rgba(30, 58, 95, 0.80)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-400/20">
                <FileText className="w-4 h-4 text-blue-300" />
              </div>
              <span className="text-white font-semibold text-sm">
                {title || "Document Viewer"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Open in new tab */}
              <motion.a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-blue-500/30 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-white/70 hover:text-white" />
              </motion.a>

              {/* Close */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4 text-white/70 hover:text-white" />
              </motion.button>
            </div>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 relative">
            <iframe
              src={url}
              title="Document"
              className="absolute inset-0 w-full h-full"
              style={{ background: "#1a1a2e" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}