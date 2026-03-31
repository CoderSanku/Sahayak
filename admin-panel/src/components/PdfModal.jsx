import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, FileText, Loader2 } from "lucide-react";

export default function PdfModal({ url, title, onClose }) {
  if (!url) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        
        {/* Backdrop - Blurred and Darkened */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
        />

        {/* Slide-over Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-3xl bg-[#0F172A] border-l border-slate-800 shadow-2xl h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header Section */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#1E293B]/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight leading-none">
                  {title || "Document Preview"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                  Verification Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Utility Buttons */}
              <button 
                onClick={() => window.open(url, "_blank")}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 ml-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Container */}
          <div className="flex-1 relative bg-slate-900 group">
            
            {/* Loading Indicator (Shown behind the iframe) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Loading encrypted document...</span>
            </div>

            {/* The Iframe */}
            <iframe
              src={`${url}#toolbar=0`} // #toolbar=0 hides the default browser UI for a cleaner look
              title="PDF Document"
              className="relative z-10 w-full h-full border-none"
              onLoad={(e) => {
                // You could add logic here to hide the loader once the iframe finishes
              }}
            />
          </div>

          {/* Footer / Actions */}
          <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex justify-between items-center">
            <p className="text-[11px] text-slate-500 italic font-medium">
              Note: This document is for administrative review only.
            </p>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = url;
                link.download = title || "document.pdf";
                link.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
  